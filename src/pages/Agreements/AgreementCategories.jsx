// src/pages/Agreements/AgreementCategories.jsx
// Super Admin → Agreement Templates.
// Click a category (Admin Dashboard / Digital Marketing / ERP Pro / Pro Plus / Pro Max)
// → its agreement opens in an editor. Edit, Save, or Reset to the original text.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiFileText, FiSave, FiRotateCcw, FiRefreshCw, FiEye, FiEdit2, FiAlertTriangle } from 'react-icons/fi';
import agreementCategoryService from '../../services/agreementCategoryService';
import './AgreementCategories.css';

const FIELD_LABELS = {
  agreement_date: 'Agreement date',
  signature_date: 'Signature date',
  client_name: 'Client name',
  client_address: 'Client address',
  pincode: 'Pincode',
  authorized_person_name: 'Signatory name',
  authorized_person_designation: 'Signatory designation',
  plan_name: 'Plan name',
  student_strength: 'Student strength',
  subscription_fee: 'Subscription fee',
  gst_percent: 'GST %',
  gst_amount: 'GST amount',
  total_payable: 'Total payable',
  yearly_fee: 'Professional fee',
  discount_amount: 'Discount',
  net_payable: 'Net payable',
};

// Fields every agreement should carry so the telecaller's data actually lands in the document.
const CORE_FIELDS = ['client_name', 'client_address', 'pincode', 'agreement_date'];

// Make contentEditable output well-formed XHTML (the PDF engine parses it as strict XML).
const toXhtml = (html) => {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const serializer = new XMLSerializer();
  return Array.from(doc.body.childNodes)
    .map((n) => serializer.serializeToString(n).replace(/\sxmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, ''))
    .join('');
};

