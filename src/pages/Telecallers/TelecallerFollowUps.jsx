// src/pages/Telecallers/TelecallerFollowUps.jsx
// Super Admin: read-only view of every follow-up that belongs to ONE telecaller.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiX,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiXCircle,
} from 'react-icons/fi';
import { leadService } from '../../services/leadService';

// ───────────────────────── helpers ─────────────────────────
const pad = (n) => String(n).padStart(2, '0');

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const firstValue = (...values) =>
  values.find((v) => v !== undefined && v !== null && String(v).trim() !== '');

const parseNotes = (lead) => {
  const raw = lead?.notes;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : { LEGACY_NOTE: raw };
    } catch {
      return { LEGACY_NOTE: raw };
    }
  }
  return {};
};

// Accepts yyyy-MM-dd, yyyy-MM-ddTHH:mm, dd-MM-yyyy (and anything Date can parse).
const toDateAndTime = (value) => {
  if (!value) return { date: '', time: '' };
  const raw = String(value).trim();

  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: m[4] || '' };

  m = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:[T ](\d{2}:\d{2}))?/);
  if (m) return { date: `${m[3]}-${m[2]}-${m[1]}`, time: m[4] || '' };

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }
  return { date: '', time: '' };
};

const fmtDate = (d) => {
  if (!d) return '--';
  const [y, m, day] = d.split('-');
  return y && m && day ? `${day}-${m}-${y}` : d;
};

const latestUpdate = (notes) => {
  const ups = Object.entries(notes)
    .filter(([k, v]) => /^UP\s*\d+$/i.test(k) && String(v ?? '').trim())
    .sort((a, b) => Number(b[0].replace(/\D/g, '')) - Number(a[0].replace(/\D/g, '')));
  return ups.length ? `${ups[0][0]}: ${ups[0][1]}` : '';
};

const VALID_STATUS = ['Completed', 'Missed', 'Cancelled'];

const mapLeadToFollowUp = (lead) => {
  const { date, time } = toDateAndTime(lead?.tcNextRefollowupDate);
  if (!date) return null;

  const notes = parseNotes(lead);
  const excel = lead?.excelData && typeof lead.excelData === 'object' ? lead.excelData : {};
  const savedStatus = String(notes.TC_NEXT_FOLLOWUP_STATUS || '');

  return {
    key: lead.leadId || lead.id,
    leadId: lead.leadId || '--',
    organization: String(firstValue(lead.school, lead.name, excel.School, excel.Organization, 'Unknown')),
    contact: String(firstValue(lead.contactPerson, excel['Contact Person'], excel.Name, '--')),
    mobile: String(firstValue(lead.mobile, lead.phoneNumber, excel['Phone Number'], '--')),
    district: String(firstValue(lead.district, excel.District, '--')),
    date,
    time,
    note: String(firstValue(notes.TC_NEXT_FOLLOWUP_NOTE, notes.tcNextRefollowupNote, 'Follow-up scheduled')),
    status: VALID_STATUS.includes(savedStatus) ? savedStatus : 'Pending',
    leadStatus: String(firstValue(lead.status, '--')),
    lastUpdate: latestUpdate(notes),
  };
};

// ───────────────────────── styles ─────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
  },
  box: {
    backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 1180, maxHeight: '92vh',
    display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #f0f0f5', flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 700, color: '#1e1e2f', margin: 0 },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  iconBtn: {
    background: '#f5f6fa', border: 'none', width: 36, height: 36, borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 20, overflow: 'auto' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 },
  statCard: (active, color) => ({
    border: `2px solid ${active ? color : '#eef0f5'}`, borderRadius: 12, padding: '10px 14px',
    background: active ? `${color}12` : '#fff', cursor: 'pointer', textAlign: 'left',
  }),
  statLabel: { fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 },
  statValue: (color) => ({ fontSize: 24, fontWeight: 700, color, marginTop: 2 }),
  toolbar: { display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  search: {
    flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8,
    border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', background: '#fafafa',
  },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', width: '100%', fontSize: 14 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb',
    background: '#fff', borderRadius: 10, padding: '0 14px', height: 40, cursor: 'pointer', fontSize: 14,
  },
  tableWrap: { overflowX: 'auto', border: '1px solid #eef0f5', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 },
  th: {
    textAlign: 'left', padding: '10px 12px', background: '#f9fafb', color: '#6b7280', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', borderBottom: '1px solid #eef0f5',
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
  badge: (bg, fg) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    background: bg, color: fg, whiteSpace: 'nowrap',
  }),
  empty: { padding: 40, textAlign: 'center', color: '#6b7280' },
};

const STATUS_COLORS = {
  Pending: ['#fff7ed', '#c2410c'],
  Completed: ['#ecfdf5', '#047857'],
  Missed: ['#fef2f2', '#b91c1c'],
  Cancelled: ['#f3f4f6', '#4b5563'],
  Overdue: ['#fef2f2', '#b91c1c'],
};

