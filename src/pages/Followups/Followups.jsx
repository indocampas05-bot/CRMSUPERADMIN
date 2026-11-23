import React, { useState, useMemo } from 'react';
import './Followups.css';
import {
  FiCalendar,
  FiClock,
  FiPhone,
  FiMail,
  FiVideo,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiCheck,
  FiX,
} from 'react-icons/fi';

// ─── Mock Data ──────────────────────────────────────────────────────────────────
export const INITIAL_FOLLOWUPS = [
  {
    id: 'FU-1001', leadId: 'LD-5264', leadName: 'Lakshmi Narayanan',
    mobile: '+91 93456 78901', email: 'lakshmi.n@email.com',
    campaign: 'Mutual Fund', type: 'Call Back',
    date: '2026-06-28', time: '10:00', note: 'Discuss SIP plan ₹5000/month. Interested in moderate risk.',
    status: 'Pending', priority: 'High', createdOn: '12 Jun 2026',
  },
  {
    id: 'FU-1002', leadId: 'LD-5261', leadName: 'Aravind M',
    mobile: '+91 90001 22222', email: 'aravind.m@email.com',
    campaign: 'Health Insurance', type: 'Demo',
    date: '2026-06-28', time: '11:30', note: 'Live demo of Family Floater plan. Wife has BP — highlight low waiting period.',
    status: 'Pending', priority: 'High',  createdOn: '12 Jun 2026',
  },
  {
    id: 'FU-1003', leadId: 'LD-5267', leadName: 'Sangeetha R',
    mobile: '+91 91234 56789', email: 'sangeetha.r@email.com',
    campaign: 'Health Insurance', type: 'Follow-Up Call',
    date: '2026-06-28', time: '02:00', note: 'Check if she reviewed the policy document sent last week.',
    status: 'Pending', priority: 'Medium', createdOn: '11 Jun 2026',
  },
  {
    id: 'FU-1004', leadId: 'LD-5255', leadName: 'Ganesh P',
    mobile: '+91 90000 33445', email: 'ganesh.p@email.com',
    campaign: 'Health Insurance', type: 'Send Quotation',
    date: '2026-06-27', time: '09:00', note: 'Send revised quotation after adding dental cover.',
    status: 'Completed', priority: 'Medium',  createdOn: '10 Jun 2026',
  },
  {
    id: 'FU-1005', leadId: 'LD-5266', leadName: 'Vikram Singh',
    mobile: '+91 99887 66554', email: 'vikram.s@email.com',
    campaign: 'Investment Plan', type: 'Meeting',
    date: '2026-06-26', time: '03:00', note: 'Office visit — bring plan comparison charts.',
    status: 'Completed', priority: 'Low', createdOn: '09 Jun 2026',
  },
  {
    id: 'FU-1006', leadId: 'LD-5263', leadName: 'Manoj A',
    mobile: '+91 97865 43211', email: 'manoj.a@email.com',
    campaign: 'Health Insurance', type: 'Follow-Up Call',
    date: '2026-06-26', time: '11:00', note: 'Third follow-up. Last call went to voicemail.',
    status: 'Missed', priority: 'High',  createdOn: '08 Jun 2026',
  },
  {
    id: 'FU-1007', leadId: 'LD-5257', leadName: 'Suresh M',
    mobile: '+91 99123 44556', email: 'suresh.m@email.com',
    campaign: 'Investment Plan', type: 'Call Back',
    date: '2026-06-29', time: '04:30', note: 'Will confirm with family and call back end of month.',
    status: 'Pending', priority: 'Low', createdOn: '12 Jun 2026',
  },
  {
    id: 'FU-1008', leadId: 'LD-5253', leadName: 'Riya R',
    mobile: '+91 98888 77777', email: 'demo@email.com',
    campaign: 'Health Insurance', type: 'Demo',
    date: '2026-06-30', time: '10:30', note: 'Scheduled online product demo via Google Meet.',
    status: 'Pending', priority: 'High',  createdOn: '13 Jun 2026',
  },
  {
    id: 'FU-1009', leadId: 'LD-5262', leadName: 'Deepak Y',
    mobile: '+91 91235 67890', email: 'deepak.y@email.com',
    campaign: 'Investment Plan', type: 'Send Email',
    date: '2026-06-27', time: '05:00', note: 'Email brochures for Equity Linked Savings Scheme.',
    status: 'Completed', priority: 'Low',  createdOn: '10 Jun 2026',
  },
  {
    id: 'FU-1010', leadId: 'LD-5256', leadName: 'Nivetha R',
    mobile: '+91 91111 22334', email: 'nivetha.r@email.com',
    campaign: 'Mutual Fund', type: 'Call Back',
    date: '2026-06-28', time: '03:30', note: 'Wants SIP details emailed. Preferred risk: moderate.',
    status: 'Pending', priority: 'Medium', createdOn: '11 Jun 2026',
  },
];

const TYPE_ICON = {
  'Call Back':      <FiPhone />,
  'Follow-Up Call': <FiPhone />,
  'Demo':           <FiVideo />,
  'Meeting':        <FiUsers />,
  'Send Quotation': <FiMail />,
  'Send Email':     <FiMail />,
  'Other':          <FiBell />,
};

const TYPE_STYLE = {
  'Call Back':      { bg: '#e0f2fe', color: '#0369a1' },
  'Follow-Up Call': { bg: '#ede9fe', color: '#6d28d9' },
  'Demo':           { bg: '#fce7f3', color: '#9d174d' },
  'Meeting':        { bg: '#ecfdf5', color: '#065f46' },
  'Send Quotation': { bg: '#fef3c7', color: '#92400e' },
  'Send Email':     { bg: '#dbeafe', color: '#1e40af' },
  'Other':          { bg: '#f3f4f6', color: '#374151' },
};

const STATUS_STYLE = {
  'Pending':   { bg: '#fef9c3', color: '#92400e' },
  'Completed': { bg: '#dcfce7', color: '#15803d' },
  'Missed':    { bg: '#fee2e2', color: '#b91c1c' },
  'Cancelled': { bg: '#f1f5f9', color: '#64748b' },
};

const PRIORITY_STYLE = {
  'High':   { bg: '#fee2e2', color: '#b91c1c' },
  'Medium': { bg: '#fef3c7', color: '#b45309' },
  'Low':    { bg: '#dcfce7', color: '#15803d' },
};

const TYPES    = ['All Types', 'Call Back', 'Follow-Up Call', 'Demo', 'Meeting', 'Send Quotation', 'Send Email', 'Other'];
const STATUSES = ['All Status', 'Pending', 'Completed', 'Missed', 'Cancelled'];
const AGENTS   = ['All Agents', 'Arun Kumar', 'Priya Sharma'];
const PRIORITIES = ['All Priority', 'High', 'Medium', 'Low'];
const ROWS_OPTIONS = [5, 10, 15, 20];

const today = new Date().toISOString().split('T')[0];

