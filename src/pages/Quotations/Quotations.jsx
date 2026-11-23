// src/pages/Quotations/Quotations.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './Quotations.css';
import quotationService from '../../services/quotationService';
import quotationAdminService from '../../services/quotationAdminService';
import {
  FiFileText, FiSearch, FiDownload, FiEye, FiX, FiCheck,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiDollarSign,
  FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiXCircle,
  FiSend, FiImage, FiUpload, FiTrash2,
} from 'react-icons/fi';

// ─── Constants ──────────────────────────────────────────────────────────────
// Mirrors the backend workflow exactly (see QuotationService):
// Draft -> Pending Approval -> Approved | Rejected | Revision Required
// Approved -> Sent (done by the telecaller; Super Admin only sees it).
const ROWS_OPTIONS = [10, 20, 50];
const AVATAR_COLORS = ['#7b1113', '#2563eb', '#16a34a', '#7c3aed', '#c2410c', '#0369a1', '#4338ca', '#be185d'];

const STATUS_CONFIG = {
  'Draft':                { cls: 'qt-status-draft',    label: 'Draft' },
  'Pending Approval':  { cls: 'qt-status-sent',      label: 'Pending Approval' },
  'Approved':              { cls: 'qt-status-approved',  label: 'Approved' },
  'Rejected':              { cls: 'qt-status-rejected',  label: 'Rejected' },
  'Revision Required':     { cls: 'qt-status-revised',   label: 'Revision Required' },
  'Sent':        { cls: 'qt-status-viewed',    label: 'Sent' },
};