// ───────────────────────── component ─────────────────────────
const TelecallerFollowUps = ({ telecaller, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const username = telecaller?.username;
  const displayName = telecaller?.fullName || telecaller?.name || username;

  const load = useCallback(async () => {
    if (!username) {
      setError('This telecaller has no username.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await leadService.getTelecallerFollowUps(username);
      const list = Array.isArray(data) ? data : [];
      const mapped = list.map(mapLeadToFollowUp).filter(Boolean);
      mapped.sort((a, b) =>
        `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));
      setRows(mapped);
    } catch (e) {
      setError(e.message || 'Unable to load follow-ups.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const today = localToday();

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === 'Pending').length,
    today: rows.filter((r) => r.date === today && r.status === 'Pending').length,
    overdue: rows.filter((r) => r.date < today && r.status === 'Pending').length,
    completed: rows.filter((r) => r.status === 'Completed').length,
    missed: rows.filter((r) => r.status === 'Missed').length,
  }), [rows, today]);

  const visible = useMemo(() => {
    let data = rows;
    if (filter === 'Pending') data = data.filter((r) => r.status === 'Pending');
    if (filter === 'Today') data = data.filter((r) => r.date === today && r.status === 'Pending');
    if (filter === 'Overdue') data = data.filter((r) => r.date < today && r.status === 'Pending');
    if (filter === 'Completed') data = data.filter((r) => r.status === 'Completed');
    if (filter === 'Missed') data = data.filter((r) => r.status === 'Missed');

    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((r) =>
        [r.organization, r.contact, r.mobile, r.leadId, r.district, r.note, r.lastUpdate]
          .some((v) => String(v || '').toLowerCase().includes(q)));
    }
    return data;
  }, [rows, filter, search, today]);

  const exportCsv = () => {
    const header = ['Lead ID', 'Organization', 'Contact', 'Mobile', 'District', 'Date', 'Time', 'Status', 'Note', 'Last Update'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.map(esc).join(',')].concat(
      visible.map((r) => [r.leadId, r.organization, r.contact, r.mobile, r.district,
        fmtDate(r.date), r.time, r.status, r.note, r.lastUpdate].map(esc).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `followups-${username}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { key: 'All', label: 'Total', value: stats.total, color: '#4f46e5', icon: <FiCalendar size={13} /> },
    { key: 'Pending', label: 'Pending', value: stats.pending, color: '#d97706', icon: <FiClock size={13} /> },
    { key: 'Today', label: 'Today', value: stats.today, color: '#2563eb', icon: <FiPhone size={13} /> },
    { key: 'Overdue', label: 'Overdue', value: stats.overdue, color: '#dc2626', icon: <FiAlertCircle size={13} /> },
    { key: 'Completed', label: 'Completed', value: stats.completed, color: '#059669', icon: <FiCheckCircle size={13} /> },
    { key: 'Missed', label: 'Missed', value: stats.missed, color: '#9333ea', icon: <FiXCircle size={13} /> },
  ];

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.box} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <h2 style={S.title}>{displayName}'s Follow-ups</h2>
            <div style={S.sub}>
              @{username}
              {telecaller?.districts?.length ? ` · ${telecaller.districts.join(', ')}` : ''}
            </div>
          </div>
          <button style={S.iconBtn} onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>

        <div style={S.body}>
          <div style={S.stats}>
            {cards.map((c) => (
              <button key={c.key} style={S.statCard(filter === c.key, c.color)} onClick={() => setFilter(c.key)}>
                <div style={S.statLabel}>{c.icon} {c.label}</div>
                <div style={S.statValue(c.color)}>{c.value}</div>
              </button>
            ))}
          </div>

          <div style={S.toolbar}>
            <div style={S.search}>
              <FiSearch size={16} color="#9ca3af" />
              <input
                style={S.searchInput}
                placeholder="Search school, contact, phone, lead ID, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button style={S.btn} onClick={load} disabled={loading}>
              <FiRefreshCw size={15} /> Refresh
            </button>
            <button style={S.btn} onClick={exportCsv} disabled={!visible.length}>
              <FiDownload size={15} /> Export CSV
            </button>
          </div>

          {loading && <div style={S.empty}>Loading follow-ups…</div>}

          {!loading && error && (
            <div style={{ ...S.empty, color: '#b91c1c' }}>
              {error}
              <div style={{ marginTop: 12 }}>
                <button style={S.btn} onClick={load}>Try again</button>
              </div>
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div style={S.empty}>
              {rows.length === 0
                ? 'No follow-ups scheduled for this telecaller yet.'
                : 'No follow-ups match the current filter.'}
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Lead ID', 'School / Organization', 'Contact', 'Phone', 'District', 'Follow-up On', 'Status', 'Note', 'Last Update'].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const overdue = r.status === 'Pending' && r.date < today;
                    const [bg, fg] = STATUS_COLORS[overdue ? 'Overdue' : r.status] || STATUS_COLORS.Pending;
                    return (
                      <tr key={r.key}>
                        <td style={S.td}>{r.leadId}</td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{r.organization}</td>
                        <td style={S.td}>{r.contact}</td>
                        <td style={S.td}>{r.mobile}</td>
                        <td style={S.td}>{r.district}</td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          {fmtDate(r.date)}{r.time ? ` ${r.time}` : ''}
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(bg, fg)}>{overdue ? 'Overdue' : r.status}</span>
                        </td>
                        <td style={{ ...S.td, minWidth: 180 }}>{r.note}</td>
                        <td style={{ ...S.td, minWidth: 200, color: '#6b7280' }}>{r.lastUpdate || '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelecallerFollowUps;