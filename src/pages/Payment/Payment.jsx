// src/pages/Payment/Payment.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './Payment.css';
import {
  FiSearch, FiDownload, FiEye, FiX, FiChevronLeft, FiChevronRight,
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiClock, FiActivity,
  FiEdit2, FiMessageCircle, FiDollarSign, FiSend, FiFileText, FiInfo, FiShield,
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import paymentAdminService from '../../services/paymentAdminService';
import invoiceAssetService from '../../services/invoiceAssetService';
import { printInvoicePdf } from '../../components/Invoice/printInvoice';
import InvoiceEditorModal from '../../components/Invoice/InvoiceEditorModal';

// ─── Constants ────────────────────────────────────────────────
const ROWS_OPTIONS = [5, 10, 20, 50];
const STATUSES = ['All Status', 'Recorded', 'Verified', 'Invoice Generated', 'Invoice Sent to Telecaller', 'Completed', 'Fully Paid'];

const AVATAR_COLORS = ['#7b1113', '#2563eb', '#16a34a', '#7c3aed', '#c2410c', '#0369a1', '#4338ca', '#be185d'];

const STATUS_META = {
  'Recorded':                   { cls: 'pay-badge-processing' },
  'Verified':                   { cls: 'pay-badge-partial' },
  'Invoice Generated':          { cls: 'pay-badge-partial' },
  'Invoice Sent to Telecaller': { cls: 'pay-badge-processing' },
  'Completed':                  { cls: 'pay-badge-paid' },
  'Fully Paid':                 { cls: 'pay-badge-paid' },
};

// ─── Helpers ──────────────────────────────────────────────────
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
const fmtINR = (n) => (!n ? '\u20B90' : '\u20B9' + Number(n).toLocaleString('en-IN'));

const getTimelineIcon = (iconName) => {
  const iconMap = {
    document: <FiFileText size={13} />, message: <FiMessageCircle size={13} />,
    eye: <FiEye size={13} />, check: <FiCheckCircle size={13} />, edit: <FiEdit2 size={13} />,
    clock: <FiClock size={13} />, x: <FiX size={13} />, send: <FiSend size={13} />, activity: <FiActivity size={13} />,
  };
  return iconMap[iconName] || <FiFileText size={13} />;
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`pay-toast pay-toast-${type}`} onClick={onClose}>
    {type === 'success' ? <FiCheckCircle size={15} /> : type === 'error' ? <FiX size={15} /> : <FiActivity size={15} />}
    {msg}
  </div>
);

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { cls: '' };
  return <span className={`pay-badge ${m.cls}`}>{status}</span>;
};