const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`qt-toast qt-toast-${type}`} onClick={onClose}>
    {type === 'success' ? <FiCheck /> : type === 'error' ? <FiX /> : <FiRefreshCw />}
    {msg}
  </div>
);

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { cls: '', label: status || '—' };
  return <span className={`qt-status-pill ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Approve Modal ──────────────────────────────────────────────────────────
const ApproveModal = ({ quotation, onClose, onConfirm }) => {
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); try { await onConfirm(quotation.id, remark); onClose(); } finally { setBusy(false); } };
  return (
    <div className="qt-modal-overlay" onClick={onClose}>
      <div className="qt-modal-box qt-modal-box-sm" onClick={e => e.stopPropagation()}>
        <div className="qt-modal-header">
          <div className="qt-modal-title">Approve {quotation.id}</div>
          <button className="qt-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="qt-modal-body">
          <div className="qt-form">
            <div className="qt-form-group">
              <label>Remark (optional)</label>
              <textarea placeholder="Any note for the telecaller…" value={remark} onChange={e => setRemark(e.target.value)} />
            </div>
            <div className="qt-form-actions">
              <button className="qt-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="qt-btn-primary" onClick={submit} disabled={busy}><FiCheck size={13} /> {busy ? 'Approving…' : 'Approve Quotation'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Reject / Revision Modal (reason required) ──────────────────────────────
const ReasonModal = ({ quotation, mode, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isReject = mode === 'reject';
  const submit = async () => {
    if (!reason.trim()) { setError(`A ${isReject ? 'rejection' : 'revision'} reason is required.`); return; }
    setBusy(true);
    try { await onConfirm(quotation.id, reason); onClose(); }
    catch (e) { setError(e.message || 'Unable to submit.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="qt-modal-overlay" onClick={onClose}>
      <div className="qt-modal-box qt-modal-box-sm" onClick={e => e.stopPropagation()}>
        <div className="qt-modal-header">
          <div className="qt-modal-title">{isReject ? 'Reject' : 'Request Revision'} {quotation.id}</div>
          <button className="qt-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="qt-modal-body">
          <div className="qt-form">
            {error && (
              <div className="qt-client-autofill" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                <div className="qt-client-autofill-label" style={{ color: '#b91c1c' }}><FiAlertCircle size={12} /> {error}</div>
              </div>
            )}
            <div className="qt-form-group">
              <label>{isReject ? 'Rejection reason *' : 'What needs to change? *'}</label>
              <textarea placeholder={isReject ? 'Explain why this quotation is being rejected…' : 'Tell the telecaller what to revise…'} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div className="qt-form-actions">
              <button className="qt-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="qt-btn-primary" style={isReject ? { background: '#dc2626' } : undefined} onClick={submit} disabled={busy}>
                <FiXCircle size={13} /> {busy ? 'Submitting…' : isReject ? 'Reject Quotation' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── View / Timeline Drawer ─────────────────────────────────────────────────
const ViewModal = ({ quotation, onClose, onDownload }) => (
  <div className="qt-modal-overlay" onClick={onClose}>
    <div className="qt-modal-box qt-modal-box-wide" onClick={e => e.stopPropagation()}>
      <div className="qt-modal-header">
        <div className="qt-modal-title">{quotation.id}</div>
        <button className="qt-modal-close" onClick={onClose}><FiX /></button>
      </div>
      <div className="qt-view-hero">
        <div className="qt-view-avatar" style={{ background: avatarColor(quotation.clientName) }}>{initials(quotation.clientName)}</div>
        <div className="qt-view-hero-info">
          <div className="qt-view-client-name">{quotation.clientName}</div>
          <div className="qt-view-quote-id">{quotation.organization}</div>
        </div>
        <StatusPill status={quotation.status} />
      </div>
      <div className="qt-view-grid">
        <div className="qt-view-row"><span className="qt-view-key">Prepared By</span><span className="qt-view-val">{quotation.createdByName || quotation.createdBy}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Subject</span><span className="qt-view-val">{quotation.subject}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Amount</span><span className="qt-view-val">{quotation.currency}{Number(quotation.amount || 0).toLocaleString('en-IN')}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Valid Till</span><span className="qt-view-val">{quotation.validTill || '—'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Email</span><span className="qt-view-val">{quotation.email || '—'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Phone</span><span className="qt-view-val">{quotation.phone || '—'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Submitted</span><span className="qt-view-val">{fmtDateTime(quotation.submittedAt)}</span></div>
        {quotation.approvedAt && <div className="qt-view-row"><span className="qt-view-key">Approved</span><span className="qt-view-val">{quotation.approvedBy} · {fmtDateTime(quotation.approvedAt)}</span></div>}
        {quotation.rejectedAt && <div className="qt-view-row"><span className="qt-view-key">Rejected</span><span className="qt-view-val">{quotation.rejectedBy} · {fmtDateTime(quotation.rejectedAt)}</span></div>}
        {quotation.rejectionReason && <div className="qt-view-row"><span className="qt-view-key">Rejection Reason</span><span className="qt-view-val">{quotation.rejectionReason}</span></div>}
        {quotation.revisionReason && <div className="qt-view-row"><span className="qt-view-key">Revision Notes</span><span className="qt-view-val">{quotation.revisionReason}</span></div>}
        {quotation.approvalRemark && <div className="qt-view-row"><span className="qt-view-key">Approval Remark</span><span className="qt-view-val">{quotation.approvalRemark}</span></div>}
        {quotation.sent && (
          <>
            <div className="qt-view-row"><span className="qt-view-key">Sent To Client</span><span className="qt-view-val">{quotation.sentTo}</span></div>
            <div className="qt-view-row"><span className="qt-view-key">Channel / When</span><span className="qt-view-val">{quotation.sentChannel} · {fmtDateTime(quotation.sentAt)}</span></div>
          </>
        )}
      </div>
      {quotation.notes && (
        <div className="qt-view-note">
          <div className="qt-view-note-label">Notes</div>
          <div className="qt-view-note-text">{quotation.notes}</div>
        </div>
      )}
      <div className="qt-timeline">
        <div className="qt-timeline-title">History</div>
        <div className="qt-timeline-list">
          {(quotation.timeline || []).map((t, i) => (
            <div className="qt-timeline-item" key={i}>
              <div className="qt-timeline-left">
                <div className="qt-timeline-dot" style={{ background: t.bg, color: t.color }}>•</div>
                {i < quotation.timeline.length - 1 && <div className="qt-timeline-line" />}
              </div>
              <div className="qt-timeline-content">
                <div className="qt-timeline-action">{t.action}</div>
                <div className="qt-timeline-time">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="qt-form-actions" style={{ padding: '0 24px 24px' }}>
        {quotation.generatedPdfPath && (
          <button className="qt-btn-outline" onClick={() => onDownload(quotation)}><FiDownload size={13} /> Download PDF</button>
        )}
      </div>
    </div>
  </div>
);

// ─── Letterhead / Logo / Footer settings (used by every generated quotation PDF) ─────────
const BrandingModal = ({ onClose, showToast }) => {
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState('');
  const [footer, setFooter] = useState({ phone: '', website: '', address: '' });

  const apply = (data) => {
    setB(data);
    setFooter({ phone: data.phone || '', website: data.website || '', address: data.address || '' });
  };
  useEffect(() => {
    quotationAdminService.getBranding().then(apply).catch(e => showToast(e.message || 'Unable to load letterhead.', 'error'));
  }, [showToast]);

  const upload = async (type, file) => {
    if (!file) return;
    setBusy(type);
    try { apply(await quotationAdminService.uploadBranding(type, file)); showToast(type === 'logo' ? 'Logo updated.' : 'Letterpad updated.'); }
    catch (e) { showToast(e.message || 'Upload failed.', 'error'); }
    finally { setBusy(''); }
  };
  const remove = async (type) => {
    setBusy(type);
    try { apply(await quotationAdminService.deleteBranding(type)); showToast(type === 'logo' ? 'Logo removed.' : 'Default letterpad restored.'); }
    catch (e) { showToast(e.message || 'Unable to remove.', 'error'); }
    finally { setBusy(''); }
  };
  const saveSettings = async (patch) => {
    setBusy('settings');
    try { apply(await quotationAdminService.saveBrandingSettings(patch)); showToast('Saved.'); }
    catch (e) { showToast(e.message || 'Unable to save.', 'error'); }
    finally { setBusy(''); }
  };

  const box = { border: '1px dashed #cbd5e1', borderRadius: 10, padding: 12, display: 'flex', gap: 14, alignItems: 'center' };
  const FileBtn = ({ type, label }) => (
    <label className="qt-btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <FiUpload size={13} /> {busy === type ? 'Uploading…' : label}
      <input type="file" accept="image/png,image/jpeg" hidden disabled={!!busy}
        onChange={e => { upload(type, e.target.files?.[0]); e.target.value = ''; }} />
    </label>
  );

  return (
    <div className="qt-modal-overlay" onClick={onClose}>
      <div className="qt-modal-box qt-modal-box-wide" onClick={e => e.stopPropagation()}>
        <div className="qt-modal-header">
          <div className="qt-modal-title">Quotation Letterhead — Logo, Letterpad &amp; Footer</div>
          <button className="qt-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="qt-modal-body">
          {!b ? <div style={{ padding: 24 }}>Loading…</div> : (
            <div className="qt-form">
              <div className="qt-form-section">
                <div className="qt-form-section-title">Company Logo</div>
                <div style={box}>
                  <div style={{ width: 190, height: 80, background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {b.logoDataUrl ? <img src={b.logoDataUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>No logo uploaded</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <FileBtn type="logo" label={b.hasLogo ? 'Replace logo' : 'Upload logo'} />
                      {b.hasLogo && <button className="qt-btn-outline" disabled={!!busy} onClick={() => remove('logo')}><FiTrash2 size={13} /> Remove</button>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>PNG / JPG. Appears at the top-left of every quotation PDF.</div>
                    <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" checked={!!b.showBrandText} disabled={!!busy}
                        onChange={e => saveSettings({ showBrandText: e.target.checked })} />
                      Show “CAMPAS TECH – Private Limited” text next to the logo
                    </label>
                  </div>
                </div>
              </div>

              <div className="qt-form-section">
                <div className="qt-form-section-title">Letterpad (full-page background)</div>
                <div style={box}>
                  <div style={{ width: 130, height: 184, background: '#f8fafc', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {b.letterpadDataUrl && <img src={b.letterpadDataUrl} alt="Letterpad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <FileBtn type="letterpad" label={b.hasLetterpad ? 'Replace letterpad' : 'Upload letterpad'} />
                      {b.hasLetterpad && <button className="qt-btn-outline" disabled={!!busy} onClick={() => remove('letterpad')}><FiTrash2 size={13} /> Use default</button>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      A4 portrait image (e.g. 2480 × 3508 px) with the ribbons / border only — keep the middle empty.
                      {b.usingDefaultLetterpad && <> <b>Currently using the built-in default letterpad.</b></>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="qt-form-section">
                <div className="qt-form-section-title">Footer (bottom-left of every page)</div>
                <div className="qt-form-group"><label>Phone</label><input value={footer.phone} onChange={e => setFooter(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="qt-form-group"><label>Website</label><input value={footer.website} onChange={e => setFooter(f => ({ ...f, website: e.target.value }))} /></div>
                <div className="qt-form-group"><label>Address</label><textarea rows={2} value={footer.address} onChange={e => setFooter(f => ({ ...f, address: e.target.value }))} /></div>
                <div className="qt-form-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="qt-btn-primary" disabled={!!busy} onClick={() => saveSettings(footer)}><FiCheck size={13} /> Save footer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Super Admin Quotations Page ───────────────────────────────────────
const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending Approval');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [viewQt, setViewQt] = useState(null);
  const [approveQt, setApproveQt] = useState(null);
  const [reasonModal, setReasonModal] = useState(null); // { quotation, mode }
  const [toast, setToast] = useState(null);
  const [showBranding, setShowBranding] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await quotationService.getAdminAll();
      setQuotations(Array.isArray(list) ? list : []);
    } catch (e) {
      showToast(e.message || 'Failed to load quotations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const upsert = (q) => setQuotations(prev => prev.map(x => x.id === q.id ? q : x));

  const stats = useMemo(() => ({
    total: quotations.length,
    pending: quotations.filter(q => q.status === 'Pending Approval').length,
    approved: quotations.filter(q => q.status === 'Approved').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    sentValue: quotations.filter(q => q.status === 'Sent').reduce((s, q) => s + (q.amount || 0), 0),
  }), [quotations]);

  const TABS = [
    { id: 'All', label: 'All', count: quotations.length },
    { id: 'Pending Approval', label: 'Pending Approval', count: stats.pending },
    { id: 'Approved', label: 'Approved', count: stats.approved },
    { id: 'Rejected', label: 'Rejected', count: quotations.filter(q => q.status === 'Rejected').length },
    { id: 'Revision Required', label: 'Revision Required', count: quotations.filter(q => q.status === 'Revision Required').length },
    { id: 'Sent', label: 'Sent', count: stats.sent },
  ];

  const filtered = useMemo(() => {
    let d = [...quotations];
    if (filterStatus !== 'All') d = d.filter(q => q.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        (x.id || '').toLowerCase().includes(q) ||
        (x.clientName || '').toLowerCase().includes(q) ||
        (x.subject || '').toLowerCase().includes(q) ||
        (x.createdByName || x.createdBy || '').toLowerCase().includes(q)
      );
    }
    return d;
  }, [quotations, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageNums = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    return nums;
  };

  const handleApprove = async (id, remark) => {
    try {
      const saved = await quotationAdminService.review(id, 'Approved', remark);
      upsert(saved);
      showToast(`${id} approved. The telecaller can now send it to the client.`);
    } catch (e) { showToast(e.message || 'Unable to approve.', 'error'); throw e; }
  };
  const handleReject = async (id, reason) => {
    try {
      const saved = await quotationAdminService.review(id, 'Rejected', reason);
      upsert(saved);
      showToast(`${id} rejected.`, 'error');
    } catch (e) { showToast(e.message || 'Unable to reject.', 'error'); throw e; }
  };
  const handleRevision = async (id, reason) => {
    try {
      const saved = await quotationAdminService.review(id, 'Revision Required', reason);
      upsert(saved);
      showToast(`Revision requested for ${id}.`);
    } catch (e) { showToast(e.message || 'Unable to request revision.', 'error'); throw e; }
  };
  const handleDownload = async (q) => {
    try {
      const blob = await quotationAdminService.downloadPdfBlob(q.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = q.generatedPdfFileName || `Quotation_${q.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { showToast(e.message || 'Unable to download PDF.', 'error'); }
  };

  return (
    <div className="qt-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showBranding && <BrandingModal onClose={() => setShowBranding(false)} showToast={showToast} />}

      <div className="qt-page-header">
        <div>
          <div className="qt-page-title">Quotations — Approvals</div>
          <div className="qt-breadcrumb">Review quotations submitted by telecallers. Approve, reject, or request a revision — sending to the client stays with the telecaller.</div>
        </div>
        <div className="qt-header-actions">
          <button className="qt-btn-outline" onClick={() => setShowBranding(true)}><FiImage size={13} /> Letterhead &amp; Logo</button>
          <button className="qt-btn-outline" onClick={loadAll}><FiRefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="qt-stats-row">
        <div className="qt-stat-card" style={{ borderTop: '3px solid #7b1113' }}>
          <div className="qt-stat-icon" style={{ background: '#fce8e8', color: '#7b1113' }}><FiFileText /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.total}</div><div className="qt-stat-label">Total Quotes</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #1d4ed8' }}>
          <div className="qt-stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><FiClock /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.pending}</div><div className="qt-stat-label">Awaiting My Confirmation</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #15803d' }}>
          <div className="qt-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><FiCheckCircle /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.approved}</div><div className="qt-stat-label">Approved, Not Yet Sent</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #4338ca' }}>
          <div className="qt-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FiDollarSign /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">₹{stats.sentValue.toLocaleString('en-IN')}</div><div className="qt-stat-label">Sent to Clients ({stats.sent})</div></div>
        </div>
      </div>

      <div className="qt-table-card">
        <div className="qt-tabs-row">
          {TABS.map(t => (
            <div key={t.id} className={`qt-tab ${filterStatus === t.id ? 'active' : ''}`} onClick={() => { setFilterStatus(t.id); setPage(1); }}>
              {t.label} <span className="qt-tab-badge">{t.count}</span>
            </div>
          ))}
        </div>

        <div className="qt-filter-bar">
          <div className="qt-search-wrap">
            <FiSearch className="qt-search-ico" />
            <input className="qt-search-input" placeholder="Search by client, subject, telecaller or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="qt-table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading quotations…</div>
          ) : (
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Quote #</th><th>Client</th><th>Telecaller</th><th>Amount</th><th>Status</th><th>Sent</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr className="qt-empty-row"><td colSpan={7}>No quotations found.</td></tr>
                )}
                {paginated.map(q => (
                  <tr key={q.id}>
                    <td className="qt-quote-no">{q.id}</td>
                    <td>
                      <div className="qt-client-cell">
                        <div className="qt-client-avatar" style={{ background: avatarColor(q.clientName) }}>{initials(q.clientName)}</div>
                        <div>
                          <div className="qt-client-name">{q.clientName}</div>
                          <div className="qt-client-email">{q.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="qt-client-cell"><FiUser size={12} />&nbsp;{q.createdByName || q.createdBy}</div></td>
                    <td className="qt-amount">{q.currency}{Number(q.amount || 0).toLocaleString('en-IN')}</td>
                    <td><StatusPill status={q.status} /></td>
                    <td>{q.sent ? `${q.sentChannel} · ${fmtDateTime(q.sentAt)}` : '—'}</td>
                    <td>
                      <div className="qt-action-group">
                        <button className="qt-act-btn view" title="View" onClick={() => setViewQt(q)}><FiEye size={14} /></button>
                        {q.status === 'Pending Approval' && (
                          <>
                            <button className="qt-act-btn download" title="Approve" onClick={() => setApproveQt(q)}><FiCheck size={14} /></button>
                            <button className="qt-act-btn del" title="Reject" onClick={() => setReasonModal({ quotation: q, mode: 'reject' })}><FiX size={14} /></button>
                            <button className="qt-act-btn edit" title="Request Revision" onClick={() => setReasonModal({ quotation: q, mode: 'revision' })}><FiRefreshCw size={14} /></button>
                          </>
                        )}
                        {q.generatedPdfPath && (
                          <button className="qt-act-btn download" title="Download PDF" onClick={() => handleDownload(q)}><FiDownload size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="qt-pagination-bar">
          <div className="qt-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="qt-page-nums">
            <button className="qt-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft /></button>
            {pageNums().map((n, i) => n === '...'
              ? <span key={`e${i}`}>…</span>
              : <button key={n} className={`qt-pg-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>)}
            <button className="qt-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FiChevronRight /></button>
          </div>
        </div>
      </div>

      {viewQt && <ViewModal quotation={viewQt} onClose={() => setViewQt(null)} onDownload={handleDownload} />}
      {approveQt && <ApproveModal quotation={approveQt} onClose={() => setApproveQt(null)} onConfirm={handleApprove} />}
      {reasonModal && (
        <ReasonModal
          quotation={reasonModal.quotation}
          mode={reasonModal.mode}
          onClose={() => setReasonModal(null)}
          onConfirm={reasonModal.mode === 'reject' ? handleReject : handleRevision}
        />
      )}
    </div>
  );
};

export default Quotations;