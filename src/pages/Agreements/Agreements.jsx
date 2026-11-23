// src/pages/Agreements/Agreements.jsx
// Super Admin Agreement verification.
// Mirrors the Quotation approval page workflow without changing the existing
// Telecaller agreement template or Telecaller data flow.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Agreements.css';
import agreementAdminService from '../../services/agreementAdminService';
import AgreementDocumentViewer, { parseAgreementDoc } from './AgreementDocumentViewer';
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
  FiXCircle,
} from 'react-icons/fi';

const ROWS_OPTIONS = [10, 20, 50];

const STATUS_CONFIG = {
  DRAFT: { cls: 'agr-status-draft', label: 'Draft' },
  PENDING_APPROVAL: { cls: 'agr-status-pending', label: 'Pending Approval' },
  RESUBMITTED: { cls: 'agr-status-pending', label: 'Pending Approval' },
  APPROVED: { cls: 'agr-status-approved', label: 'Approved' },
  REJECTED: { cls: 'agr-status-rejected', label: 'Rejected' },
  SENT: { cls: 'agr-status-sent', label: 'Sent' },
};

const statusConfig = (status) =>
  STATUS_CONFIG[status] || {
    cls: 'agr-status-draft',
    label: String(status || '—').replaceAll('_', ' '),
  };

const initials = (name) =>
  name?.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const money = (value) => {
  const number = Number(value || 0);
  return `₹${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`agr-toast agr-toast-${type}`} onClick={onClose} role="status">
    {type === 'success' ? <FiCheck /> : <FiAlertCircle />}
    <span>{msg}</span>
  </div>
);

const StatusPill = ({ status }) => {
  const cfg = statusConfig(status);
  return (
    <span className={`agr-status-pill ${cfg.cls}`}>
      <span className="agr-status-dot" />
      {cfg.label}
    </span>
  );
};

const ApproveModal = ({ agreement, onClose, onConfirm }) => {
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(agreement.id, remark.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="agr-modal-overlay" onClick={onClose}>
      <div className="agr-modal-box agr-modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <div className="agr-modal-header">
          <div>
            <strong>Approve Agreement</strong>
            <span>{agreement.id}</span>
          </div>
          <button className="agr-modal-close" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="agr-modal-body">
          <div className="agr-form">
            <div className="agr-form-group">
              <label htmlFor="agreement-approval-remark">Remark (optional)</label>
              <textarea
                id="agreement-approval-remark"
                placeholder="Add a note for the Telecaller…"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
            <div className="agr-form-actions">
              <button className="agr-btn-outline" type="button" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button className="agr-btn-primary" type="button" onClick={submit} disabled={busy}>
                <FiCheck size={14} /> {busy ? 'Approving…' : 'Approve Agreement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ agreement, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }

    setBusy(true);
    try {
      await onConfirm(agreement.id, reason.trim());
      onClose();
    } catch (e) {
      setError(e.message || 'Unable to reject agreement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="agr-modal-overlay" onClick={onClose}>
      <div className="agr-modal-box agr-modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <div className="agr-modal-header">
          <div>
            <strong>Reject Agreement</strong>
            <span>{agreement.id}</span>
          </div>
          <button className="agr-modal-close" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="agr-modal-body">
          <div className="agr-form">
            {error && (
              <div className="agr-inline-error">
                <FiAlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
            <div className="agr-form-group">
              <label htmlFor="agreement-rejection-reason">Rejection reason *</label>
              <textarea
                id="agreement-rejection-reason"
                placeholder="Explain why this agreement is being rejected…"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>
            <div className="agr-form-actions">
              <button className="agr-btn-outline" type="button" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button className="agr-btn-danger" type="button" onClick={submit} disabled={busy}>
                <FiXCircle size={14} /> {busy ? 'Rejecting…' : 'Reject Agreement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewModal = ({ agreement, onClose, onDownload, onApprove, onReject }) => {
  const cfg = statusConfig(agreement.status);
  const agreementDoc = parseAgreementDoc(agreement.mergeValues);
  const history = Array.isArray(agreement.history) ? agreement.history : [];

  return (
    <div className="agr-modal-overlay" onClick={onClose}>
      <div className="agr-modal-box agr-modal-box-wide" onClick={(e) => e.stopPropagation()}>
        <div className="agr-modal-header">
          <div>
            <strong>{agreement.title || 'Agreement'}</strong>
            <span className={`agr-status-pill ${cfg.cls}`}>{cfg.label}</span>
          </div>
          <button className="agr-modal-close" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="agr-modal-body">
          <div className="agr-view-hero">
            <div className="agr-view-avatar">{initials(agreement.clientName)}</div>
            <div className="agr-view-hero-info">
              <div className="agr-view-client-name">{agreement.clientName || '—'}</div>
              <div className="agr-view-secondary">
                {agreement.organization || agreement.email || 'Client details unavailable'}
              </div>
            </div>
            <StatusPill status={agreement.status} />
          </div>

          <div className="agr-view-section">
            <div className="agr-view-section-title">
              <FiFileText /> Agreement Details
            </div>
            <div className="agr-view-grid">
              <div className="agr-view-row"><span>Prepared By</span><strong>{agreement.createdByName || agreement.createdBy || '—'}</strong></div>
              <div className="agr-view-row"><span>Agreement Type</span><strong>{agreement.agreementType || agreement.serviceType || '—'}</strong></div>
              <div className="agr-view-row"><span>Plan</span><strong>{agreement.planName || '—'}</strong></div>
              <div className="agr-view-row"><span>Agreement Date</span><strong>{agreement.agreementDate || '—'}</strong></div>
              <div className="agr-view-row"><span>Email</span><strong>{agreement.email || '—'}</strong></div>
              <div className="agr-view-row"><span>Phone</span><strong>{agreement.phone || '—'}</strong></div>
              <div className="agr-view-row"><span>Address</span><strong>{agreement.address || '—'}</strong></div>
              <div className="agr-view-row"><span>Pincode</span><strong>{agreement.pincode || '—'}</strong></div>
              <div className="agr-view-row"><span>Authorized Person</span><strong>{agreement.authorizedPersonName || '—'}</strong></div>
              <div className="agr-view-row"><span>Designation</span><strong>{agreement.authorizedPersonDesignation || '—'}</strong></div>
              {agreement.studentStrength != null && (
                <div className="agr-view-row"><span>Student Strength</span><strong>{agreement.studentStrength}</strong></div>
              )}
              <div className="agr-view-row"><span>Fee</span><strong>{money(agreement.feeAmount)}</strong></div>
              {Number(agreement.discountAmount || 0) > 0 && (
                <div className="agr-view-row"><span>Discount</span><strong>{money(agreement.discountAmount)}</strong></div>
              )}
              {Number(agreement.gstPercent || 0) > 0 && (
                <div className="agr-view-row"><span>GST</span><strong>{agreement.gstPercent}% · {money(agreement.gstAmount)}</strong></div>
              )}
              <div className="agr-view-row">
                <span>Payable</span>
                <strong>{money(agreement.totalPayable || agreement.netPayable)}</strong>
              </div>
              <div className="agr-view-row"><span>Submitted</span><strong>{fmtDateTime(agreement.submittedAt)}</strong></div>
              {agreement.approvedAt && (
                <div className="agr-view-row"><span>Approved</span><strong>{agreement.approvedBy || 'Super Admin'} · {fmtDateTime(agreement.approvedAt)}</strong></div>
              )}
              {agreement.rejectedAt && (
                <div className="agr-view-row"><span>Rejected</span><strong>{agreement.rejectedBy || 'Super Admin'} · {fmtDateTime(agreement.rejectedAt)}</strong></div>
              )}
              {agreement.approvalRemark && (
                <div className="agr-view-row agr-view-row-wide"><span>Approval Remark</span><strong>{agreement.approvalRemark}</strong></div>
              )}
              {agreement.rejectionReason && (
                <div className="agr-view-row agr-view-row-wide"><span>Rejection Reason</span><strong>{agreement.rejectionReason}</strong></div>
              )}
            </div>
          </div>

          <div className="agr-view-section">
            <div className="agr-view-section-title">
              <FiShield /> Submitted Agreement
            </div>
            <div className="agr-readonly-notice">
              <FiShield />
              <span>Read-only view of the agreement exactly as the Telecaller prepared it.</span>
            </div>
            <AgreementDocumentViewer doc={agreementDoc} fallbackHtml={agreement.contentHtml || ''} />
          </div>

          {history.length > 0 && (
            <div className="agr-view-section">
              <div className="agr-view-section-title">History</div>
              <div className="agr-history-list">
                {history.map((entry, index) => (
                  <div className="agr-history-item" key={`${entry.at || 'history'}-${index}`}>
                    <div className="agr-history-dot" />
                    <div>
                      <strong>{entry.action || 'Updated'}</strong>
                      <span>{entry.actor || 'System'} · {fmtDateTime(entry.at)}</span>
                      {entry.remarks && <p>{entry.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="agr-form-actions agr-modal-footer-actions">
            {agreement.generatedPdfPath && (
              <button className="agr-btn-outline" type="button" onClick={() => onDownload(agreement)}>
                <FiDownload size={14} /> Download PDF
              </button>
            )}
            <span className="agr-footer-spacer" />
            {['PENDING_APPROVAL', 'RESUBMITTED'].includes(agreement.status) && (
              <>
                <button className="agr-btn-outline agr-reject-outline" type="button" onClick={() => onReject(agreement)}>
                  <FiX size={14} /> Reject
                </button>
                <button className="agr-btn-primary" type="button" onClick={() => onApprove(agreement)}>
                  <FiCheck size={14} /> Approve Agreement
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Agreements() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending Approval');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewAgreement, setViewAgreement] = useState(null);
  const [approveAgreement, setApproveAgreement] = useState(null);
  const [rejectAgreement, setRejectAgreement] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await agreementAdminService.getAll();
      setAgreements(Array.isArray(list) ? list : []);
    } catch (e) {
      showToast(e.message || 'Failed to load agreements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const upsert = useCallback((saved) => {
    setAgreements((current) => current.map((item) => item.id === saved.id ? saved : item));
    setViewAgreement((current) => current?.id === saved.id ? saved : current);
  }, []);

  const stats = useMemo(() => ({
    total: agreements.length,
    pending: agreements.filter((a) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(a.status)).length,
    approved: agreements.filter((a) => a.status === 'APPROVED').length,
    sent: agreements.filter((a) => a.status === 'SENT').length,
  }), [agreements]);

  const tabs = [
    { id: 'All', label: 'All', count: agreements.length },
    { id: 'Pending Approval', label: 'Pending Approval', count: stats.pending },
    { id: 'Approved', label: 'Approved', count: stats.approved },
    { id: 'Rejected', label: 'Rejected', count: agreements.filter((a) => a.status === 'REJECTED').length },
    { id: 'Sent', label: 'Sent', count: stats.sent },
    { id: 'Draft', label: 'Draft', count: agreements.filter((a) => a.status === 'DRAFT').length },
  ];

  const filtered = useMemo(() => {
    let data = [...agreements];

    if (filterStatus !== 'All') {
      data = data.filter((agreement) => {
        if (filterStatus === 'Pending Approval') {
          return ['PENDING_APPROVAL', 'RESUBMITTED'].includes(agreement.status);
        }
        return statusConfig(agreement.status).label === filterStatus || agreement.status === filterStatus.toUpperCase();
      });
    }

    const needle = search.trim().toLowerCase();
    if (needle) {
      data = data.filter((agreement) =>
        [
          agreement.id,
          agreement.clientName,
          agreement.organization,
          agreement.title,
          agreement.agreementType,
          agreement.serviceType,
          agreement.planName,
          agreement.createdByName,
          agreement.createdBy,
          agreement.email,
          agreement.phone,
        ].some((value) => String(value || '').toLowerCase().includes(needle))
      );
    }

    return data;
  }, [agreements, filterStatus, search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pageNums = () => {
    const result = [];
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) result.push(i);
      else if (result[result.length - 1] !== '...') result.push('...');
    }
    return result;
  };

  const handleApprove = async (id, remark) => {
    try {
      const saved = await agreementAdminService.approve(id, remark);
      upsert(saved);
      showToast(`${id} approved. The Telecaller can now send it to the client.`);
    } catch (e) {
      showToast(e.message || 'Unable to approve agreement.', 'error');
      throw e;
    }
  };

  const handleReject = async (id, reason) => {
    try {
      const saved = await agreementAdminService.reject(id, reason);
      upsert(saved);
      showToast(`${id} rejected.`, 'error');
    } catch (e) {
      showToast(e.message || 'Unable to reject agreement.', 'error');
      throw e;
    }
  };

  const handleDownload = async (agreement) => {
    try {
      const blob = await agreementAdminService.downloadPdfBlob(agreement.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = agreement.generatedPdfFileName || `Agreement_${agreement.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e.message || 'Unable to download PDF.', 'error');
    }
  };

  const openApprove = (agreement) => {
    setViewAgreement(null);
    setApproveAgreement(agreement);
  };

  const openReject = (agreement) => {
    setViewAgreement(null);
    setRejectAgreement(agreement);
  };

  return (
    <main className="agreements-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="agr-header">
        <div className="agr-title-row">
          <span className="agr-title-icon"><FiShield /></span>
          <div>
            <h1 className="agr-page-title">Agreements — Approvals</h1>
            <p className="agr-page-subtitle">
              Review agreements submitted by Telecallers. The original agreement content and selected details remain read-only here.
            </p>
          </div>
        </div>
        <button className="agr-btn-outline" type="button" onClick={loadAll} disabled={loading}>
          <FiRefreshCw className={loading ? 'agr-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="agr-summary-grid">
        <div className="agr-summary-card">
          <span className="agr-summary-icon agr-summary-icon-total"><FiFileText /></span>
          <div><strong>{stats.total}</strong><span>Total Agreements</span></div>
        </div>
        <div className="agr-summary-card">
          <span className="agr-summary-icon agr-summary-icon-pending"><FiClock /></span>
          <div><strong>{stats.pending}</strong><span>Awaiting Confirmation</span></div>
        </div>
        <div className="agr-summary-card">
          <span className="agr-summary-icon agr-summary-icon-reviewed"><FiCheckCircle /></span>
          <div><strong>{stats.approved}</strong><span>Approved, Not Yet Sent</span></div>
        </div>
        <div className="agr-summary-card">
          <span className="agr-summary-icon agr-summary-icon-sent"><FiCheck /></span>
          <div><strong>{stats.sent}</strong><span>Sent to Clients</span></div>
        </div>
      </div>

      <div className="agr-table-card">
        <div className="agr-tabs-row">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`agr-tab ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => {
                setFilterStatus(tab.id);
                setPage(1);
              }}
            >
              {tab.label} <span>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="agr-filter-bar">
          <div className="agr-search-wrap">
            <FiSearch className="agr-search-icon" />
            <input
              className="agr-search-input"
              placeholder="Search by client, plan, Telecaller, type or ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="agr-table-wrap">
          {loading ? (
            <div className="agr-loading-state">
              <FiRefreshCw className="agr-spin" />
              <span>Loading agreements…</span>
            </div>
          ) : (
            <table className="agr-table">
              <thead>
                <tr>
                  <th>Agreement</th>
                  <th>Client</th>
                  <th>Telecaller</th>
                  <th>Type / Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="agr-empty">
                      <FiFileText />
                      <strong>No agreements found.</strong>
                      <span>Submitted agreements will appear here automatically.</span>
                    </td>
                  </tr>
                )}

                {paginated.map((agreement) => (
                  <tr key={agreement.id}>
                    <td>
                      <div className="agr-id-cell">
                        <strong>{agreement.id || '—'}</strong>
                        <span>{agreement.title || 'Agreement'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="agr-client-cell">
                        <div className="agr-client-avatar">{initials(agreement.clientName)}</div>
                        <div>
                          <strong>{agreement.clientName || '—'}</strong>
                          <span>{agreement.organization || agreement.email || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="agr-telecaller-cell">
                        <FiUser size={13} />
                        <span>{agreement.createdByName || agreement.createdBy || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="agr-plan-cell">
                        <strong>{agreement.agreementType || agreement.serviceType || '—'}</strong>
                        <span>{agreement.planName || '—'}</span>
                      </div>
                    </td>
                    <td className="agr-amount">
                      {money(agreement.totalPayable || agreement.netPayable || agreement.feeAmount)}
                    </td>
                    <td><StatusPill status={agreement.status} /></td>
                    <td>{fmtDateTime(agreement.submittedAt || agreement.createdAt)}</td>
                    <td>
                      <div className="agr-action-group">
                        <button className="agr-act-btn view" type="button" title="View" onClick={() => setViewAgreement(agreement)}>
                          <FiEye size={14} />
                        </button>
                        {['PENDING_APPROVAL', 'RESUBMITTED'].includes(agreement.status) && (
                          <>
                            <button className="agr-act-btn approve" type="button" title="Approve" onClick={() => setApproveAgreement(agreement)}>
                              <FiCheck size={14} />
                            </button>
                            <button className="agr-act-btn reject" type="button" title="Reject" onClick={() => setRejectAgreement(agreement)}>
                              <FiX size={14} />
                            </button>
                          </>
                        )}
                        {agreement.generatedPdfPath && (
                          <button className="agr-act-btn download" type="button" title="Download PDF" onClick={() => handleDownload(agreement)}>
                            <FiDownload size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="agr-pagination-bar">
          <div className="agr-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="agr-page-nums">
            <button className="agr-pg-btn" type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <FiChevronLeft />
            </button>
            {pageNums().map((number, index) => number === '...'
              ? <span key={`ellipsis-${index}`}>…</span>
              : (
                <button
                  key={number}
                  type="button"
                  className={`agr-pg-btn ${page === number ? 'active' : ''}`}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
            <button className="agr-pg-btn" type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {viewAgreement && (
        <ViewModal
          agreement={viewAgreement}
          onClose={() => setViewAgreement(null)}
          onDownload={handleDownload}
          onApprove={openApprove}
          onReject={openReject}
        />
      )}

      {approveAgreement && (
        <ApproveModal
          agreement={approveAgreement}
          onClose={() => setApproveAgreement(null)}
          onConfirm={handleApprove}
        />
      )}

      {rejectAgreement && (
        <RejectModal
          agreement={rejectAgreement}
          onClose={() => setRejectAgreement(null)}
          onConfirm={handleReject}
        />
      )}
    </main>
  );
}