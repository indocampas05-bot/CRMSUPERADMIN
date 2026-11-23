import React, { useEffect, useMemo, useState } from 'react';
import './LeavePermissionAdmin.css';
import leavePermissionAdminService from '../../services/leavePermissionAdminService';

const LeavePermissionAdmin = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([
        leavePermissionAdminService.getRequests('All'),
        leavePermissionAdminService.getSummary(),
      ]);
      setRequests(Array.isArray(list) ? list : []);
      setSummary(stats || {});
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pending = useMemo(() => requests.filter(r => r.status === 'Pending'), [requests]);
  const filtered = useMemo(() => filter === 'All' ? requests : requests.filter(r => r.status === filter), [requests, filter]);

  const review = async (request, status) => {
    let rejectionReason = '';
    if (status === 'Rejected') {
      rejectionReason = window.prompt('Enter rejection reason (optional):', '') ?? '';
    }
    try {
      setBusyId(request.id);
      await leavePermissionAdminService.updateStatus(request.id, status, rejectionReason);
      notify(`${request.employeeName || request.username}'s ${request.type} request ${status.toLowerCase()}.`);
      await load();
      setSelected(null);
    } catch (e) {
      notify(e.message, 'error');
    } finally { setBusyId(null); }
  };

  const editRequest = async (request) => {
    try {
      const reason = window.prompt('Reason for editing this request:', 'Super Admin correction') ?? '';
      if (!reason) return;
      if (request.type === 'Permission') {
        const fromTime = window.prompt('Permission start time (HH:mm):', request.fromTime || '10:30');
        const toTime = window.prompt('Permission end time (HH:mm):', request.toTime || '12:30');
        if (!fromTime || !toTime) return;
        await leavePermissionAdminService.update(request.id, {...request, fromTime, toTime, reason: request.reason || reason});
      } else {
        const fromDate = window.prompt('Leave from date (YYYY-MM-DD):', request.fromDate || '');
        const toDate = window.prompt('Leave to date (YYYY-MM-DD):', request.toDate || '');
        if (!fromDate || !toDate) return;
        await leavePermissionAdminService.update(request.id, {...request, fromDate, toDate, reason: request.reason || reason});
      }
      notify('Request updated.'); await load();
    } catch (e) { notify(e.message, 'error'); }
  };

  const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-';
  const dateRange = r => r.type === 'Leave' ? `${r.fromDate || '-'} → ${r.toDate || '-'}` : `${r.date || '-'} ${r.fromTime || ''} → ${r.toTime || ''}`;

  return (
    <div className="leave-permission-admin">
      {toast && <div className={`toast-notification ${toast.type}`}><span>{toast.message}</span></div>}
      <div className="admin-header">
        <h1><i className="fas fa-calendar-alt" /> Leave &amp; Permissions</h1>
        <div className="admin-actions"><button className="btn btn-secondary" onClick={load}><i className="fas fa-sync" /> Refresh</button></div>
      </div>

      <div className="summary-cards">
        <div className="card"><div className="card-icon"><i className="fas fa-list" /></div><div className="card-content"><h3>Total Requests</h3><p className="card-number">{summary.totalRequests ?? requests.length}</p></div></div>
        <div className="card"><div className="card-icon"><i className="fas fa-hourglass-half" /></div><div className="card-content"><h3>Pending</h3><p className="card-number">{summary.pendingRequests ?? pending.length}</p></div></div>
        <div className="card"><div className="card-icon"><i className="fas fa-check-circle" /></div><div className="card-content"><h3>Approved Today</h3><p className="card-number">{summary.approvedToday ?? 0}</p></div></div>
        <div className="card"><div className="card-icon"><i className="fas fa-times-circle" /></div><div className="card-content"><h3>Rejected Today</h3><p className="card-number">{summary.rejectedToday ?? 0}</p></div></div>
      </div>

      <div className="admin-tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending Requests <span className="tab-badge">{pending.length}</span></button>
        <button className={`tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>All Requests</button>
      </div>

      <div className="tab-content">
        {activeTab === 'pending' && (
          <div className="section">
            <div className="section-header"><h2><i className="fas fa-list" /> Pending Approval Requests</h2><span className="request-count">{pending.length} pending</span></div>
            <RequestTable rows={pending} loading={loading} busyId={busyId} onView={setSelected} onReview={review} onEdit={editRequest} dateRange={dateRange} formatDate={formatDate} />
          </div>
        )}
        {activeTab === 'records' && (
          <div className="section">
            <div className="section-header">
              <h2><i className="fas fa-address-book" /> Request History</h2>
              <select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>
            </div>
            <RequestTable rows={filtered} loading={loading} busyId={busyId} onView={setSelected} onReview={review} onEdit={editRequest} dateRange={dateRange} formatDate={formatDate} />
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Request Details</h2><button className="modal-close" onClick={() => setSelected(null)}>×</button></div>
            <div className="modal-body">
              <p><b>Employee:</b> {selected.employeeName} ({selected.username})</p>
              <p><b>Type:</b> {selected.type}</p>
              <p><b>Period:</b> {dateRange(selected)}</p>
              <p><b>Duration:</b> {selected.duration || '-'}</p>
              <p><b>Reason:</b> {selected.reason || '-'}</p>
              <p><b>Status:</b> {selected.status}</p>
              <p><b>Applied:</b> {formatDate(selected.submittedAt)}</p>
              {selected.rejectionReason && <p><b>Rejection reason:</b> {selected.rejectionReason}</p>}
            </div>
            {selected.status === 'Pending' && <div className="modal-footer"><button className="btn btn-success" disabled={busyId === selected.id} onClick={() => review(selected, 'Approved')}>Approve</button><button className="btn btn-danger" disabled={busyId === selected.id} onClick={() => review(selected, 'Rejected')}>Reject</button></div>}
          </div>
        </div>
      )}
    </div>
  );
};

function RequestTable({ rows, loading, busyId, onView, onReview, onEdit, dateRange, formatDate }) {
  if (loading) return <div className="empty-state">Loading requests...</div>;
  if (!rows.length) return <div className="empty-state"><i className="fas fa-check-circle" /><h3>All Clear!</h3><p>No requests found.</p></div>;
  return <div className="table-container"><table className="admin-table"><thead><tr><th>Employee</th><th>Type</th><th>Period</th><th>Duration</th><th>Reason</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td><strong>{r.employeeName || r.username}</strong><br/><small>{r.employeeId || r.username}</small></td><td><span className={`type-badge ${(r.type || '').toLowerCase()}`}>{r.type}</span></td><td>{dateRange(r)}</td><td>{r.duration || '-'}</td><td>{r.reason || '-'}</td><td>{formatDate(r.submittedAt)}</td><td><span className={r.status === 'Pending' ? 'status-pending' : r.status === 'Approved' ? 'status-approved' : 'status-rejected'}>{r.status}</span></td><td className="action-buttons"><button className="btn btn-sm btn-view" onClick={() => onView(r)}>View</button><button className="btn btn-sm" onClick={() => onEdit(r)}>Edit</button>{r.status === 'Pending' && <><button className="btn btn-sm btn-success" disabled={busyId === r.id} onClick={() => onReview(r, 'Approved')}>Approve</button><button className="btn btn-sm btn-danger" disabled={busyId === r.id} onClick={() => onReview(r, 'Rejected')}>Reject</button></>}</td></tr>)}</tbody></table></div>;
}

export default LeavePermissionAdmin;