// ═══════════════════════════════════════════════════════════════
//  EDIT PAYMENT MODAL (Super Admin — org + amount corrections)
// ═══════════════════════════════════════════════════════════════
const EditPaymentModal = ({ payment, onClose, onSave }) => {
  const [form, setForm] = useState({ gstPercent: 0, discountAmount: 0, paymentMethod: '', transactionReferenceNumber: '', ...payment });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(payment.id, {
        organizationName: form.organizationName,
        address: form.address,
        phone: form.phone,
        email: form.email,
        paymentType: form.paymentType,
        totalAmount: Number(form.totalAmount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        gstPercent: Number(form.gstPercent) || 0,
        discountAmount: Number(form.discountAmount) || 0,
        paymentMethod: form.paymentMethod || '',
        transactionReferenceNumber: form.transactionReferenceNumber || '',
        paymentDate: form.paymentDate,
        notes: form.notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pay-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title"><FiEdit2 size={16} style={{ marginRight: 6 }} /> Edit Payment</span>
          <button className="pay-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-add-grid">
            <div className="pay-form-group">
              <label className="pay-form-label">Organization Name</label>
              <input className="pay-form-input" value={form.organizationName || ''} onChange={(e) => set('organizationName', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Address</label>
              <input className="pay-form-input" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Phone Number</label>
              <input className="pay-form-input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Email Address</label>
              <input className="pay-form-input" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Payment Type</label>
              <select className="pay-form-select" value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)}>
                {['Full', 'Partial', 'Advance'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Payment Date</label>
              <input className="pay-form-input" type="date" value={form.paymentDate || ''} onChange={(e) => set('paymentDate', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Total Amount</label>
              <input className="pay-form-input" type="number" value={form.totalAmount ?? ''} onChange={(e) => set('totalAmount', e.target.value)} />
              {payment.status === 'Fully Paid' && (
                <span className="pay-form-hint">This client is Fully Paid. Raise the total amount to reopen the balance and allow more payment records — for the telecaller too.</span>
              )}
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">GST (%)</label>
              <input className="pay-form-input" type="number" min="0" max="100" step="0.01" value={form.gstPercent ?? ''} onChange={(e) => set('gstPercent', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Discount</label>
              <input className="pay-form-input" type="number" min="0" step="0.01" value={form.discountAmount ?? ''} onChange={(e) => set('discountAmount', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Payment Method</label>
              <input className="pay-form-input" value={form.paymentMethod || ''} onChange={(e) => set('paymentMethod', e.target.value)} placeholder="UPI / Cash / Bank Transfer" />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Transaction / Reference No.</label>
              <input className="pay-form-input" value={form.transactionReferenceNumber || ''} onChange={(e) => set('transactionReferenceNumber', e.target.value)} />
            </div>
            <div className="pay-form-group">
              <label className="pay-form-label">Amount Paid</label>
              <input className="pay-form-input" type="number" value={form.amountPaid ?? ''} onChange={(e) => set('amountPaid', e.target.value)} />
            </div>
          </div>
          <div className="pay-form-group">
            <label className="pay-form-label">Notes</label>
            <textarea className="pay-form-textarea" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <div className="pay-form-actions" style={{ padding: '14px 24px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="pay-btn-outline" onClick={onClose}>Cancel</button>
          <button className="pay-btn-primary" disabled={saving} onClick={handleSave}>
            <FiCheckCircle size={13} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADD PAYMENT RECORD MODAL (Super Admin)
//  Shows the client's previous payment info before a new record is added,
//  per the "Payment History and Remaining Balance" requirement.
// ═══════════════════════════════════════════════════════════════
const PaymentRecordModal = ({ payment, onClose, onSave }) => {
  const [form, setForm] = useState({ paymentAmount: '', paymentType: 'Partial', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'UPI', transactionReferenceNumber: '', notes: '', status: 'Paid' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));

  const history = payment.paymentHistory || [];
  const lastRecord = history.length ? history[history.length - 1] : null;

  const save = async () => {
    if (!(Number(form.paymentAmount) > 0)) return alert('Enter a valid payment amount');
    if (Number(form.paymentAmount) > Number(payment.balanceAmount || 0) && form.status !== 'Pending') return alert('Amount cannot exceed remaining balance');
    setSaving(true);
    try { await onSave({ ...form, paymentAmount: Number(form.paymentAmount) }); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="pay-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title"><FiEdit2 size={16} style={{ marginRight: 6 }} /> Add Payment Record — {payment.organizationName}</span>
          <button className="pay-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-view-note-label">Previous Payment Information</div>
          <div className="pay-amount-summary" style={{ marginBottom: 16 }}>
            <div className="pay-summary-item">
              <span className="pay-summary-label">Total Amount</span>
              <span className="pay-summary-value">{fmtINR(payment.totalAmount)}</span>
            </div>
            <div className="pay-summary-item">
              <span className="pay-summary-label">Total Paid So Far</span>
              <span className="pay-summary-value pay-summary-paid">{fmtINR(payment.amountPaid)}</span>
            </div>
            <div className="pay-summary-item">
              <span className="pay-summary-label">Remaining Balance</span>
              <span className={`pay-summary-value ${payment.balanceAmount > 0 ? 'pay-summary-balance' : ''}`}>{fmtINR(payment.balanceAmount)}</span>
            </div>
          </div>
          {lastRecord && (
            <div className="pay-amount-summary" style={{ marginBottom: 16 }}>
              <div className="pay-summary-item">
                <span className="pay-summary-label">Previous Payment Amount</span>
                <span className="pay-summary-value">{fmtINR(lastRecord.amount)}</span>
              </div>
              <div className="pay-summary-item">
                <span className="pay-summary-label">Previous Payment Date</span>
                <span className="pay-summary-value">{lastRecord.paymentDate || '--'}</span>
              </div>
              <div className="pay-summary-item">
                <span className="pay-summary-label">Previous Payment Type</span>
                <span className="pay-summary-value">{lastRecord.paymentType || '--'}</span>
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="pay-view-note-label">Payment History</div>
              <table className="pay-table">
                <thead><tr><th>Amount</th><th>Type</th><th>Date</th><th>Method</th><th>Reference</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={r.id || i}>
                      <td>{fmtINR(r.amount)}</td><td>{r.paymentType}</td><td>{r.paymentDate || '--'}</td>
                      <td>{r.paymentMethod || '--'}</td><td>{r.transactionReferenceNumber || '--'}</td><td>{r.status || 'Paid'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pay-view-note-label">New Payment</div>
          <div className="pay-add-grid">
            <div className="pay-form-group"><label className="pay-form-label">Payment Amount *</label><input className="pay-form-input" type="number" value={form.paymentAmount} onChange={(e) => set('paymentAmount', e.target.value)} /></div>
            <div className="pay-form-group"><label className="pay-form-label">Payment Type</label><select className="pay-form-select" value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)}><option>Advance</option><option>Partial</option><option>Full</option></select></div>
            <div className="pay-form-group"><label className="pay-form-label">Payment Date</label><input className="pay-form-input" type="date" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} /></div>
            <div className="pay-form-group"><label className="pay-form-label">Payment Method</label><input className="pay-form-input" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} placeholder="UPI / Cash / Bank Transfer" /></div>
            <div className="pay-form-group"><label className="pay-form-label">Transaction / Reference No.</label><input className="pay-form-input" value={form.transactionReferenceNumber} onChange={(e) => set('transactionReferenceNumber', e.target.value)} /></div>
            <div className="pay-form-group"><label className="pay-form-label">Status</label><select className="pay-form-select" value={form.status} onChange={(e) => set('status', e.target.value)}><option>Paid</option><option>Pending</option></select></div>
          </div>
          <div className="pay-form-group"><label className="pay-form-label">Payment Notes</label><textarea className="pay-form-textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
        </div>
        <div className="pay-form-actions" style={{ padding: '14px 24px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="pay-btn-outline" onClick={onClose}>Cancel</button>
          <button className="pay-btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  VIEW / VERIFY PAYMENT MODAL
// ═══════════════════════════════════════════════════════════════
const ViewPaymentModal = ({ payment, onClose, onVerify, onGenerateInvoice, onGenerateRecordInvoice, onSendToTelecaller, onDownloadInvoice, onDownloadRecordInvoice, onAddRecord }) => {
  const pct = payment.totalAmount > 0 ? Math.round((payment.amountPaid / payment.totalAmount) * 100) : 0;
  const progressColor = pct === 100 ? '#15803d' : pct > 0 ? '#d97706' : '#b91c1c';

  const infoRows = [
    ['Organization', payment.organizationName],
    ['Address', payment.address || '--'],
    ['Phone', payment.phone || '--'],
    ['Email', payment.email || '--'],
    ['Payment Type', payment.paymentType],
    ['Payment Date', payment.paymentDate || '--'],
    ['Telecaller', payment.telecallerName || '--'],
    ['Status', <StatusBadge key="s" status={payment.status} />],
  ];

  return (
    <div className="pay-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title"><FiCreditCard size={16} style={{ marginRight: 6 }} /> Payment Verification</span>
          <button className="pay-modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="pay-view-hero">
          <div className="pay-view-avatar" style={{ background: avatarColor(payment.organizationName) }}>
            {initials(payment.organizationName)}
          </div>
          <div className="pay-view-hero-info">
            <div className="pay-view-client-name">{payment.organizationName}</div>
            <div className="pay-view-company">{payment.address}</div>
          </div>
          <StatusBadge status={payment.status} />
        </div>

        <div className="pay-amount-summary">
          {[
            { label: 'Total Amount', val: fmtINR(payment.totalAmount), cls: '' },
            { label: 'Amount Paid', val: fmtINR(payment.amountPaid), cls: 'pay-summary-paid' },
            { label: 'Balance Due', val: fmtINR(payment.balanceAmount), cls: payment.balanceAmount > 0 ? 'pay-summary-balance' : '' },
          ].map((c) => (
            <div className="pay-summary-item" key={c.label}>
              <span className="pay-summary-label">{c.label}</span>
              <span className={`pay-summary-value ${c.cls}`}>{c.val}</span>
            </div>
          ))}
        </div>

        <div className="pay-progress-wrap">
          <div className="pay-progress-label">
            <span>Payment Progress</span>
            <span style={{ color: progressColor }}>{pct}% Paid</span>
          </div>
          <div className="pay-progress-track">
            <div className="pay-progress-fill" style={{ width: `${pct}%`, background: progressColor }} />
          </div>
        </div>

        {Number(payment.balanceAmount) > 0 && payment.status !== 'Fully Paid' && <button className="pay-btn-primary" style={{margin:'0 24px 14px'}} onClick={onAddRecord}><FiEdit2 size={13}/> Add Payment Record</button>}
        {payment.paymentHistory?.length > 0 && <div style={{padding:'0 24px 14px'}}><div className="pay-view-note-label">Payment History — each transaction has its own invoice</div><table className="pay-table"><thead><tr><th>Amount</th><th>Type</th><th>Date</th><th>Method</th><th>Reference</th><th>Status</th><th>Invoice</th></tr></thead><tbody>{payment.paymentHistory.map((r,i)=><tr key={r.id||i}><td>{fmtINR(r.amount)}</td><td>{r.paymentType}</td><td>{r.paymentDate||'--'}</td><td>{r.paymentMethod||'--'}</td><td>{r.transactionReferenceNumber||'--'}</td><td>{r.status||'Paid'}</td><td>{r.invoiceId ? <button className="pay-btn-outline" onClick={()=>onDownloadRecordInvoice(payment,r)}><FiDownload size={13}/> Download Invoice</button> : <button className="pay-btn-primary" disabled={payment.status!=='Verified' && payment.status!=='Invoice Generated' && payment.status!=='Fully Paid'} onClick={()=>onGenerateRecordInvoice(payment,r)}><FiFileText size={13}/> Generate Invoice</button>}</td></tr>)}</tbody></table></div>}
        <div className="pay-view-section">
  <div className="pay-section-heading">
    <div>
      <div className="pay-section-title">Customer Details</div>
      <div className="pay-section-subtitle">
        Organization and payment information
      </div>
    </div>
  </div>

  <div className="pay-view-grid">
    {infoRows.map(([k, v]) => (
      <div className="pay-view-row" key={k}>
        <div className="pay-view-key">{k}</div>
        <div className="pay-view-val">{v}</div>
      </div>
    ))}
  </div>
</div>

        {payment.notes && (
          <div className="pay-view-note">
            <div className="pay-view-note-label"><FiInfo size={12} /> Notes</div>
            <div className="pay-view-note-text">{payment.notes}</div>
          </div>
        )}

        {payment.timeline?.length > 0 && (
          <div className="pay-timeline">
            <div className="pay-timeline-title"><FiClock size={14} style={{ marginRight: 6 }} /> Activity Timeline</div>
            <div className="pay-timeline-list">
              {payment.timeline.map((t, i) => (
                <div className="pay-timeline-item" key={i}>
                  <div className="pay-timeline-left">
                    <div className="pay-timeline-dot" style={{ background: t.bg, color: t.color }}>{getTimelineIcon(t.icon)}</div>
                    <div className="pay-timeline-line" />
                  </div>
                  <div className="pay-timeline-content">
                    <div className="pay-timeline-action">{t.action}</div>
                    <div className="pay-timeline-time">{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pay-form-actions" style={{ padding: '14px 24px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="pay-btn-outline" onClick={onClose}>Close</button>
          {payment.status === 'Recorded' && (
            <button className="pay-btn-primary" onClick={onVerify}><FiShield size={13} /> Verify Payment</button>
          )}
          {(payment.status === 'Verified' || payment.status === 'Invoice Generated') && (
            <button className="pay-btn-primary" onClick={onGenerateInvoice}>
              <FiFileText size={13} /> Generate Next Transaction Invoice
            </button>
          )}
          {payment.invoiceId && (
            <button className="pay-btn-outline" onClick={() => onDownloadInvoice(payment)}>
              <FiDownload size={13} /> Download Invoice
            </button>
          )}
          {payment.status === 'Invoice Generated' && (
            <button className="pay-btn-primary" onClick={onSendToTelecaller}>
              <FiSend size={13} /> Send Invoice to Telecaller
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [viewPay, setViewPay] = useState(null);
  const [editPay, setEditPay] = useState(null);
  const [recordPay, setRecordPay] = useState(null);
  const [invoiceEditor, setInvoiceEditor] = useState(null);
  const qrInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const thankYouInputRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentAdminService.getAll();
      setPayments(data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: payments.length,
    completed: payments.filter((p) => p.status === 'Completed').length,
    awaitingVerification: payments.filter((p) => p.status === 'Recorded').length,
    totalCollected: payments.reduce((s, p) => s + Number(p.amountPaid || 0), 0),
    totalBalance: payments.reduce((s, p) => s + Number(p.balanceAmount || 0), 0),
  }), [payments]);

  const filtered = useMemo(() => {
    let d = [...payments];
    if (filterStatus !== 'All Status') d = d.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter((x) =>
        (x.organizationName || '').toLowerCase().includes(q) ||
        (x.phone || '').toLowerCase().includes(q) ||
        (x.email || '').toLowerCase().includes(q) ||
        (x.telecallerName || '').toLowerCase().includes(q)
      );
    }
    return d;
  }, [payments, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pgRange = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    return nums;
  };

  const refreshViewed = (updated) => {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setViewPay(updated);
  };

  const handleVerify = async (payment) => {
    try {
      const updated = await paymentAdminService.verify(payment.id);
      refreshViewed(updated);
      showToast('Payment verified.');
    } catch (e) { showToast(e.message || 'Failed to verify', 'error'); }
  };

  const handleGenerateInvoice = async (payment, record) => {
    try {
      const updated = await paymentAdminService.generateInvoice(payment.id, record?.id);
      refreshViewed(updated);
      showToast('Invoice generated.');
    } catch (e) { showToast(e.message || 'Failed to generate invoice', 'error'); }
  };

  const handleSendToTelecaller = async (payment) => {
    try {
      const updated = await paymentAdminService.sendToTelecaller(payment.id);
      refreshViewed(updated);
      showToast(`Invoice sent to ${updated.telecallerName || 'telecaller'}.`);
    } catch (e) { showToast(e.message || 'Failed to send invoice', 'error'); }
  };

  // PDF is generated from the React + CSS invoice DOM. The old backend PDF/image
  // endpoint is intentionally not used here. Browser Print -> Save as PDF preserves
  // the same dynamic CSS template used by the invoice preview.
  const openInvoiceEditor = (payment, record = null) => {
    setInvoiceEditor({ payment, record });
  };

  const handlePrintInvoice = async (invoiceData) => {
    try {
      const [qr, assets] = await Promise.all([
        paymentAdminService.getSharedQr().catch(() => null),
        invoiceAssetService.getAssets().catch(() => ({})),
      ]);

      await printInvoicePdf(invoiceData, {
        qrDataUrl: qr?.dataUrl,
        ...assets,
      });

      showToast('Invoice PDF downloaded.');
    } catch (e) {
      showToast(e.message || 'Unable to download the invoice PDF.', 'error');
    }
  };

  const handleDownloadInvoice = (payment) => {
    openInvoiceEditor(payment);
  };

  const handleDownloadRecordInvoice = (payment, record) => {
    openInvoiceEditor(payment, record);
  };

  const handleSaveEdit = async (id, payload) => {
    try {
      const updated = await paymentAdminService.update(id, payload);
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditPay(null);
      showToast('Payment updated.');
    } catch (e) { showToast(e.message || 'Failed to update payment', 'error'); }
  };

  const handleAddRecord = async (payment, payload) => {
    try { const updated = await paymentAdminService.addPaymentRecord(payment.id, payload); setPayments(prev=>prev.map(x=>x.id===payment.id?updated:x)); setRecordPay(null); setViewPay(updated); showToast('Payment record saved and totals recalculated.'); } catch(e){ showToast(e.message || 'Failed to save payment record','error'); }
  };
  const handleQrUpload = async (e) => { const file=e.target.files?.[0]; if(!file) return; try { await paymentAdminService.uploadQr(file); showToast('Shared payment QR code uploaded.'); } catch(err){showToast(err.message || 'QR upload failed','error');} finally {e.target.value='';} };
  const handleLogoUpload = async e => { const f=e.target.files?.[0]; if(!f)return; try{await invoiceAssetService.uploadLogo(f);showToast('Invoice logo uploaded.')}catch(err){showToast(err.message||'Logo upload failed','error')}finally{e.target.value=''}};
  const handleSignatureUpload = async e => { const f=e.target.files?.[0]; if(!f)return; try{await invoiceAssetService.uploadSignature(f);showToast('Invoice signature uploaded.')}catch(err){showToast(err.message||'Signature upload failed','error')}finally{e.target.value=''}};
  const handleThankYouUpload = async e => { const f=e.target.files?.[0]; if(!f)return; try{await invoiceAssetService.uploadThankYou(f);showToast('Thank You image uploaded.')}catch(err){showToast(err.message||'Thank You upload failed','error')}finally{e.target.value=''}};

  return (
    <div className="pay-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="pay-page-header">
        <div><h1 className="pay-page-title">Payments</h1></div><div className="pay-header-actions"><input ref={qrInputRef} type="file" accept="image/*" hidden onChange={handleQrUpload}/><input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload}/><input ref={signatureInputRef} type="file" accept="image/*" hidden onChange={handleSignatureUpload}/><input ref={thankYouInputRef} type="file" accept="image/*" hidden onChange={handleThankYouUpload}/><button className="pay-btn-primary" onClick={()=>qrInputRef.current?.click()}>Upload QR</button><button className="pay-btn-primary" onClick={()=>logoInputRef.current?.click()}>Upload Invoice Logo</button><button className="pay-btn-primary" onClick={()=>signatureInputRef.current?.click()}>Upload Signature</button><button className="pay-btn-primary" onClick={()=>thankYouInputRef.current?.click()}>Upload Thank You</button></div>
      </div>

      <div className="pay-stats-row">
        {[
          { icon: <FiCreditCard />, label: 'Total Payments', val: stats.total, color: '#7b1113', bg: '#fce8e8' },
          { icon: <FiAlertCircle />, label: 'Awaiting Verification', val: stats.awaitingVerification, color: '#b91c1c', bg: '#fee2e2' },
          { icon: <FiCheckCircle />, label: 'Completed', val: stats.completed, color: '#15803d', bg: '#dcfce7' },
          { icon: <FiDollarSign />, label: 'Collected', val: fmtINR(stats.totalCollected), color: '#1d4ed8', bg: '#dbeafe' },
          { icon: <FaRupeeSign />, label: 'Balance Due', val: fmtINR(stats.totalBalance), color: '#b91c1c', bg: '#fee2e2' },
        ].map((s) => (
          <div className="pay-stat-card" key={s.label}>
            <div className="pay-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="pay-stat-info">
              <div className="pay-stat-val">{s.val}</div>
              <div className="pay-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pay-table-card">
        <div className="pay-filter-bar">
          <div className="pay-search-wrap">
            <FiSearch className="pay-search-ico" />
            <input
              className="pay-search-input"
              placeholder="Search by organization, phone, email, telecaller…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="pay-filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {(filterStatus !== 'All Status' || search) && (
            <button className="pay-btn-ghost" onClick={() => { setFilterStatus('All Status'); setSearch(''); setPage(1); }}>
              <FiX size={13} /> Clear
            </button>
          )}
        </div>

        <div className="pay-table-header-row">
          <div className="pay-table-label">
            Payment List <span className="pay-record-count">({filtered.length} record{filtered.length !== 1 ? 's' : ''})</span>
          </div>
        </div>

        <div className="pay-table-wrap">
          <table className="pay-table">
            <thead>
              <tr>
                <th>Organization</th><th>Telecaller</th><th>Type</th>
                <th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="pay-empty-row">Loading payments…</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="pay-empty-row">No payment records found.</td></tr>
              ) : paginated.map((pay) => (
                <tr key={pay.id}>
                  <td>
                    <div className="pay-client-cell">
                      <div className="pay-client-avatar" style={{ background: avatarColor(pay.organizationName) }}>{initials(pay.organizationName)}</div>
                      <div><div className="pay-client-name">{pay.organizationName}</div></div>
                    </div>
                  </td>
                  <td>{pay.telecallerName || '--'}</td>
                  <td>{pay.paymentType}</td>
                  <td><span className="pay-amount">{fmtINR(pay.totalAmount)}</span></td>
                  <td><span className={pay.amountPaid > 0 ? 'pay-amount-paid' : 'pay-amount-zero'}>{fmtINR(pay.amountPaid)}</span></td>
                  <td><span className={pay.balanceAmount > 0 ? 'pay-amount-balance' : 'pay-amount-zero'}>{fmtINR(pay.balanceAmount)}</span></td>
                  <td><StatusBadge status={pay.status} /></td>
                  <td>
                    <div className="pay-action-group">
                      <button className="pay-act-btn view" title="View / Verify" onClick={() => setViewPay(pay)}><FiEye /></button>
                      <button className="pay-act-btn edit" title="Edit" onClick={() => setEditPay(pay)}><FiEdit2 /></button>
                      {pay.status === 'Recorded' && (
                        <button className="pay-act-btn verify" title="Verify" onClick={() => handleVerify(pay)}><FiShield /></button>
                      )}
                      {(pay.status === 'Verified' || pay.status === 'Invoice Generated') && (
                        <button className="pay-act-btn invoice" title="Generate Invoice" onClick={() => handleGenerateInvoice(pay)}><FiFileText /></button>
                      )}
                      {pay.invoiceId && (
                        <>
                          <button className="pay-act-btn edit" title="Edit Invoice" onClick={() => openInvoiceEditor(pay)}><FiEdit2 /></button>
                          <button className="pay-act-btn download" title="Open / Print Invoice" onClick={() => handleDownloadInvoice(pay)}><FiDownload /></button>
                        </>
                      )}
                      {pay.status === 'Invoice Generated' && (
                        <button className="pay-act-btn send" title="Send to Telecaller" onClick={() => handleSendToTelecaller(pay)}><FiSend /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pay-pagination-bar">
          <div className="pay-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="pay-page-nums">
            <button className="pay-pg-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><FiChevronLeft size={13} /></button>
            {pgRange().map((p, i) => p === '...'
              ? <span key={`d${i}`} style={{ padding: '0 4px', color: 'var(--text-light)' }}>…</span>
              : <button key={p} className={`pay-pg-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>)}
            <button className="pay-pg-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><FiChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {viewPay && (
        <ViewPaymentModal
          payment={viewPay}
          onClose={() => setViewPay(null)}
          onVerify={() => handleVerify(viewPay)}
          onGenerateInvoice={() => handleGenerateInvoice(viewPay)}
          onGenerateRecordInvoice={(payment, record) => handleGenerateInvoice(payment, record)}
          onSendToTelecaller={() => handleSendToTelecaller(viewPay)}
          onDownloadInvoice={handleDownloadInvoice}
          onDownloadRecordInvoice={handleDownloadRecordInvoice}
          onAddRecord={() => setRecordPay(viewPay)}
        />
      )}

      {recordPay && <PaymentRecordModal payment={recordPay} onClose={() => setRecordPay(null)} onSave={(payload)=>handleAddRecord(recordPay,payload)} />}

      {editPay && (
        <EditPaymentModal payment={editPay} onClose={() => setEditPay(null)} onSave={handleSaveEdit} />
      )}

      {invoiceEditor && (
        <InvoiceEditorModal
          payment={invoiceEditor.payment}
          record={invoiceEditor.record}
          onClose={() => setInvoiceEditor(null)}
          onPrint={handlePrintInvoice}
        />
      )}
    </div>
  );
};

export default Payments;

