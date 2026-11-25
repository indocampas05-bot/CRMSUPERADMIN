import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import './Leads.css';
import {
  FaUsers, FaUserPlus, FaUserCheck, FaUserTimes, FaCheckCircle, FaThumbsUp,
  FaUpload, FaPlus, FaDownload, FaEdit, FaEye, FaTrash, FaSearch,
  FaExchangeAlt, FaHistory, FaArrowLeft, FaMapMarkerAlt,
  FaFilter, FaTimes,
  FaPhoneAlt, FaSpinner, FaIdBadge, FaEnvelope, FaUserTie, FaCopy,
  FaChartBar, FaCalendarDay, FaCalendarAlt,
  FaBuilding, FaFile, FaCalendar,
} from 'react-icons/fa';

import { superAdminService } from '../../services/superAdminService';
import { leadService } from '../../services/leadService';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STATUSES = ['New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 'Converted', 'No Response'];
const SOURCES = ['Web', 'Excel', 'Manual', 'Referral'];

const STATUS_STYLE = {
  'New': { bg: '#e0f2fe', color: '#0369a1' },
  'Contacted': { bg: '#fef9c3', color: '#92400e' },
  'Interested': { bg: '#dcfce7', color: '#15803d' },
  'Not Interested': { bg: '#fee2e2', color: '#b91c1c' },
  'Follow-up': { bg: '#fef3c7', color: '#b45309' },
  'Converted': { bg: '#d1fae5', color: '#047857' },
  'No Response': { bg: '#f3f4f6', color: '#6b7280' },
};

/* ------------------------------------------------------------------ */
/*  Dynamic Excel column engine                                       */
/*  ---------------------------------------------------------------   */
/*  The application never hard-codes any Excel columns. Whatever      */
/*  headings/columns are present in an uploaded file — including      */
/*  files with multi-row / merged-cell headers (e.g. a group header   */
/*  like "TELECALLING UPDATES" sitting above "UP1, UP2, UP3…") — are  */
/*  detected automatically and become the schema used to render,      */
/*  edit, export and search leads.                                    */
/*                                                                      */
/*  IMPORTANT: the schema — including COLUMN ORDER — is stored         */
/*  PER DISTRICT (not globally). Every time a file is uploaded for a  */
/*  district, that file's own column order becomes the new source of  */
/*  truth for that district, overwriting whatever was stored before.  */
/*  This means adding/renaming/reordering columns in a later upload   */
/*  is picked up automatically with zero code changes.                 */
/* ------------------------------------------------------------------ */

const SCHEMA_KEY_PREFIX = 'crm_lead_columns_schema';
const LOCAL_HISTORY_KEY = 'crm_upload_history';

// Column keys reserved by the CRM itself (never treated as "data columns")
const META_KEYS = new Set([
  'id', 'leadId', 'status', 'source', 'assignedTo', 'district', 'area',
  'campaign', 'uploadBatch', 'createdAt', 'updatedAt', 'notes',
]);

const NAME_HINTS = ['name', 'organization', 'school', 'company', 'student', 'contact person', 'institution'];
const MOBILE_HINTS = ['mobile', 'phone', 'contact no', 'contact number', 'whatsapp', 'ph no', 'tel', 'contact'];

// Schema is now keyed per-district so different districts (different
// uploaded files) never clobber each other's column order.
const getStoredSchema = (district) => {
  try {
    const raw = localStorage.getItem(`${SCHEMA_KEY_PREFIX}:${district}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
};

const setStoredSchema = (district, columns) => {
  try {
    // Store ONLY the uploaded Excel headers, in their original order.
    // Remove blank/repeated headers so legacy/duplicate columns cannot return.
    const seen = new Set();
    const cleanColumns = (Array.isArray(columns) ? columns : [])
      .map(c => String(c ?? '').trim())
      .filter(c => {
        const key = c.toLowerCase();
        if (!c || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    localStorage.setItem(`${SCHEMA_KEY_PREFIX}:${district}`, JSON.stringify(cleanColumns));
  } catch { /* ignore */ }
};

const recordLocalUploadHistory = (district, entry) => {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
    all.unshift({ ...entry, district });
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(all.slice(0, 300)));
  } catch { /* ignore */ }
};

const getLocalUploadHistory = (district) => {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
    return all.filter(h => h.district === district);
  } catch { return []; }
};

/* ---------------------------------------------------------------- */
/*  Header detection — merge-aware, multi-row capable                */
/* ---------------------------------------------------------------- */

// Reads the top of a worksheet into a plain string grid, then "fills"
// every cell that belongs to a merged range with that range's own value
// (SheetJS only stores the value on the merge's top-left cell). This
// lets us reconstruct group headers such as:
//   Row1: "TELECALLING UPDATES" merged across 11 columns
//   Row3: "UP1" | "UP2" | "UP3" | … (one real sub-header per column)
// without ever hard-coding a column name or position.
const buildFilledHeaderGrid = (ws, maxScanRows = 20) => {
  if (!ws || !ws['!ref']) return { grid: [], merges: [], nCols: 0, nRows: 0 };
  const range = XLSX.utils.decode_range(ws['!ref']);
  const nRows = Math.min(maxScanRows, range.e.r + 1);
  const nCols = range.e.c + 1;
  const grid = [];
  for (let r = 0; r < nRows; r++) {
    const row = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      const v = cell && cell.v !== undefined && cell.v !== null
        ? String(cell.v).replace(/\s+/g, ' ').trim()
        : '';
      row.push(v);
    }
    grid.push(row);
  }
  const merges = (ws['!merges'] || []).filter(m => m.s.r < nRows);
  merges.forEach(m => {
    const topVal = grid[m.s.r] ? grid[m.s.r][m.s.c] : '';
    for (let r = m.s.r; r <= Math.min(m.e.r, nRows - 1); r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (!grid[r][c]) grid[r][c] = topVal;
      }
    }
  });
  return { grid, merges, nCols, nRows };
};

// Finds the header block: an "anchor" row (the row with the most filled
// cells within the first 15 rows — almost always the main header row),
// then extends downward only as far as the file's own merged cells say
// the header actually spans (e.g. a 3-row-tall header). This is driven
// entirely by the workbook's own formatting, so it never mistakes a
// short data row or a section-divider row for part of the header.
const detectHeaderBlock = (grid, merges) => {
  let anchor = 0, bestCount = -1;
  const scanLimit = Math.min(grid.length, 15);
  for (let r = 0; r < scanLimit; r++) {
    const count = grid[r].filter(v => v !== '').length;
    if (count > bestCount) { bestCount = count; anchor = r; }
  }
  let blockEnd = anchor;
  merges.forEach(m => {
    if (m.s.r <= anchor && m.e.r >= anchor && m.e.r > blockEnd) {
      blockEnd = Math.min(m.e.r, grid.length - 1);
    }
  });
  return { anchor, blockEnd };
};

// Turns a raw header row into clean, unique column names, exactly as found
// in the file (blank/duplicate headers are safely auto-labeled).
const normalizeColumns = (headerRow) => {
  const seen = {};
  return (headerRow || []).map((h, i) => {
    let name = (h === null || h === undefined) ? '' : String(h).replace(/\s+/g, ' ').trim();
    if (!name) name = `Column ${i + 1}`;
    if (seen[name] != null) {
      seen[name] += 1;
      name = `${name} (${seen[name]})`;
    } else {
      seen[name] = 0;
    }
    return name;
  });
};

// For every column, walks the header block bottom-up and takes the
// deepest (most specific) non-empty label — e.g. "UP1" rather than the
// group label "TELECALLING UPDATES" above it — falling back to the
// nearest ancestor label when a column has no sub-header of its own.
// Columns are returned in their exact left-to-right order from the file.
const buildLeafColumns = (grid, anchor, blockEnd, nCols) => {
  const raw = [];
  for (let c = 0; c < nCols; c++) {
    let leaf = '';
    for (let r = blockEnd; r >= anchor; r--) {
      if (grid[r] && grid[r][c] && grid[r][c].trim()) {
        leaf = grid[r][c];
        break;
      }
    }
    raw.push(leaf || `Column ${c + 1}`);
  }
  return normalizeColumns(raw);
};

// Drops only the columns that have BOTH no real header text (i.e. they
// fell back to "Column N") AND no data in any row — these are genuinely
// blank spacer columns in the sheet. Any column with a real heading, or
// any column that actually carries data (even without a heading), is
// always kept.
// NOTE: This function is no longer used in the main flow to preserve all
// detected columns, including empty fallbacks. Keeping it for reference.
const trimBlankFallbackColumns = (columns, records) => {
  const keep = columns.filter((col) => {
    if (!/^Column \d+$/.test(col)) return true;
    return records.some(rec => (rec[col] || '').toString().trim() !== '');
  });
  if (keep.length === columns.length) return { columns, records };
  const keepSet = new Set(keep);
  const trimmedRecords = records.map(rec => {
    const r = {};
    keep.forEach(c => { r[c] = rec[c]; });
    return r;
  });
  return { columns: keep, records: trimmedRecords };
};

const sheetRowsToRecords = (rows, headerIdx, columns) => {
  const records = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const hasData = row.some(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (!hasData) continue;
    const rec = {};
    columns.forEach((col, ci) => {
      let v = row[ci];
      if (v === null || v === undefined) v = '';
      rec[col] = String(v).trim();
    });
    records.push(rec);
  }
  return records;
};

// End-to-end: given a workbook + a sheet name, returns the dynamically
// detected columns — IN THE EXACT ORDER THEY APPEAR IN THE FILE — and the
// row records. Nothing about the shape of the sheet is assumed in advance:
// single row headers, multi-row headers, and merged group headers all
// work, and whatever order the file's own columns are in is preserved
// end-to-end (parsing → storage → table → export → forms).
const parseWorkbookSheet = (wb, sheetName) => {
  const ws = wb.Sheets[sheetName];
  if (!ws || !ws['!ref']) return { error: 'This sheet is empty.' };

  const { grid, merges, nCols, nRows } = buildFilledHeaderGrid(ws, 20);
  if (nRows === 0 || nCols === 0) return { error: 'This sheet is empty.' };

  const { anchor, blockEnd } = detectHeaderBlock(grid, merges);
  const columns = buildLeafColumns(grid, anchor, blockEnd, nCols);

  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  let records = sheetRowsToRecords(allRows, blockEnd, columns);

  if (records.length === 0) {
    return { error: 'No data rows were found below the detected header row(s).' };
  }

  // IMPORTANT: Do NOT trim blank fallback columns and do NOT reorder them.
  // Keep every column exactly as detected, in exactly the order the file
  // presents them, even if a column currently has no data.
  // const trimmed = trimBlankFallbackColumns(columns, records);
  // return { columns: trimmed.columns, records: trimmed.records };

  return { columns, records };
};

const guessColumn = (columns, hints) => {
  const lower = columns.map(c => c.toLowerCase());
  for (const hint of hints) {
    const idx = lower.findIndex(c => c.includes(hint));
    if (idx !== -1) return columns[idx];
  }
  return null;
};

const cleanPhone = (val) => {
  if (!val) return '';
  const s = String(val);
  const m = s.match(/[0-9][0-9\s\-/]{6,}[0-9]/);
  const token = m ? m[0] : s;
  return token.replace(/[\s\-]/g, '').split('/')[0].trim();
};

// ─── Telecaller "UP" updates (UP1, UP2, …) ───────────────────────────────────
// The telecaller Call Panel saves every call update as UPn inside the lead's
// notes JSON. These helpers make sure every UPn - even UP6, UP7… that was not in
// the uploaded Excel - shows up as a column in the district table.
const UP_KEY_RE = /^up\s*[-_ ]?\s*(\d{1,4})$/i;
const upNumber = (key) => {
  const m = String(key ?? '').trim().match(UP_KEY_RE);
  return m ? Number(m[1]) : null;
};
const hasValue = (v) => v !== null && v !== undefined && String(v).trim() !== '';

// Recovers the dynamic field values for a lead, whether they were stored
// as a JSON record inside `notes`, or returned directly as extra keys on
// the lead object by the backend.
const getLeadRecord = (lead) => {
  let record = {};

  // The Excel row is stored as JSON in notes during import.
  // Read ONLY that JSON object for dynamic Excel fields.
  // Do not merge backend fields such as name, mobile, email, status,
  // district, etc. into the Excel record because that creates duplicate
  // or unexpected columns in the table.
  if (lead?.notes) {
    try {
      const parsed = JSON.parse(lead.notes);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        record = { ...parsed };
      }
    } catch {
      // notes is not JSON; leave the Excel record empty.
    }
  }

  // Only UPn values are filled in from other places, and only when the notes JSON
  // does not already have that UPn (notes JSON > excelData > lead.up1..up5).
  if (Object.keys(record).length > 0) {
    const extra = {};
    const collect = (key, value) => {
      const n = upNumber(key);
      if (n !== null && hasValue(value) && !hasValue(extra[n])) extra[n] = String(value).trim();
    };
    if (lead?.excelData && typeof lead.excelData === 'object') {
      Object.entries(lead.excelData).forEach(([k, v]) => collect(k, v));
    }
    [1, 2, 3, 4, 5].forEach((n) => collect(`up${n}`, lead?.[`up${n}`]));

    Object.entries(extra).forEach(([num, value]) => {
      const n = Number(num);
      const existingKey = Object.keys(record).find((k) => upNumber(k) === n);
      if (existingKey === undefined) record[`UP${n}`] = value;
      else if (!hasValue(record[existingKey])) record[existingKey] = value;
    });
  }

  return record;
};

// Read one cell. UP columns match by number ("UP1" = "up1" = "UP 1").
const getCellValue = (record, column) => {
  const n = upNumber(column);
  if (n === null) return record[column];
  const key = Object.keys(record).find((k) => upNumber(k) === n);
  return key === undefined ? undefined : record[key];
};

// Adds a column for every UPn found in the leads that the Excel schema does not have yet.
// New UP columns are placed right after the last existing UP column (or at the end).
const withUpdateColumns = (baseColumns, leads) => {
  const have = new Set(baseColumns.map((c) => upNumber(c)).filter((n) => n !== null));
  const missing = new Set();
  (leads || []).forEach((lead) => {
    Object.keys(getLeadRecord(lead)).forEach((key) => {
      const n = upNumber(key);
      if (n !== null && !have.has(n) && hasValue(getCellValue(getLeadRecord(lead), key))) missing.add(n);
    });
  });
  if (missing.size === 0) return baseColumns;

  const extra = [...missing].sort((x, y) => x - y).map((n) => `UP${n}`);
  let lastUp = -1;
  baseColumns.forEach((c, i) => { if (upNumber(c) !== null) lastUp = i; });
  if (lastUp === -1) return [...baseColumns, ...extra];
  return [...baseColumns.slice(0, lastUp + 1), ...extra, ...baseColumns.slice(lastUp + 1)];
};

// Columns created by saving a call update (not part of the uploaded Excel) always go LAST:
//   Excel columns  ->  Legacy Note / TC_NEXT_FOLLOWUP_NOTE  ->  UP1, UP2, UP3 ...
const isCallNoteColumn = (name) =>
  /^(legacy\s*note|tc[_\s-]*next[_\s-]*(re)?followup[_\s-]*note)$/i.test(String(name ?? '').trim());

const updateColumnsLast = (columns) => {
  const base = [];
  const notes = [];
  const ups = [];
  (columns || []).forEach((c) => {
    if (upNumber(c) !== null) ups.push(c);
    else if (isCallNoteColumn(c)) notes.push(c);
    else base.push(c);
  });
  ups.sort((a, b) => upNumber(a) - upNumber(b));
  return [...base, ...notes, ...ups];
};

// The per-district column derivation now happens inside DistrictView.
// We no longer rely on a global schema for the column list — see
// getStoredSchema()/setStoredSchema() above, and the `columns` useMemo
// inside DistrictView below.
const getCurrentUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.username || u.fullName || 'Super Admin';
  } catch { return 'Super Admin'; }
};

/* ------------------------------------------------------------------ */
/*  Modal Component                                                   */
/* ------------------------------------------------------------------ */
const Modal = ({ show, title, onClose, children, wide }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><FaTimes size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const StatChip = ({ icon, label, val, color }) => (
  <div className="stat-chip">
    <div className="stat-chip-icon" style={{ color }}>{icon}</div>
    <div>
      <div className="stat-chip-label">{label}</div>
      <div className="stat-chip-val" style={{ color }}>{val}</div>
    </div>
  </div>
);

const KpiCard = ({ icon, label, value, subtext, color, bgColor }) => (
  <div className="kpi-card" style={{ background: bgColor || 'var(--white)' }}>
    <div className="kpi-icon" style={{ color }}>{icon}</div>
    <div className="kpi-content">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  District Card                                                     */
/* ------------------------------------------------------------------ */
const DistrictCard = ({ district, onClick }) => (
  <button
    className="district-card"
    onClick={onClick}
    title={`${district.leadCount || 0} leads · ${district.assignedByName ? `Assigned to ${district.assignedByName}` : 'Not assigned'}`}
  >
    <div className="district-card-icon"><FaMapMarkerAlt size={18} /></div>
    <div className="district-card-name">{district.name}</div>
    <span className={`district-card-badge ${district.assignedByName ? 'badge-assigned' : 'badge-unassigned'}`}>
      {district.assignedByName || 'Not Assigned'}
    </span>
  </button>
);

/* ------------------------------------------------------------------ */
/*  Lead Form — fully dynamic, one input per detected Excel column,    */
/*  rendered in the same order as the district's stored schema         */
/* ------------------------------------------------------------------ */
const LeadForm = ({ initial, district, districts, columns, onSave, onClose }) => {
  const [record, setRecord] = useState(
    initial?.record || Object.fromEntries(columns.map(c => [c, '']))
  );
  const [meta, setMeta] = useState({
    district: initial?.district || district,
    status: initial?.status || 'New',
    source: initial?.source || 'Manual',
  });

  const nameCol = useMemo(() => guessColumn(columns, NAME_HINTS), [columns]);
  const mobileCol = useMemo(() => guessColumn(columns, MOBILE_HINTS), [columns]);

  const setField = (col, v) => setRecord(r => ({ ...r, [col]: v }));
  const setMetaField = (k, v) => setMeta(m => ({ ...m, [k]: v }));

  const canSave =
    (!nameCol || (record[nameCol] || '').trim()) &&
    (!mobileCol || (record[mobileCol] || '').trim());

  return (
    <div className="lead-form">
      <div className="form-grid-2">
        {columns.map(col => (
          <div className="form-group" key={col}>
            <label>{col}{(col === nameCol || col === mobileCol) ? ' *' : ''}</label>
            <input
              value={record[col] || ''}
              onChange={e => setField(col, e.target.value)}
              placeholder={col}
            />
          </div>
        ))}
        <div className="form-group">
          <label>District</label>
          <select value={meta.district} onChange={e => setMetaField('district', e.target.value)}>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={meta.status} onChange={e => setMetaField('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Source</label>
          <select value={meta.source} onChange={e => setMetaField('source', e.target.value)}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={!canSave} onClick={() => onSave({ record, ...meta })}>
          Save Lead
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Upload Modal — auto-detects headers/columns from the file itself, */
/*  including multi-row / merged-cell headers, and lets the person    */
/*  pick a sheet when the workbook has more than one. Column order    */
/*  shown in the preview is exactly the file's own left-to-right      */
/*  order, since that becomes the district's stored schema on import. */
/* ------------------------------------------------------------------ */
const UploadModal = ({ district, existingMobiles, isReplace, onConfirm, onClose }) => {
  const [rawFile, setRawFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const buildPreview = (wb, sheetName, file) => {
    const parsed = parseWorkbookSheet(wb, sheetName);
    if (parsed.error) { setPreview({ error: parsed.error }); return; }

    const { columns, records } = parsed;
    const nameCol = guessColumn(columns, NAME_HINTS);
    const mobileCol = guessColumn(columns, MOBILE_HINTS);

    const seen = new Set();
    const valid = [], dup = [], invalid = [];
    records.forEach((rec) => {
      const nameVal = nameCol ? rec[nameCol] : Object.values(rec).find(v => v);
      const mobileClean = cleanPhone(mobileCol ? rec[mobileCol] : '');
      if (!nameVal && !mobileClean) { invalid.push(rec); return; }
      const dupKey = mobileClean || JSON.stringify(rec);
      if (mobileClean && (existingMobiles.has(mobileClean) || seen.has(dupKey))) {
        dup.push({ name: nameVal, mobile: mobileClean }); return;
      }
      seen.add(dupKey);
      valid.push({ record: rec, name: nameVal || '', mobile: mobileClean });
    });

    setPreview({ fileName: file.name, columns, nameCol, mobileCol, valid, dup, invalid });
  };

  // Picks a sensible default sheet when the workbook has several: the one
  // with the richest grid (rows × columns) is almost always the real lead
  // sheet rather than a small side-sheet — but the person can switch.
  const pickDefaultSheet = (wb) => {
    let best = wb.SheetNames[0], bestScore = -1;
    wb.SheetNames.forEach(name => {
      const ws = wb.Sheets[name];
      if (!ws || !ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      const score = (range.e.r + 1) * (range.e.c + 1);
      if (score > bestScore) { bestScore = score; best = name; }
    });
    return best;
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawFile(file);
    setPreview(null);
    setWorkbook(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: false });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          setPreview({ error: 'File is empty.' });
          return;
        }
        const defaultSheet = pickDefaultSheet(wb);
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setSelectedSheet(defaultSheet);
        buildPreview(wb, defaultSheet, file);
      } catch {
        setPreview({ error: 'Could not read this file. Please check the format and try again.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSheetChange = (name) => {
    setSelectedSheet(name);
    if (workbook && rawFile) buildPreview(workbook, name, rawFile);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(rawFile, preview);
    } finally {
      setSubmitting(false);
    }
  };

  const previewCols = preview && !preview.error ? preview.columns.slice(0, 5) : [];
  const moreCols = preview && !preview.error ? Math.max(0, preview.columns.length - 5) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="muted-text">
        {isReplace ? 'Replace the existing leads for' : 'Upload an Excel/CSV file of leads for'} <strong>{district}</strong>.
        {' '}Columns — and their order — are detected automatically from the file's own headings, including
        multi-row or grouped headings, and become this district's schema exactly as uploaded.
      </p>
      {!preview ? (
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
      ) : preview.error ? (
        <p style={{ color: '#b91c1c', fontSize: 13 }}>{preview.error}</p>
      ) : (
        <>
          {sheetNames.length > 1 && (
            <div className="form-group">
              <label>Sheet</label>
              <select value={selectedSheet} onChange={e => handleSheetChange(e.target.value)}>
                {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
            <span>✅ {preview.valid.length} ready</span>
            <span>⚠ {preview.dup.length} duplicates</span>
            <span>❌ {preview.invalid.length} invalid</span>
          </div>
          <p className="muted-text" style={{ fontSize: 12 }}>
            Detected {preview.columns.length} column{preview.columns.length !== 1 ? 's' : ''} (in file order): {preview.columns.join(', ')}
          </p>
          <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table className="leads-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  {previewCols.map(c => <th key={c}>{c}</th>)}
                  {moreCols > 0 && <th>+{moreCols} more</th>}
                </tr>
              </thead>
              <tbody>
                {preview.valid.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    {previewCols.map(c => <td key={c}>{r.record[c] || '-'}</td>)}
                    {moreCols > 0 && <td>…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="form-actions">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        {preview && !preview.error && (
          <button className="btn-primary" disabled={preview.valid.length === 0 || submitting}
            onClick={handleConfirm}>
            {submitting ? 'Uploading…' : `${isReplace ? 'Replace & Import' : 'Upload'} ${preview.valid.length} Leads`}
          </button>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Assign District Modal                                             */
/* ------------------------------------------------------------------ */
const AssignDistrictModal = ({ mode, district, currentTelecaller, totalLeads, telecallers, onConfirm, onClose }) => {
  const [username, setUsername] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {mode === 'reassign' && (
        <div className="reassign-flow">
          <div className="reassign-box">{currentTelecaller || 'Unassigned'}</div>
          <div className="reassign-arrow">↓</div>
        </div>
      )}
      <div className="form-group">
        <label>{mode === 'reassign' ? 'New Telecaller' : 'Select Telecaller'}</label>
        <select value={username} onChange={e => setUsername(e.target.value)}>
          <option value="">Choose telecaller</option>
          {telecallers.map(t => <option key={t.id} value={t.username}>{t.fullName} ({t.username})</option>)}
        </select>
      </div>
      <p className="muted-text">
        {mode === 'reassign'
          ? `All ${totalLeads.toLocaleString()} leads in ${district} will move to the new telecaller.`
          : `All ${totalLeads.toLocaleString()} leads in ${district} will belong to this telecaller.`}
      </p>
      <div className="form-actions">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={!username} onClick={() => onConfirm(username)}>
          {mode === 'reassign' ? 'Reassign District' : 'Assign District'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Edit Excel Modal                                                  */
/* ------------------------------------------------------------------ */
const EditExcelModal = ({ district, duplicateCount, onView, onAddLead, onDedupe, onReplace, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <p className="muted-text">Manage the uploaded lead data for <strong>{district}</strong>.</p>
    <button className="edit-excel-option" onClick={onView}>
      <FaEye size={14} /> <div><div className="eo-title">View Uploaded Data</div><div className="eo-sub">Jump to the lead table below</div></div>
    </button>
    <button className="edit-excel-option" onClick={onAddLead}>
      <FaPlus size={12} /> <div><div className="eo-title">Add New Lead</div><div className="eo-sub">Manually add a lead to this district</div></div>
    </button>
    <button className="edit-excel-option" onClick={onDedupe}>
      <FaCopy size={12} /> <div><div className="eo-title">Delete Duplicate Leads</div><div className="eo-sub">{duplicateCount} duplicate mobile number{duplicateCount !== 1 ? 's' : ''} found</div></div>
    </button>
    <button className="edit-excel-option" onClick={onReplace}>
      <FaUpload size={12} /> <div><div className="eo-title">Replace All Leads</div><div className="eo-sub">Delete everything here and upload a new file</div></div>
    </button>
    <div className="form-actions"><button className="btn-outline" onClick={onClose}>Close</button></div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  District Statistics Modal                                         */
/* ------------------------------------------------------------------ */
const DistrictStatisticsModal = ({ district, leads, assignment, telecallers, uploadHistory, onClose }) => {
  const telecaller = assignment ? telecallers.find(t => t.username === assignment.assignedTo) : null;
  const latestUpload = uploadHistory[0] || null;

  const totalLeads = leads.length;
  const converted = leads.filter(l => l.status === 'Converted').length;
  const interested = leads.filter(l => l.status === 'Interested').length;
  const followup = leads.filter(l => l.status === 'Follow-up').length;
  const notInterested = leads.filter(l => l.status === 'Not Interested').length;
  const noResponse = leads.filter(l => l.status === 'No Response').length;
  const pending = leads.filter(l => l.status === 'New' || l.status === 'Contacted').length;

  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;
  const followupRate = totalLeads > 0 ? ((followup / totalLeads) * 100).toFixed(1) : 0;
  const pendingRate = totalLeads > 0 ? ((pending / totalLeads) * 100).toFixed(1) : 0;
  const completionRate = totalLeads > 0 ? (((totalLeads - pending) / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div className="district-stats-modal">
      <div className="stats-header">
        <h3><FaMapMarkerAlt size={16} /> {district} District</h3>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={<FaUsers size={18} />} label="Total Leads" value={totalLeads.toLocaleString()} color="#7b1113" bgColor="#fdf2f2" />
        <KpiCard icon={<FaSpinner size={16} />} label="Pending" value={pending.toLocaleString()} color="#b45309" bgColor="#fffbeb" />
        <KpiCard icon={<FaCheckCircle size={16} />} label="Converted" value={converted.toLocaleString()} color="#15803d" bgColor="#f0fdf4" />
        <KpiCard icon={<FaThumbsUp size={16} />} label="Interested" value={interested.toLocaleString()} color="#15803d" bgColor="#f0fdf4" />
      </div>

      <div className="kpi-grid">
        <KpiCard icon={<FaCalendarAlt size={16} />} label="Follow-up" value={followup.toLocaleString()} color="#d97706" bgColor="#fffbeb" />
        <KpiCard icon={<FaUserTimes size={16} />} label="Not Interested" value={notInterested.toLocaleString()} color="#b91c1c" bgColor="#fef2f2" />
        <KpiCard icon={<FaUserTimes size={16} />} label="No Response" value={noResponse.toLocaleString()} color="#6b7280" bgColor="#f9fafb" />
      </div>

      <div className="stats-progress">
        <div className="progress-header">
          <span className="progress-title">📊 District Progress</span>
          <span className="progress-percent">{completionRate}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
        </div>
        <div className="progress-labels">
          <span>{completionRate}% Leads Processed</span>
          <span>{pendingRate}% Leads Pending</span>
        </div>
      </div>

      <div className="stats-two-column">
        <div className="stats-column">
          <div className="stats-section">
            <h4>📈 Performance</h4>
            <div className="stats-grid">
              <div className="stat-item"><span className="stat-label">Conversion Rate</span><span className="stat-value">{conversionRate}%</span></div>
              <div className="stat-item"><span className="stat-label">Follow-up Rate</span><span className="stat-value">{followupRate}%</span></div>
              <div className="stat-item"><span className="stat-label">Pending Rate</span><span className="stat-value">{pendingRate}%</span></div>
            </div>
          </div>
          <div className="stats-section">
            <h4>📋 Lead Status Distribution</h4>
            <div className="status-distribution">
              {STATUSES.map(s => (
                <div key={s} className="dist-row">
                  <span className="dist-label">{s}</span>
                  <span className="dist-value">{leads.filter(l => l.status === s).length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stats-column">
          <div className="stats-section">
            <h4>👨‍💼 District Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <FaBuilding size={12} className="info-icon" />
                <div><span className="info-label">District Name</span><span className="info-value">{district}</span></div>
              </div>
              <div className="info-item">
                <FaUserTie size={12} className="info-icon" />
                <div><span className="info-label">Assigned Telecaller</span><span className="info-value">{assignment?.assignedByName || 'Not Assigned'}</span></div>
              </div>
              <div className="info-item">
                <FaIdBadge size={12} className="info-icon" />
                <div><span className="info-label">Username</span><span className="info-value">{telecaller?.username || '—'}</span></div>
              </div>
              <div className="info-item">
                <FaCalendar size={12} className="info-icon" />
                <div><span className="info-label">Assigned Date</span><span className="info-value">{assignment?.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString('en-IN') : '—'}</span></div>
              </div>
              <div className="info-item">
                <FaFile size={12} className="info-icon" />
                <div><span className="info-label">Latest Excel File</span><span className="info-value">{latestUpload?.fileName || 'Not Uploaded'}</span></div>
              </div>
              <div className="info-item">
                <FaCalendarDay size={12} className="info-icon" />
                <div><span className="info-label">Uploaded At</span><span className="info-value">{latestUpload ? new Date(latestUpload.uploadedAt).toLocaleString('en-IN') : '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Add District Modal                                                */
/* ------------------------------------------------------------------ */
const AddDistrictModal = ({ existingDistricts, onConfirm, onClose }) => {
  const [newDistrict, setNewDistrict] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    const trimmed = newDistrict.trim();
    if (!trimmed) { setError('Please enter a district name'); return; }
    if (existingDistricts.includes(trimmed)) { setError('This district already exists'); return; }
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } catch (e) {
      setError(e.message || 'Failed to add district');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="muted-text">Add a new district to the system. The district will be available for lead assignment and management.</p>
      <div className="form-group">
        <label>District Name</label>
        <input
          value={newDistrict}
          onChange={e => { setNewDistrict(e.target.value); setError(''); }}
          placeholder="Enter district name (e.g., Tirunelveli)"
        />
        {error && <span style={{ color: '#b91c1c', fontSize: 12 }}>{error}</span>}
      </div>
      <div className="form-actions">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={submitting} onClick={handleConfirm}>
          {submitting ? 'Adding…' : 'Add District'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  District View (Detail)                                            */
/* ------------------------------------------------------------------ */
const DistrictView = ({ districtName, districtObj, employees, onBack, onDistrictsChanged, showToast }) => {
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [uploadHistory, setUploadHistory] = useState([]);

  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('All Status');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selected, setSelected] = useState([]);

  const [showUpload, setShowUpload] = useState(false);
  const [showReplaceUpload, setShowReplaceUpload] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditExcel, setShowEditExcel] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const tableRef = useRef(null);

  // silent = background refresh (no "Loading leads..." flash, no error toast)
  const loadLeads = useCallback(async (silent = false) => {
    if (!silent) setLoadingLeads(true);
    try {
      const data = await leadService.getLeadsByDistrict(districtName);
      setLeads(data);
    } catch (e) {
      if (!silent) showToast('Failed to load leads: ' + e.message, 'error');
    } finally {
      if (!silent) setLoadingLeads(false);
    }
  }, [districtName, showToast]);

  const loadHistory = useCallback(async () => {
    try {
      let backendAll = [];
      try { backendAll = await superAdminService.getUploadHistory(); } catch { /* endpoint may not exist */ }
      const backendForDistrict = (backendAll || []).filter(h => h.district === districtName);
      const localForDistrict = getLocalUploadHistory(districtName);
      const merged = [
        ...backendForDistrict,
        ...localForDistrict.filter(l => !backendForDistrict.some(b => b.id === l.id)),
      ];
      setUploadHistory(merged.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
    } catch (e) {
      showToast('Failed to load upload history: ' + e.message, 'error');
    }
  }, [districtName, showToast]);

  useEffect(() => { loadLeads(); loadHistory(); }, [loadLeads, loadHistory]);

  // Pick up updates (UP1, UP2…) that telecallers saved from the Call Panel
  // whenever the admin comes back to this tab/window.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') loadLeads(true); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadLeads]);

  const refreshAll = async () => {
    await Promise.all([loadLeads(), loadHistory()]);
    onDistrictsChanged();
  };

  // IMPORTANT: The uploaded Excel schema is the ONLY source of truth.
  // Never merge backend lead fields or fields from older uploads into this
  // list. The order here is exactly the order stored from the latest Excel
  // upload for this district.
  const columns = useMemo(() => {
    const schema = getStoredSchema(districtName);

    if (Array.isArray(schema) && schema.length > 0) {
      // Excel schema first, then one extra column for every UPn saved by telecallers.
      return updateColumnsLast(withUpdateColumns(schema, leads));
    }

    // Legacy fallback: derive ONLY from the JSON Excel records.
    // Never use lead.name, lead.mobile, lead.email, status, leadId, etc.
    const result = [];
    const seen = new Set();

    leads.forEach(lead => {
      const record = getLeadRecord(lead);
      Object.keys(record).forEach(key => {
        const column = String(key ?? '').trim();
        const normalized = column.toLowerCase();
        if (column && !seen.has(normalized)) {
          seen.add(normalized);
          result.push(column);
        }
      });
    });

    return updateColumnsLast(withUpdateColumns(result, leads));
  }, [leads, districtName]);
  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase().trim();
    const rec = getLeadRecord(l);
    const recStr = Object.values(rec).join(' ').toLowerCase();
    const matchQ = !q || recStr.includes(q) || (l.mobile || '').includes(q) || (l.name || '').toLowerCase().includes(q);
    const matchS = statusF === 'All Status' || l.status === statusF;
    return matchQ && matchS;
  }), [leads, search, statusF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => ({
    total: leads.length,
    interested: leads.filter(l => l.status === 'Interested').length,
    followup: leads.filter(l => l.status === 'Follow-up').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    notInterested: leads.filter(l => l.status === 'Not Interested').length,
    pending: leads.filter(l => l.status === 'New' || l.status === 'Contacted').length,
  }), [leads]);

  const duplicateCount = useMemo(() => {
    const seen = new Set(); let dupes = 0;
    leads.forEach(l => {
      const key = cleanPhone(l.mobile);
      if (!key) return;
      if (seen.has(key)) dupes++; else seen.add(key);
    });
    return dupes;
  }, [leads]);

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length ? [] : paginated.map(l => l.id));

  const existingMobiles = useMemo(() => new Set(leads.map(l => cleanPhone(l.mobile)).filter(Boolean)), [leads]);

  const assignment = districtObj?.assignedTo ? {
    assignedTo: districtObj.assignedTo,
    assignedByName: districtObj.assignedByName,
    assignedDate: districtObj.assignedDate,
  } : null;

  const handleExport = () => {
    // Export exactly the uploaded Excel columns in the stored order.
    // CRM metadata such as Status is intentionally not added as a new column.
    const headers = [...columns];
    const rows = [headers, ...filtered.map(l => {
      const rec = getLeadRecord(l);
      return columns.map(c => getCellValue(rec, c) || '');
    })];
    const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${districtName}_leads.csv`;
    a.click();
    showToast('Leads exported.');
  };

  /* ---- Handlers ---- */

  // Bulk import runs entirely client-side against the row-level lead API so
  // ANY column structure works — the uploaded file's own headings AND
  // ORDER become this district's schema (stored per-district), replacing
  // whatever schema existed before. This is the "source of truth" the
  // table, export and forms all read from via the `columns` memo above.
  const handleImport = async (file, preview) => {
    if (!file || !preview || preview.error) return;
    try {
      setStoredSchema(districtName, preview.columns);
      const batchId = `batch_${Date.now()}`;
      let imported = 0;

      for (const item of preview.valid) {
        const leadData = {
          name: item.name || Object.values(item.record).find(v => v) || 'Unnamed',
          mobile: item.mobile || '',
          email: '',
          campaign: districtName,
          status: 'New',
          assignedTo: assignment?.assignedTo || 'Unassigned',
          source: 'Excel',
          notes: JSON.stringify(item.record),
          district: districtName,
          area: districtName,
          uploadBatch: batchId,
        };
        try {
          await leadService.createLead(leadData);
          imported++;
        } catch { /* keep going with the remaining rows */ }
      }

      const totalRecords = preview.valid.length + preview.dup.length + preview.invalid.length;
      const historyEntry = {
        id: batchId,
        fileName: file.name,
        uploadedBy: getCurrentUserName(),
        uploadedAt: new Date().toISOString(),
        totalRecords,
        importedRecords: imported,
        status: imported > 0 ? 'SUCCESS' : 'FAILED',
      };
      try {
        if (superAdminService.recordUpload) {
          await superAdminService.recordUpload({ ...historyEntry, district: districtName });
        } else {
          recordLocalUploadHistory(districtName, historyEntry);
        }
      } catch {
        recordLocalUploadHistory(districtName, historyEntry);
      }

      await refreshAll();
      setShowUpload(false);
      setShowReplaceUpload(false);
      setShowEditExcel(false);
      showToast(`Imported ${imported} of ${preview.valid.length} leads into ${districtName}.`,
        imported < preview.valid.length ? 'info' : 'success');
    } catch (e) {
      showToast('Import failed: ' + e.message, 'error');
    }
  };

  const handleReplaceConfirm = async (file, preview) => {
    try {
      if (leads.length > 0) {
        const res = await leadService.deleteMultipleLeads(leads.map(l => l.id));
        if ((res?.deletedCount ?? 0) < leads.length) {
          throw new Error('Could not delete all existing leads, so the new file was not imported.');
        }
      }
      await handleImport(file, preview);
    } catch (e) {
      showToast('Replace failed: ' + e.message, 'error');
    }
  };

  const handleAssign = async (username) => {
    try {
      await superAdminService.assignDistrict(districtName, username);
      onDistrictsChanged();
      setShowAssign(false);
      showToast(`${districtName} assigned.`);
    } catch (e) {
      showToast('Assign failed: ' + e.message, 'error');
    }
  };

  const handleReassign = async (username) => {
    try {
      await superAdminService.assignDistrict(districtName, username);
      onDistrictsChanged();
      setShowReassign(false);
      showToast(`${districtName} reassigned.`);
    } catch (e) {
      showToast('Reassign failed: ' + e.message, 'error');
    }
  };

  const handleDeleteBatch = async (uploadId, fileName) => {
    const batchLeadIds = leads.filter(l => l.uploadBatch === uploadId).map(l => l.id);
    if (batchLeadIds.length === 0) {
      showToast('No leads from this upload remain (already deleted).', 'info');
      return;
    }
    if (!window.confirm(`Delete ${batchLeadIds.length} lead(s) imported from "${fileName}"?`)) return;
    try {
      const res = await leadService.deleteMultipleLeads(batchLeadIds);
      const count = res?.deletedCount ?? 0;
      await refreshAll();
      if (count === 0) showToast('No leads were deleted.', 'error');
      else showToast(`Deleted ${count} leads from that upload.`, 'info');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  const handleSaveLead = async (id, form) => {
    const { record: formRecord, district: fDistrict, status, source } = form;
    // Keep everything telecallers saved (UP updates, follow-up note…) that is not a form field.
    let record = formRecord;
    if (id) {
      const existingLead = leads.find(l => l.id === id);
      const merged = { ...getLeadRecord(existingLead) };
      Object.entries(formRecord).forEach(([key, value]) => {
        const n = upNumber(key);
        if (n !== null) Object.keys(merged).forEach(k => { if (upNumber(k) === n) delete merged[k]; });
        merged[key] = value;
      });
      record = merged;
    }
    const nameCol = guessColumn(columns, NAME_HINTS);
    const mobileCol = guessColumn(columns, MOBILE_HINTS);
    const leadData = {
      name: (nameCol && record[nameCol]) || Object.values(record).find(v => v) || 'Unnamed',
      mobile: cleanPhone(mobileCol ? record[mobileCol] : '') || '',
      email: '',
      campaign: fDistrict,
      status,
      assignedTo: assignment?.assignedTo || 'Unassigned',
      source,
      notes: JSON.stringify(record),
      district: fDistrict,
      area: fDistrict,
    };
    try {
      if (id) {
        // The backend looks leads up by the business leadId (e.g. SCH2611244248), not the Mongo _id.
        const target = leads.find(l => l.id === id);
        await leadService.updateLead(target?.leadId || id, leadData);
        showToast('Lead updated.');
      } else {
        await leadService.createLead(leadData);
        showToast('Lead added.');
      }
      await refreshAll();
      setEditLead(null);
      setShowAdd(false);
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadService.deleteLead(id);
      await refreshAll();
      showToast('Lead deleted.', 'info');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.length} selected leads?`)) return;
    try {
      const res = await leadService.deleteMultipleLeads(selected);
      const count = res?.deletedCount ?? 0;
      const total = selected.length;
      setSelected([]);
      await refreshAll();
      if (count === 0) showToast('No leads were deleted.', 'error');
      else showToast(count === total ? `${count} leads deleted.` : `${count} of ${total} leads deleted.`, 'info');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  const handleDedupe = async () => {
    const seen = new Set();
    const dupIds = [];
    leads.forEach(l => {
      const key = cleanPhone(l.mobile);
      if (!key) return;
      if (seen.has(key)) dupIds.push(l.id); else seen.add(key);
    });
    if (dupIds.length === 0) { showToast('No duplicates found.', 'info'); setShowEditExcel(false); return; }
    try {
      const res = await leadService.deleteMultipleLeads(dupIds);
      const count = res?.deletedCount ?? 0;
      await refreshAll();
      setShowEditExcel(false);
      showToast(`Removed ${count} duplicate lead(s).`);
    } catch (e) {
      showToast('Dedupe failed: ' + e.message, 'error');
    }
  };

  return (
    <div className="district-view">
      <div className="district-view-header">
        <button className="btn-back" onClick={onBack}><FaArrowLeft size={12} /> Back to Districts</button>
        <h2 className="district-view-title"><FaMapMarkerAlt size={18} style={{ color: 'var(--primary)' }} /> {districtName} District</h2>
      </div>

      <div className="district-summary-bar">
        <div className="ds-item"><span className="ds-label">District</span><span className="ds-val">{districtName}</span></div>
        <div className="ds-item"><span className="ds-label">Total Leads</span><span className="ds-val">{stats.total.toLocaleString()}</span></div>
        <div className="ds-item"><span className="ds-label">Assigned Telecaller</span><span className="ds-val">{assignment?.assignedByName || 'Not Assigned'}</span></div>
        <div className="ds-item"><span className="ds-label">Uploads</span><span className="ds-val">{uploadHistory.length}</span></div>
      </div>

      <div className="panel-card district-management-card">
        <div className="panel-title">District Management</div>
        <div className="district-actions-grid">
          <button className="da-btn" onClick={() => setShowUpload(true)}>
            <FaUpload size={16} className="da-icon" /><span>Upload Excel</span>
          </button>
          <button className="da-btn" onClick={() => setShowAssign(true)}>
            <FaUserCheck size={16} className="da-icon" /><span>Assign District</span>
          </button>
          <button className="da-btn" disabled={!assignment} onClick={() => setShowReassign(true)}>
            <FaExchangeAlt size={14} className="da-icon" /><span>Reassign District</span>
          </button>
          <button className="da-btn" onClick={() => setShowEditExcel(true)}>
            <FaEdit size={14} className="da-icon" /><span>Edit Excel</span>
          </button>
          <button className="da-btn" onClick={() => setShowHistory(true)}>
            <FaHistory size={14} className="da-icon" /><span>Upload History</span>
          </button>
          <button className="da-btn" onClick={() => setShowStatistics(true)}>
            <FaChartBar size={14} className="da-icon" /><span>District Statistics</span>
          </button>
        </div>
      </div>

      <div className="panel-card telecaller-panel">
        <div className="panel-title">Assigned Telecaller</div>
        {!assignment ? (
          <p className="muted-text">No telecaller assigned to this district yet. Use "Assign District" above.</p>
        ) : (() => {
          const tc = employees.find(e => e.username === assignment.assignedTo);
          return (
            <div className="tc-detail-card">
              <div className="tc-detail-avatar">{(assignment.assignedByName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</div>
              <div className="tc-detail-info">
                <div className="tc-detail-name">{assignment.assignedByName}</div>
                <div className="tc-detail-row"><FaIdBadge size={12} /> Username: {tc?.username || assignment.assignedTo}</div>
                <div className="tc-detail-row"><FaPhoneAlt size={12} /> {tc?.phone || '—'}</div>
                <div className="tc-detail-row"><FaEnvelope size={12} /> {tc?.email || '—'}</div>
                <div className="tc-detail-row"><FaUserTie size={12} /> Assigned: {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString('en-IN') : '—'}</div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="stats-bar">
        <StatChip icon={<FaUsers size={20} />} label="Total Leads" val={stats.total} color="#7b1113" />
        <StatChip icon={<FaThumbsUp size={18} />} label="Interested" val={stats.interested} color="#2563eb" />
        <StatChip icon={<FaSpinner size={18} />} label="Follow-up" val={stats.followup} color="#d97706" />
        <StatChip icon={<FaCheckCircle size={18} />} label="Converted" val={stats.converted} color="#047857" />
        <StatChip icon={<FaUserPlus size={18} />} label="Pending" val={stats.pending} color="#b45309" />
        <StatChip icon={<FaUserTimes size={18} />} label="Not Interested" val={stats.notInterested} color="#b91c1c" />
      </div>

      <div className="leads-main" ref={tableRef}>
        <div className="filter-bar">
          <div className="search-wrap">
            <FaSearch size={12} className="search-ico" />
            <input className="filter-search" placeholder="Search across all lead columns..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
            <option>All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="table-toolbar">
          <span className="total-count">Leads: <strong>{filtered.length.toLocaleString()}</strong></span>
          <div className="toolbar-right">
            {selected.length > 0 && (
              <button className="btn-danger-sm" onClick={handleDeleteSelected}>🗑 Delete ({selected.length})</button>
            )}
            <button className="btn-outline-sm" onClick={handleExport}>
              <FaDownload size={12} className="btn-icon" /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <FaPlus size={12} className="btn-icon" /> Add Lead
            </button>
          </div>
        </div>

        
<div className="table-wrap">
  <table
    className="leads-table"
    style={{
      minWidth: Math.max(900, (columns.length + 2) * 150),
      tableLayout: 'auto',
    }}
  >
    <thead>
      <tr>
        <th className="select-col">
          <input
            type="checkbox"
            checked={
              selected.length === paginated.length &&
              paginated.length > 0
            }
            onChange={toggleAll}
          />
        </th>

        {columns.map((c) => {
          const isUpColumn = upNumber(c) !== null;

          return (
            <th
              key={c}
              className={isUpColumn ? 'up-update-header' : ''}
            >
              {c}
            </th>
          );
        })}

        <th className="actions-col">Actions</th>
      </tr>
    </thead>

    <tbody>
      {loadingLeads ? (
        <tr>
          <td colSpan={columns.length + 2} className="empty-row">
            Loading leads...
          </td>
        </tr>
      ) : paginated.length === 0 ? (
        <tr>
          <td colSpan={columns.length + 2} className="empty-row">
            No leads found. Try uploading an Excel file or adjusting filters.
          </td>
        </tr>
      ) : (
        paginated.map((lead) => {
          const rec = getLeadRecord(lead);

          return (
            <tr
              key={lead.id}
              className={
                selected.includes(lead.id) ? 'row-selected' : ''
              }
            >
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                />
              </td>

              {columns.map((c) => {
                const cell = getCellValue(rec, c);
                const isUpColumn = upNumber(c) !== null;
                const value = hasValue(cell) ? String(cell) : '-';

                return (
                  <td
                    key={c}
                    className={`dyn-cell ${
                      isUpColumn ? 'up-update-cell' : ''
                    }`}
                    title={value}
                  >
                    <div className="dyn-cell-content">
                      {value}
                    </div>
                  </td>
                );
              })}

              <td>
                <div className="action-group">
                  <button
                    className="act-btn"
                    title="Edit"
                    onClick={() => setEditLead(lead)}
                  >
                    <FaEdit size={12} />
                  </button>

                  <button
                    className="act-btn danger"
                    title="Delete"
                    onClick={() => handleDeleteLead(lead.id)}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>


        <div className="pagination-bar">
          <span className="rows-select">Page {page} of {totalPages}</span>
          <div className="page-nums">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal show={showUpload} title={`Upload Excel — ${districtName}`} onClose={() => setShowUpload(false)}>
        <UploadModal district={districtName} existingMobiles={existingMobiles}
          onConfirm={handleImport}
          onClose={() => setShowUpload(false)} />
      </Modal>

      <Modal show={showReplaceUpload} title={`Replace Leads — ${districtName}`} onClose={() => setShowReplaceUpload(false)}>
        <UploadModal district={districtName} existingMobiles={new Set()} isReplace
          onConfirm={handleReplaceConfirm}
          onClose={() => setShowReplaceUpload(false)} />
      </Modal>

      <Modal show={showAssign} title="Assign District to Telecaller" onClose={() => setShowAssign(false)}>
        <AssignDistrictModal mode="assign" district={districtName} currentTelecaller={null} totalLeads={stats.total}
          telecallers={employees}
          onConfirm={handleAssign}
          onClose={() => setShowAssign(false)} />
      </Modal>

      <Modal show={showReassign} title="Reassign District" onClose={() => setShowReassign(false)}>
        <AssignDistrictModal mode="reassign" district={districtName} currentTelecaller={assignment?.assignedByName} totalLeads={stats.total}
          telecallers={employees.filter(e => e.username !== assignment?.assignedTo)}
          onConfirm={handleReassign}
          onClose={() => setShowReassign(false)} />
      </Modal>

      <Modal show={showEditExcel} title={`Edit Excel — ${districtName}`} onClose={() => setShowEditExcel(false)}>
        <EditExcelModal
          district={districtName}
          duplicateCount={duplicateCount}
          onView={() => { setShowEditExcel(false); tableRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          onAddLead={() => { setShowEditExcel(false); setShowAdd(true); }}
          onDedupe={handleDedupe}
          onReplace={() => { setShowEditExcel(false); setShowReplaceUpload(true); }}
          onClose={() => setShowEditExcel(false)}
        />
      </Modal>

      <Modal show={showHistory} title={`Upload History — ${districtName}`} onClose={() => setShowHistory(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {uploadHistory.length === 0 ? (
            <p className="muted-text">No uploads yet for this district.</p>
          ) : uploadHistory.map(h => (
            <div key={h.id} className="history-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{h.fileName}</div>
                <div className="muted-text">{new Date(h.uploadedAt).toLocaleString('en-IN')} · by {h.uploadedBy}</div>
                <div style={{ marginTop: 4, fontSize: 12.5 }}>
                  {h.importedRecords}/{h.totalRecords} imported · <span style={{ color: h.status === 'SUCCESS' ? '#15803d' : h.status === 'FAILED' ? '#b91c1c' : '#b45309' }}>{h.status}</span>
                </div>
              </div>
              <button className="btn-danger-sm" onClick={() => handleDeleteBatch(h.id, h.fileName)}><FaTrash size={12} /> Delete leads</button>
            </div>
          ))}
          <div className="form-actions"><button className="btn-outline" onClick={() => setShowHistory(false)}>Close</button></div>
        </div>
      </Modal>

      <Modal show={showStatistics} title={`📊 ${districtName} District Statistics`} onClose={() => setShowStatistics(false)} wide>
        <DistrictStatisticsModal
          district={districtName}
          leads={leads}
          assignment={assignment}
          telecallers={employees}
          uploadHistory={uploadHistory}
          onClose={() => setShowStatistics(false)}
        />
      </Modal>

      <Modal show={!!editLead} title="Edit Lead" onClose={() => setEditLead(null)}>
        {editLead && (
          <LeadForm
            initial={{
              record: columns.reduce((acc, c) => {
                const r = getLeadRecord(editLead);
                acc[c] = getCellValue(r, c) || '';
                return acc;
              }, {}),
              district: editLead.district || districtName,
              status: editLead.status,
              source: editLead.source || 'Manual',
            }}
            columns={columns}
            district={districtName}
            districts={[districtName]}
            onSave={(form) => handleSaveLead(editLead.id, form)}
            onClose={() => setEditLead(null)} />
        )}
      </Modal>

      <Modal show={showAdd} title="Add New Lead" onClose={() => setShowAdd(false)}>
        <LeadForm district={districtName} districts={[districtName]} columns={columns}
          onSave={(form) => handleSaveLead(null, form)}
          onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Leads Component                                              */
/* ------------------------------------------------------------------ */
const Leads = () => {
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtSearch, setDistrictSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showAddDistrict, setShowAddDistrict] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const loadDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    try {
      const data = await superAdminService.getDistricts();
      setDistricts(data);
    } catch (e) {
      showToast('Failed to load districts: ' + e.message, 'error');
    } finally {
      setLoadingDistricts(false);
    }
  }, [showToast]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await superAdminService.getEmployees();
      setEmployees(data);
    } catch (e) {
      showToast('Failed to load telecallers: ' + e.message, 'error');
    }
  }, [showToast]);

  useEffect(() => { loadDistricts(); loadEmployees(); }, [loadDistricts, loadEmployees]);

  const filteredDistricts = useMemo(() =>
    districts.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase().trim())),
    [districtSearch, districts]);

  const overallStats = useMemo(() => ({
    total: districts.reduce((sum, d) => sum + (d.leadCount || 0), 0),
    assignedDistricts: districts.filter(d => d.assignedTo).length,
    unassignedDistricts: districts.filter(d => !d.assignedTo).length,
    telecallers: employees.length,
  }), [districts, employees]);

  const handleAddDistrict = async (name) => {
    await superAdminService.createDistrict(name);
    await loadDistricts();
    showToast(`District "${name}" added successfully!`);
    setShowAddDistrict(false);
  };

  if (selectedDistrict) {
    const districtObj = districts.find(d => d.name === selectedDistrict) || { name: selectedDistrict };
    return (
      <div className="leads-page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
        <DistrictView
          districtName={selectedDistrict}
          districtObj={districtObj}
          employees={employees}
          onBack={() => setSelectedDistrict(null)}
          onDistrictsChanged={loadDistricts}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="leads-page">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="leads-header">
        <div>
          <h1 className="leads-title">Leads</h1>
          <div className="breadcrumb">Manage district-wise leads across Tamil Nadu & Puducherry</div>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddDistrict(true)}>
            <FaPlus size={12} className="btn-icon" /> Add District
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <StatChip icon={<FaUsers size={20} />} label="Total Leads" val={overallStats.total.toLocaleString()} color="#7b1113" />
        <StatChip icon={<FaUserCheck size={18} />} label="Districts Assigned" val={overallStats.assignedDistricts} color="#15803d" />
        <StatChip icon={<FaUserPlus size={18} />} label="Districts Unassigned" val={overallStats.unassignedDistricts} color="#b45309" />
        <StatChip icon={<FaUserTimes size={18} />} label="Total Telecallers" val={overallStats.telecallers} color="#6d28d9" />
      </div>

      <div className="district-search-bar">
        <FaSearch size={12} className="search-ico" />
        <input
          className="filter-search"
          placeholder="Search districts..."
          value={districtSearch}
          onChange={e => setDistrictSearch(e.target.value)}
        />
        <span className="district-count-badge">{filteredDistricts.length} / {districts.length} districts</span>
      </div>

      <div className="district-grid">
        {loadingDistricts ? (
          <div className="empty-row" style={{ gridColumn: '1 / -1' }}>Loading districts...</div>
        ) : filteredDistricts.length === 0 ? (
          <div className="empty-row" style={{ gridColumn: '1 / -1' }}>
            {districts.length === 0
              ? 'No districts yet. Click "Add District" to create one, or upload a lead file to create one automatically.'
              : `No districts match "${districtSearch}"`}
          </div>
        ) : filteredDistricts.map(d => (
          <DistrictCard key={d.id || d.name} district={d} onClick={() => setSelectedDistrict(d.name)} />
        ))}
      </div>

      <Modal show={showAddDistrict} title="Add New District" onClose={() => setShowAddDistrict(false)}>
        <AddDistrictModal
          existingDistricts={districts.map(d => d.name)}
          onConfirm={handleAddDistrict}
          onClose={() => setShowAddDistrict(false)}
        />
      </Modal>

      <div className="leads-footer">
        <span>© 2026 CRM Call Center. All rights reserved.</span>
        <span>Version 4.3.0 — Dynamic Excel Mapping (per-district, file-order-preserving schema)</span>
      </div>
    </div>
  );
};

export default Leads;