const fmtDate = (v) => {
  if (!v) return 'Default text';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'Customised' : `Edited ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

export default function AgreementCategories() {
  const [categories, setCategories] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [current, setCurrent] = useState(null);      // full category incl. contentHtml
  const [html, setHtml] = useState('');              // live editor content
  const [dirty, setDirty] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      setCategories(await agreementCategoryService.list());
      setError('');
    } catch (e) {
      setError(e.message || 'Unable to load agreement categories');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Push HTML into the editor only when a document is loaded/reset — not on every keystroke,
  // otherwise the caret jumps to the start while typing.
  const setCanvas = (value) => {
    if (canvasRef.current) canvasRef.current.innerHTML = value || '';
  };

  useEffect(() => {
    if (current) setCanvas(current.contentHtml);
  }, [current]);

  const openCategory = async (key) => {
    if (key === activeKey) return;
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setActiveKey(key);
    setLoadingDoc(true);
    setError('');
    try {
      const doc = await agreementCategoryService.get(key);
      setCurrent(doc);
      setHtml(doc.contentHtml || '');
      setDirty(false);
      setReadOnly(false);
    } catch (e) {
      setError(e.message || 'Unable to load agreement');
    } finally {
      setLoadingDoc(false);
    }
  };

  const onInput = () => {
    setHtml(canvasRef.current?.innerHTML || '');
    setDirty(true);
  };

  const format = (cmd, arg) => {
    canvasRef.current?.focus();
    document.execCommand(cmd, false, arg);
    onInput();
  };

  const insertField = (field) => {
    if (readOnly) return;
    canvasRef.current?.focus();
    document.execCommand('insertText', false, `{{${field}}}`);
    onInput();
  };

  const usedFields = useMemo(() => new Set((html.match(/\{\{\s*(\w+)\s*\}\}/g) || []).map((m) => m.replace(/[{}\s]/g, ''))), [html]);
  const missingCore = CORE_FIELDS.filter((f) => !usedFields.has(f));
  const unknownFields = useMemo(
    () => Array.from(usedFields).filter((f) => current && !current.fields.includes(f)),
    [usedFields, current]
  );

  const save = async () => {
    if (!current) return;
    setBusy(true);
    setError('');
    try {
      const clean = toXhtml(canvasRef.current?.innerHTML || html);
      const saved = await agreementCategoryService.save(current.key, clean);
      setCurrent(saved);
      setHtml(saved.contentHtml);
      setDirty(false);
      await loadList();
      showToast(`${saved.label} agreement saved`);
    } catch (e) {
      setError(e.message || 'Unable to save agreement');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!current) return;
    if (!window.confirm(`Restore the original ${current.label} agreement text? Your edits will be lost.`)) return;
    setBusy(true);
    setError('');
    try {
      const restored = await agreementCategoryService.reset(current.key);
      setCurrent(restored);
      setHtml(restored.contentHtml);
      setDirty(false);
      await loadList();
      showToast('Restored to the original agreement');
    } catch (e) {
      setError(e.message || 'Unable to reset agreement');
    } finally {
      setBusy(false);
    }
  };

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const groups = [
    { title: 'Services', keys: ['ADMIN_DASHBOARD', 'DIGITAL_MARKETING'] },
    { title: 'School ERP', keys: ['ERP_PRO', 'ERP_PRO_PLUS', 'ERP_PRO_MAX'] },
  ];

  return (
    <main className="agt-page">
      {toast && <div className={`agt-toast ${toast.type}`}>{toast.msg}</div>}

      <header className="agt-header">
        <div>
          <h1 className="agt-title">Agreement Templates</h1>
          <p className="agt-sub">
            Pick a category to view and edit its agreement. Changes apply to every new agreement created for that category.
          </p>
        </div>
        <button type="button" className="agt-btn ghost" onClick={loadList} disabled={loadingList}>
          <FiRefreshCw className={loadingList ? 'agt-spin' : ''} /> Refresh
        </button>
      </header>

      {error && <div className="agt-error" role="alert"><FiAlertTriangle /> {error}</div>}

      <div className="agt-layout">
        <aside className="agt-side">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="agt-group">{g.title}</h2>
              {g.keys.map((k) => {
                const c = categories.find((x) => x.key === k);
                if (!c) return null;
                return (
                  <button
                    type="button"
                    key={k}
                    className={`agt-cat ${activeKey === k ? 'active' : ''}`}
                    onClick={() => openCategory(k)}
                  >
                    <span className="agt-cat-icon"><FiFileText /></span>
                    <span className="agt-cat-text">
                      <strong>{c.label}</strong>
                      <small>{c.description}</small>
                      <em className={c.customized ? 'edited' : ''}>{c.customized ? fmtDate(c.updatedAt) : 'Default text'}</em>
                    </span>
                  </button>
                );
              })}
            </section>
          ))}
          {!loadingList && categories.length === 0 && !error && <p className="agt-empty">No categories found.</p>}
        </aside>

        <section className="agt-main">
          {!activeKey && (
            <div className="agt-placeholder">
              <FiFileText size={34} />
              <p>Select a category on the left to open its agreement.</p>
            </div>
          )}

          {activeKey && (
            <>
              <div className="agt-toolbar">
                <div className="agt-toolbar-title">
                  <strong>{current?.label || '…'}</strong>
                  {dirty && <span className="agt-dirty">Unsaved changes</span>}
                </div>
                <div className="agt-toolbar-actions">
                  <button type="button" className="agt-btn ghost" onClick={() => setReadOnly((v) => !v)} disabled={!current}>
                    {readOnly ? <><FiEdit2 /> Edit</> : <><FiEye /> Preview</>}
                  </button>
                  <button type="button" className="agt-btn ghost" onClick={reset} disabled={busy || !current}>
                    <FiRotateCcw /> Reset to original
                  </button>
                  <button type="button" className="agt-btn primary" onClick={save} disabled={busy || !dirty || !current}>
                    <FiSave /> {busy ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>

              {!readOnly && (
                <div className="agt-format">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('bold')}><b>B</b></button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('italic')}><i>I</i></button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('underline')}><u>U</u></button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('insertUnorderedList')}>• List</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('formatBlock', 'H3')}>Heading</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('formatBlock', 'P')}>Paragraph</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => format('undo')}>Undo</button>
                </div>
              )}

              {current && (
                <div className="agt-fields">
                  <span className="agt-fields-label">Auto-filled fields — click to insert at the cursor:</span>
                  {current.fields.map((f) => (
                    <button
                      type="button"
                      key={f}
                      className={`agt-chip ${usedFields.has(f) ? 'used' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertField(f)}
                      disabled={readOnly}
                      title={`{{${f}}}`}
                    >
                      {FIELD_LABELS[f] || f}
                    </button>
                  ))}
                </div>
              )}

              {(missingCore.length > 0 || unknownFields.length > 0) && current && (
                <div className="agt-warn">
                  <FiAlertTriangle />
                  <div>
                    {missingCore.length > 0 && <div>Missing fields: {missingCore.map((f) => FIELD_LABELS[f]).join(', ')} — the telecaller’s details won’t appear in the agreement.</div>}
                    {unknownFields.length > 0 && <div>Unknown fields will print blank: {unknownFields.map((f) => `{{${f}}}`).join(', ')}</div>}
                  </div>
                </div>
              )}

              <div className="agt-paper-wrap">
                {loadingDoc && <div className="agt-loading">Loading agreement…</div>}
                <div
                  ref={canvasRef}
                  className={`agt-paper ${readOnly ? 'readonly' : ''}`}
                  contentEditable={!readOnly && !loadingDoc}
                  suppressContentEditableWarning
                  spellCheck
                  onInput={onInput}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