// ─── Modal Component ────────────────────────────────────────────────────────────
const Modal = ({ show, title, onClose, children, wide }) => {
  if (!show) return null;
  return (
    <div className="fu-modal-overlay" onClick={onClose}>
      <div className={`fu-modal-box${wide ? ' fu-modal-box-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="fu-modal-header">
          <span className="fu-modal-title">{title}</span>
          <button className="fu-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fu-modal-body">{children}</div>
      </div>
    </div>
  );
};

// ─── Follow-Up Form ─────────────────────────────────────────────────────────────
const FollowUpForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || {
    leadName: '', mobile: '', email: '', campaign: 'Health Insurance',
    type: 'Call Back', date: '', time: '', note: '',
    priority: 'Medium', status: 'Pending',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fu-lead-form">
      <div className="fu-form-row">
        <div className="fu-form-group">
          <label>Lead Name</label>
          <input type="text" value={form.leadName} onChange={e => set('leadName', e.target.value)} placeholder="Lead Name" />
        </div>
        <div className="fu-form-group">
          <label>Mobile</label>
          <input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
      </div>
      <div className="fu-form-row">
        <div className="fu-form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="fu-form-group">
          <label>Campaign</label>
          <select value={form.campaign} onChange={e => set('campaign', e.target.value)}>
            {['Health Insurance', 'Investment Plan', 'Mutual Fund', 'Term Insurance'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="fu-form-row">
        <div className="fu-form-group">
          <label>Follow-Up Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {TYPES.slice(1).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="fu-form-group">
          <label>Priority</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}>
            {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="fu-form-row">
        <div className="fu-form-group">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} min={today} />
        </div>
        <div className="fu-form-group">
          <label>Time</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>
     
      <div className="fu-form-group">
        <label>Note</label>
        <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Describe the follow-up…" />
      </div>
      <div className="fu-form-actions">
        <button className="fu-btn-outline" onClick={onClose}>Cancel</button>
        <button className="fu-btn-primary" onClick={() => onSave(form)}>Save Follow-Up</button>
      </div>
    </div>
  );
};

// ─── View Follow-Up Detail ──────────────────────────────────────────────────────
const ViewFollowUp = ({ fu, onClose, onCall }) => (
  <div className="fu-view-lead">
    <div className="fu-view-header">
      <div className="fu-view-id">{fu.id}</div>
      <span className="fu-status-pill" style={STATUS_STYLE[fu.status]}>{fu.status}</span>
    </div>
    {[
      ['Lead', fu.leadName],
      ['Lead ID', fu.leadId],
      ['Mobile', fu.mobile],
      ['Email', fu.email],
      ['Campaign', fu.campaign],
      ['Type', fu.type],
      ['Date', fu.date],
      ['Time', fu.time],
      ['Priority', fu.priority],
   
      ['Created On', fu.createdOn],
    ].map(([k, v]) => (
      <div key={k} className="fu-view-row">
        <span className="fu-view-key">{k}</span>
        <span className="fu-view-val">{v}</span>
      </div>
    ))}
    {fu.note && (
      <div className="fu-view-row" style={{ flexDirection: 'column', gap: 4 }}>
        <span className="fu-view-key">Note</span>
        <span className="fu-view-val" style={{ fontWeight: 500, lineHeight: 1.5 }}>{fu.note}</span>
      </div>
    )}
    <div className="fu-form-actions" style={{ marginTop: 12 }}>
      <button className="fu-btn-outline" onClick={onClose}>Close</button>
      <button className="fu-btn-primary" onClick={() => onCall(fu)}>
        <FiPhone style={{ marginRight: 6 }} /> Call Now
      </button>
    </div>
  </div>
);

// ─── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => (
  <div className="fu-toast" onClick={onClose}>{msg}</div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
const FollowUps = ({ onNavigate }) => {
  const [followUps, setFollowUps]     = useState(INITIAL_FOLLOWUPS);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');
  
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected]       = useState([]);
  const [showAdd, setShowAdd]         = useState(false);
  const [editFu, setEditFu]           = useState(null);
  const [viewFu, setViewFu]           = useState(null);
  const [toast, setToast]             = useState(null);
  const [activeTab, setActiveTab]     = useState('All');

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today_ = new Date().toISOString().split('T')[0];
    return {
      total:     followUps.length,
      pending:   followUps.filter(f => f.status === 'Pending').length,
      today_:    followUps.filter(f => f.date === today_ && f.status === 'Pending').length,
      completed: followUps.filter(f => f.status === 'Completed').length,
      missed:    followUps.filter(f => f.status === 'Missed').length,
      overdue:   followUps.filter(f => f.date < today_ && f.status === 'Pending').length,
    };
  }, [followUps]);

  // ─── Filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today_ = new Date().toISOString().split('T')[0];
    let data = [...followUps];

    // Tab filter
    if (activeTab === 'Today')    data = data.filter(f => f.date === today_);
    if (activeTab === 'Upcoming') data = data.filter(f => f.date > today_ && f.status === 'Pending');
    if (activeTab === 'Overdue')  data = data.filter(f => f.date < today_ && f.status === 'Pending');
    if (activeTab === 'Completed')data = data.filter(f => f.status === 'Completed');

    if (search)                           data = data.filter(f => f.leadName.toLowerCase().includes(search.toLowerCase()) || f.mobile.includes(search) || f.id.includes(search));
    if (filterType !== 'All Types')       data = data.filter(f => f.type === filterType);
    if (filterStatus !== 'All Status')    data = data.filter(f => f.status === filterStatus);
    
    if (filterPriority !== 'All Priority')data = data.filter(f => f.priority === filterPriority);

    return data;
  }, [followUps, search, filterType, filterStatus, filterPriority, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // ─── Selection ───────────────────────────────────────────────────────────────
  const allSelected   = paginated.length > 0 && paginated.every(f => selected.includes(f.id));
  const toggleAll     = () => allSelected ? setSelected(s => s.filter(id => !paginated.map(f => f.id).includes(id))) : setSelected(s => [...new Set([...s, ...paginated.map(f => f.id)])]);
  const toggleRow     = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  const handleAdd = form => {
    const newFu = {
      ...form,
      id: `FU-${1011 + followUps.length}`,
      leadId: `LD-${Math.floor(Math.random() * 1000) + 5000}`,
      createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setFollowUps(prev => [newFu, ...prev]);
    setShowAdd(false);
    showToast('✅ Follow-up scheduled successfully!');
  };

  const handleEdit = form => {
    setFollowUps(prev => prev.map(f => f.id === editFu.id ? { ...f, ...form } : f));
    setEditFu(null);
    showToast('✏️ Follow-up updated successfully!');
  };

  const handleDelete = id => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
    setSelected(s => s.filter(x => x !== id));
    showToast('🗑️ Follow-up deleted.');
  };

  const handleMarkComplete = id => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'Completed' } : f));
    showToast('✅ Marked as Completed!');
  };

  const handleMarkMissed = id => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'Missed' } : f));
    showToast('⚠️ Marked as Missed.');
  };

  const handleBulkDelete = () => {
    setFollowUps(prev => prev.filter(f => !selected.includes(f.id)));
    showToast(`🗑️ Deleted ${selected.length} follow-up(s).`);
    setSelected([]);
  };

  const handleBulkComplete = () => {
    setFollowUps(prev => prev.map(f => selected.includes(f.id) ? { ...f, status: 'Completed' } : f));
    showToast(`✅ Marked ${selected.length} as Completed.`);
    setSelected([]);
  };

  const handleCallNow = fu => {
    showToast(`📞 Calling ${fu.leadName}…`);
  };

  const fmtDate = d => {
    if (!d) return '--';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtTime = t => {
    if (!t) return '--';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
  };

  const today_ = new Date().toISOString().split('T')[0];
  const isOverdue  = fu => fu.date < today_ && fu.status === 'Pending';
  const isToday    = fu => fu.date === today_;

  // ─── Pagination ──────────────────────────────────────────────────────────────
  const pgRange = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)       return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const TABS = [
    { key: 'All',       label: `All (${followUps.length})` },
    { key: 'Today',     label: `Today (${stats.today_})` },
    { key: 'Upcoming',  label: `Upcoming (${followUps.filter(f => f.date > today_ && f.status === 'Pending').length})` },
    { key: 'Overdue',   label: `Overdue (${stats.overdue})`, warn: stats.overdue > 0 },
    { key: 'Completed', label: `Completed (${stats.completed})` },
  ];

  return (
    <div className="fu-page">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="fu-page-header">
        <div>
          <h1 className="fu-page-title">Follow-Ups</h1>
          
        </div>
        <div className="fu-header-actions">
          <button className="fu-btn-outline-primary" onClick={() => showToast('📥 Exporting…')}>
            <FiDownload className="fu-btn-icon" /> Export
          </button>
          <button className="fu-btn-primary" onClick={() => setShowAdd(true)}>
            <FiPlus className="fu-btn-ico" /> Schedule Follow-Up
          </button>
        </div>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="fu-stats-row">
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><FiCalendar /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.total}</div>
            <div className="fu-stat-label">Total Follow-Ups</div>
          </div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#fef9c3', color: '#92400e' }}><FiClock /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.pending}</div>
            <div className="fu-stat-label">Pending</div>
          </div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><FiBell /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.today_}</div>
            <div className="fu-stat-label">Due Today</div>
          </div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><FiCheckCircle /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.completed}</div>
            <div className="fu-stat-label">Completed</div>
          </div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><FiAlertCircle /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.overdue}</div>
            <div className="fu-stat-label">Overdue</div>
          </div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-icon" style={{ background: '#fce7f3', color: '#9d174d' }}><FiRefreshCw /></div>
          <div className="fu-stat-info">
            <div className="fu-stat-val">{stats.missed}</div>
            <div className="fu-stat-label">Missed</div>
          </div>
        </div>
      </div>

      {/* ─── Table Card ──────────────────────────────────────────────────────── */}
      <div className="fu-table-card">

        {/* Tabs */}
        <div className="fu-tabs-row">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`fu-tab${activeTab === tab.key ? ' fu-active' : ''}${tab.warn ? ' fu-tab-warn' : ''}`}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="fu-filter-bar">
          <div className="fu-search-wrap">
            <FiSearch className="fu-search-ico" />
            <input
              className="fu-search-input"
              placeholder="Search by name, mobile, ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="fu-filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="fu-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="fu-filter-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          
        </div>

        {/* Toolbar */}
        <div className="fu-table-toolbar">
          <span className="fu-total-count">
            Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> follow-ups
            {selected.length > 0 && <span className="fu-selected-badge"> · {selected.length} selected</span>}
          </span>
          <div className="fu-toolbar-right">
            {selected.length > 0 && (
              <>
                <button className="fu-btn-outline-sm" onClick={handleBulkComplete}><FiCheck style={{marginRight:4}}/> Mark Completed</button>
                <button className="fu-btn-danger-sm" onClick={handleBulkDelete}><FiTrash2 style={{marginRight:4}}/> Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="fu-table-wrap">
          <table className="fu-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                <th style={{ width: '100px' }}>Follow-Up ID</th>
                <th style={{ width: '140px' }}>Lead</th>
                <th style={{ width: '120px' }}>Type</th>
                <th style={{ width: '140px' }}>Date &amp; Time</th>
                <th style={{ width: '80px' }}>Priority</th>
                <th style={{ width: '100px' }}>Status</th>
                <th>Note</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className="fu-empty-row">No follow-ups found matching your filters.</td></tr>
              ) : paginated.map(fu => (
                <tr key={fu.id} className={selected.includes(fu.id) ? 'fu-row-selected' : ''}>
                  <td><input type="checkbox" checked={selected.includes(fu.id)} onChange={() => toggleRow(fu.id)} /></td>
                  <td>
                    <div className="fu-lead-id">{fu.id}</div>
                    <div className="fu-lead-id fu-lead-id-sub">{fu.leadId}</div>
                  </td>
                  <td>
                    <div className="fu-lead-name">{fu.leadName}</div>
                    <div className="fu-lead-mobile">{fu.mobile}</div>
                  </td>
                  <td>
                    <span className="fu-type-badge" style={{ background: TYPE_STYLE[fu.type]?.bg, color: TYPE_STYLE[fu.type]?.color }}>
                      <span className="fu-type-icon">{TYPE_ICON[fu.type]}</span>
                      {fu.type}
                    </span>
                  </td>
                  <td>
                    <div className={`fu-date-val${isOverdue(fu) ? ' fu-overdue' : ''}${isToday(fu) ? ' fu-today' : ''}`}>
                      <FiCalendar style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {fmtDate(fu.date)}
                    </div>
                    <div className="fu-time-val">
                      <FiClock style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {fmtTime(fu.time)}
                    </div>
                    {isOverdue(fu) && <span className="fu-overdue-badge">Overdue</span>}
                    {isToday(fu)   && <span className="fu-today-badge">Today</span>}
                  </td>
                  <td>
                    <span className="fu-status-pill" style={PRIORITY_STYLE[fu.priority]}>{fu.priority}</span>
                  </td>
                  <td>
                    <span className="fu-status-pill" style={STATUS_STYLE[fu.status]}>{fu.status}</span>
                  </td>
                  
                  <td>
                    <div className="fu-note-cell">{fu.note || '--'}</div>
                  </td>
                  <td>
                    <div className="fu-action-group">
                      <button className="fu-act-btn" title="View" onClick={() => setViewFu(fu)}><FiEye /></button>
                      <button className="fu-act-btn" title="Edit" onClick={() => setEditFu(fu)}><FiEdit2 /></button>
                      <button className="fu-act-btn" title="Call Now" onClick={() => handleCallNow(fu)}><FiPhone /></button>
                      {fu.status === 'Pending' && (
                        <button className="fu-act-btn fu-act-complete" title="Mark Completed" onClick={() => handleMarkComplete(fu.id)}><FiCheck /></button>
                      )}
                      {fu.status === 'Pending' && (
                        <button className="fu-act-btn fu-act-missed" title="Mark Missed" onClick={() => handleMarkMissed(fu.id)}><FiX /></button>
                      )}
                      <button className="fu-act-btn fu-act-danger" title="Delete" onClick={() => handleDelete(fu.id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="fu-pagination-bar">
          <div className="fu-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="fu-page-nums">
            <button className="fu-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}><FiChevronLeft /></button>
            {pgRange().map((p, i) =>
              p === '...'
                ? <span key={`dots-${i}`} className="fu-pg-dots">…</span>
                : <button key={p} className={`fu-pg-btn${page === p ? ' fu-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )}
            <button className="fu-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><FiChevronRight /></button>
          </div>
        </div>
      </div>

      <div className="fu-footer">
        <span>© 2024 CRM Call Center. All rights reserved.</span>
        <span>Version 1.0.0</span>
      </div>
    </div>
  );
};

export default FollowUps;