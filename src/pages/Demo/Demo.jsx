// src/pages/Demo/Demo.jsx
import React, { useState, useMemo, useCallback } from 'react';
import './Demo.css';
import {
  FiMonitor, FiPlus, FiSearch, FiCalendar, FiClock,
  FiVideo, FiPhone, FiMapPin, FiLink, FiCopy,
  FiExternalLink, FiEdit2, FiTrash2, FiEye,
  FiX, FiCheck, FiChevronLeft, FiChevronRight,
  FiUser, FiMail, FiRefreshCw, FiZap,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const EXECUTIVES = ['All', 'Hari Krishnan', 'Priya Sharma', 'Arun Kumar', 'Meena Rajan'];
const DEMO_STATUSES = ['Scheduled', 'Live', 'Completed', 'Cancelled', 'Rescheduled'];
const MEETING_TYPES = [
  { id: 'meet',   label: 'Google Meet', icon: <FiVideo size={14}/> },
  { id: 'office', label: 'Office Visit', icon: <FiMapPin size={14}/> },
  { id: 'phone',  label: 'Phone Call',   icon: <FiPhone size={14}/> },
];
const ROWS_OPTIONS = [10, 20, 50];

const AVATAR_COLORS = [
  '#7b1113','#2563eb','#16a34a','#7c3aed',
  '#c2410c','#0369a1','#4338ca','#be185d',
];

const STATUS_CONFIG = {
  Scheduled:   { cls: 'dm-status-scheduled',   label: 'Scheduled'   },
  Live:        { cls: 'dm-status-live',        label: 'Live'        },
  Completed:   { cls: 'dm-status-completed',   label: 'Completed'   },
  Cancelled:   { cls: 'dm-status-cancelled',   label: 'Cancelled'   },
  Rescheduled: { cls: 'dm-status-rescheduled', label: 'Rescheduled' },
  
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_DEMOS = [
  {
    id: 'DM-1001', clientName: 'Aravind M', leadId: 'LD-5261',
    email: 'aravind.m@email.com', phone: '+91 90001 22222',
    topic: 'School ERP – Full Module Demo',
    date: '2026-06-30', time: '11:00', duration: '60 min',
    executive: 'Hari Krishnan', meetType: 'meet',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    status: 'Scheduled', notes: 'Client interested in admission & fee module. Demo to cover full workflow.',
    createdOn: '27 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '27 Jun 2026 · 10:15 AM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
      { action: 'Meet link generated', time: '27 Jun 2026 · 10:16 AM', icon: '🔗', bg: '#e0e7ff', color: '#4338ca' },
    ],
  },
  {
    id: 'DM-1002', clientName: 'Lakshmi Narayanan', leadId: 'LD-5264',
    email: 'lakshmi.n@email.com', phone: '+91 93456 78901',
    topic: 'College ERP – Finance & HR Modules',
    date: '2026-06-30', time: '15:00', duration: '45 min',
    executive: 'Hari Krishnan', meetType: 'meet',
    meetLink: 'https://meet.google.com/xyz-uvwx-qrs',
    status: 'Live', notes: 'Focus on payroll and faculty management. Decision maker present.',
    createdOn: '26 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '26 Jun 2026 · 2:00 PM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
      { action: 'Demo started', time: '30 Jun 2026 · 3:00 PM', icon: '🎥', bg: '#dcfce7', color: '#15803d' },
    ],
  },
  {
    id: 'DM-1003', clientName: 'Rahul Sharma', leadId: 'LD-5270',
    email: 'rahul.s@email.com', phone: '+91 98765 43210',
    topic: 'University ERP – Student Portal',
    date: '2026-06-29', time: '17:00', duration: '60 min',
    executive: 'Priya Sharma', meetType: 'meet',
    meetLink: 'https://meet.google.com/lmn-opqr-stu',
    status: 'Completed', notes: 'Smooth demo. Client requested proposal by EOD.',
    createdOn: '25 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '25 Jun 2026 · 9:00 AM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
      { action: 'Demo Completed', time: '29 Jun 2026 · 6:05 PM', icon: '✅', bg: '#dcfce7', color: '#15803d' },
      { action: 'Follow-up created', time: '29 Jun 2026 · 6:10 PM', icon: '🔔', bg: '#fef9c3', color: '#92400e' },
    ],
  },
  {
    id: 'DM-1004', clientName: 'Sangeetha R', leadId: 'LD-5267',
    email: 'sangeetha.r@email.com', phone: '+91 91234 56789',
    topic: 'School ERP – Library & Transport',
    date: '2026-07-01', time: '10:30', duration: '30 min',
    executive: 'Arun Kumar', meetType: 'office',
    meetLink: '',
    status: 'Scheduled', notes: 'Visit to our Puducherry office. Bring brochure and sample reports.',
    createdOn: '28 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '28 Jun 2026 · 4:00 PM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
    ],
  },
  {
    id: 'DM-1005', clientName: 'Karthik V', leadId: 'LD-5255',
    email: 'karthik.v@email.com', phone: '+91 87654 32109',
    topic: 'College ERP – Full Demo',
    date: '2026-06-28', time: '14:00', duration: '60 min',
    executive: 'Meena Rajan', meetType: 'meet',
    meetLink: 'https://meet.google.com/vwx-yzab-cde',
    status: 'Cancelled', notes: 'Client cancelled due to internal meeting conflict. Rescheduling pending.',
    createdOn: '24 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '24 Jun 2026 · 11:00 AM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
      { action: 'Demo Cancelled by Client', time: '28 Jun 2026 · 1:30 PM', icon: '❌', bg: '#fee2e2', color: '#dc2626' },
    ],
  },
  {
    id: 'DM-1006', clientName: 'Divya Menon', leadId: 'LD-5272',
    email: 'divya.m@email.com', phone: '+91 99887 76655',
    topic: 'University ERP – Admissions Module',
    date: '2026-07-02', time: '11:00', duration: '45 min',
    executive: 'Priya Sharma', meetType: 'phone',
    meetLink: '',
    status: 'Scheduled', notes: 'Phone demo. Client has slow internet. Prepare a loom video as backup.',
    createdOn: '29 Jun 2026',
    timeline: [
      { action: 'Demo Scheduled', time: '29 Jun 2026 · 9:30 AM', icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const initials = (name) =>
  name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
};

const generateMeetLink = () => {
  const seg = () => Math.random().toString(36).substring(2, 5);
  return `https://meet.google.com/${seg()}-${seg()}-${seg()}`;
};

const isToday = (d) => {
  const today = new Date().toISOString().slice(0, 10);
  return d === today;
};

const isUpcoming = (d) => d > new Date().toISOString().slice(0, 10);

// ─── Empty Demo Template ──────────────────────────────────────────────────────
const emptyDemo = () => ({
  id: '', clientName: '', leadId: '', email: '', phone: '',
  topic: '', date: '', time: '', duration: '60 min',
  executive: 'Hari Krishnan', meetType: 'meet', meetLink: '',
  status: 'Scheduled', notes: '', createdOn: '', timeline: [],
});

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`dm-toast dm-toast-${type}`} onClick={onClose}>
    {type === 'success' ? <FiCheck /> : type === 'error' ? <FiX /> : <FiZap />}
    {msg}
  </div>
);

// ─── Status Pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { cls: '', label: status };
  return (
    <span className={`dm-status-pill ${cfg.cls}`}>
      {status === 'Live' && <span className="dm-live-dot" />}
      {cfg.label}
    </span>
  );
};

// ─── Join / Meeting Button ────────────────────────────────────────────────────
const MeetBtn = ({ demo }) => {
  if (demo.status === 'Cancelled') return null;
  if (demo.meetType === 'phone') {
    return (
      <a href={`tel:${demo.phone}`} className="dm-join-btn">
        <FiPhone size={12}/> Call
      </a>
    );
  }
  if (demo.meetType === 'office') {
    return <span className="dm-join-btn-disabled"><FiMapPin size={12}/> In-Person</span>;
  }
  if (demo.meetLink) {
    return (
      <a href={demo.meetLink} target="_blank" rel="noreferrer" className="dm-join-btn">
        <FiVideo size={12}/> Join
      </a>
    );
  }
  return <span className="dm-join-btn-disabled"><FiVideo size={12}/> No Link</span>;
};

// ─── Schedule / Edit Modal ────────────────────────────────────────────────────
const DemoFormModal = ({ initial, onSave, onClose, allDemos }) => {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(
    isEdit ? { ...initial } : emptyDemo()
  );
  const [linkCopied, setLinkCopied] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerateLink = () => {
    set('meetLink', generateMeetLink());
    set('meetType', 'meet');
  };

  const handleCopyLink = () => {
    if (!form.meetLink) return;
    navigator.clipboard.writeText(form.meetLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSave = () => {
    if (!form.clientName.trim()) return;
    if (!form.date || !form.time) return;

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    if (isEdit) {
      onSave({ ...form });
    } else {
      const newId = `DM-${1000 + allDemos.length + 1}`;
      onSave({
        ...form,
        id: newId,
        createdOn: today,
        timeline: [
          { action: 'Demo Scheduled', time: `${today} · ${fmtTime(form.time)}`, icon: '📅', bg: '#dbeafe', color: '#1d4ed8' },
          ...(form.meetLink ? [{ action: 'Meet link generated', time: `${today}`, icon: '🔗', bg: '#e0e7ff', color: '#4338ca' }] : []),
        ],
      });
    }
  };

  return (
    <div className="dm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dm-modal-box dm-modal-box-wide">
        <div className="dm-modal-header">
          <span className="dm-modal-title">{isEdit ? 'Edit Demo' : 'Schedule New Demo'}</span>
          <button className="dm-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="dm-modal-body">
          <div className="dm-form">

            {/* Client Info */}
            <div className="dm-form-section">
              <div className="dm-form-section-title">Client Information</div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>Client Name *</label>
                  <input value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="e.g. Aravind M" />
                </div>
                <div className="dm-form-group">
                  <label>Lead ID</label>
                  <input value={form.leadId} onChange={e => set('leadId', e.target.value)} placeholder="e.g. LD-5261" />
                </div>
              </div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@email.com" />
                </div>
                <div className="dm-form-group">
                  <label>Phone Number</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
            </div>

            {/* Demo Details */}
            <div className="dm-form-section">
              <div className="dm-form-section-title">Demo Details</div>
              <div className="dm-form-group">
                <label>Demo Topic</label>
                <input value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. School ERP – Admission & Fee Module" />
              </div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>Demo Date *</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div className="dm-form-group">
                  <label>Demo Time *</label>
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
              </div>
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>Duration</label>
                  <select value={form.duration} onChange={e => set('duration', e.target.value)}>
                    {['15 min','30 min','45 min','60 min','90 min','2 hrs'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="dm-form-group">
                  <label>Assigned Executive</label>
                  <select value={form.executive} onChange={e => set('executive', e.target.value)}>
                    {EXECUTIVES.filter(e => e !== 'All').map(ex => <option key={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              {isEdit && (
                <div className="dm-form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}>
                    {DEMO_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Meeting Details */}
            <div className="dm-form-section">
              <div className="dm-form-section-title">Meeting Details</div>
              <div className="dm-form-group">
                <label>Meeting Type</label>
                <div className="dm-meeting-types">
                  {MEETING_TYPES.map(mt => (
                    <button
                      key={mt.id}
                      className={`dm-meeting-type-btn ${form.meetType === mt.id ? 'active' : ''}`}
                      onClick={() => set('meetType', mt.id)}
                      type="button"
                    >
                      {mt.icon} {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.meetType === 'meet' && (
                <div className="dm-form-group">
                  <label>Google Meet Link</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="dm-meet-link-row">
                      <input
                        className="dm-meet-link-input"
                        value={form.meetLink}
                        onChange={e => set('meetLink', e.target.value)}
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      />
                    </div>
                    <div className="dm-meet-actions">
                      <button className="dm-generate-btn" onClick={handleGenerateLink} type="button">
                        <FiRefreshCw size={12}/> Generate Link
                      </button>
                      {form.meetLink && (
                        <>
                          <button className="dm-copy-btn" onClick={handleCopyLink} type="button">
                            {linkCopied ? <FiCheck size={12}/> : <FiCopy size={12}/>}
                            {linkCopied ? 'Copied!' : 'Copy Link'}
                          </button>
                          <a href={form.meetLink} target="_blank" rel="noreferrer" className="dm-open-btn">
                            <FiExternalLink size={12}/> Open Meeting
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="dm-form-section">
              <div className="dm-form-section-title">Notes</div>
              <div className="dm-form-group">
                <label>Internal Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Add any notes, preparation details, or client requirements..."
                />
              </div>
            </div>

            <div className="dm-form-actions">
              <button className="dm-btn-outline" onClick={onClose} type="button">Cancel</button>
              <button className="dm-btn-primary" onClick={handleSave} type="button">
                <FiCheck size={14}/> {isEdit ? 'Save Changes' : 'Schedule Demo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── View Demo Modal ──────────────────────────────────────────────────────────
const DemoViewModal = ({ demo, onClose, onEdit }) => {
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => {
    if (!demo.meetLink) return;
    navigator.clipboard.writeText(demo.meetLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const infoRows = [
    ['Lead ID',    demo.leadId  || '—'],
    ['Email',      demo.email   || '—'],
    ['Phone',      demo.phone   || '—'],
    ['Topic',      demo.topic   || '—'],
    ['Date',       fmtDate(demo.date)],
    ['Time',       fmtTime(demo.time)],
    ['Duration',   demo.duration || '—'],
    ['Executive',  demo.executive || '—'],
    ['Status',     <StatusPill key="s" status={demo.status} />],
    ['Meeting',    demo.meetType === 'meet' ? 'Google Meet' : demo.meetType === 'office' ? 'Office Visit' : 'Phone Call'],
    ['Created On', demo.createdOn || '—'],
    ['Demo ID',    demo.id],
  ];

  return (
    <div className="dm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dm-modal-box dm-modal-box-wide">
        <div className="dm-modal-header">
          <span className="dm-modal-title">Demo Information</span>
          <button className="dm-modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="dm-view-body">
          {/* Hero */}
          <div className="dm-view-hero">
            <div className="dm-view-avatar" style={{ background: avatarColor(demo.clientName) }}>
              {initials(demo.clientName)}
            </div>
            <div className="dm-view-hero-info">
              <div className="dm-view-client-name">{demo.clientName}</div>
              <div className="dm-view-demo-id">{demo.id} · {demo.topic}</div>
            </div>
            <StatusPill status={demo.status} />
          </div>

          {/* Info Grid */}
          <div className="dm-view-grid">
            {infoRows.map(([k, v]) => (
              <div className="dm-view-row" key={k}>
                <div className="dm-view-key">{k}</div>
                <div className="dm-view-val">{v}</div>
              </div>
            ))}
          </div>

          {/* Join Bar */}
          {demo.meetType === 'meet' && demo.meetLink && (
            <div className="dm-view-join-bar">
              <a href={demo.meetLink} target="_blank" rel="noreferrer" className="dm-btn-primary" style={{ textDecoration: 'none' }}>
                <FiVideo size={14}/> Join Meeting
              </a>
              <button className="dm-btn-outline" onClick={copyLink}>
                {linkCopied ? <FiCheck size={13}/> : <FiCopy size={13}/>}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          {/* Notes */}
          {demo.notes && (
            <div className="dm-view-notes">
              <div className="dm-view-notes-title">Notes</div>
              <div className="dm-view-notes-text">{demo.notes}</div>
            </div>
          )}

          {/* Timeline */}
          {demo.timeline?.length > 0 && (
            <div className="dm-timeline">
              <div className="dm-timeline-title">Activity Timeline</div>
              <div className="dm-timeline-list">
                {demo.timeline.map((t, i) => (
                  <div className="dm-timeline-item" key={i}>
                    <div className="dm-timeline-left">
                      <div className="dm-timeline-dot" style={{ background: t.bg, color: t.color, fontSize: 14 }}>
                        {t.icon}
                      </div>
                      <div className="dm-timeline-line" />
                    </div>
                    <div className="dm-timeline-content">
                      <div className="dm-timeline-action">{t.action}</div>
                      <div className="dm-timeline-time">{t.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="dm-form-actions" style={{ padding: '14px 24px 24px', borderTop: '1px solid var(--border)' }}>
            <button className="dm-btn-outline" onClick={onClose}>Close</button>
            <button className="dm-btn-primary" onClick={() => { onClose(); onEdit(demo); }}>
              <FiEdit2 size={13}/> Edit Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Demo Page ───────────────────────────────────────────────────────────
const Demo = () => {
  const [demos, setDemos]         = useState(INITIAL_DEMOS);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterExec, setFilterExec]     = useState('All');
  const [filterDate, setFilterDate]     = useState('');
  const [page, setPage]           = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showSchedule, setShowSchedule] = useState(false);
  const [editDemo, setEditDemo]         = useState(null);
  const [viewDemo, setViewDemo]         = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total:    demos.length,
      todayDemos: demos.filter(d => d.date === today).length,
      upcoming: demos.filter(d => isUpcoming(d.date) && d.status === 'Scheduled').length,
      completed:demos.filter(d => d.status === 'Completed').length,
      cancelled:demos.filter(d => d.status === 'Cancelled').length,
    };
  }, [demos]);

  const TABS = [
    { id: 'All',       label: 'All',       count: demos.length },
    { id: 'Today',     label: "Today's",   count: demos.filter(d => isToday(d.date)).length },
    { id: 'Upcoming',  label: 'Upcoming',  count: demos.filter(d => isUpcoming(d.date) && d.status === 'Scheduled').length },
    { id: 'Completed', label: 'Completed', count: demos.filter(d => d.status === 'Completed').length },
    { id: 'Cancelled', label: 'Cancelled', count: demos.filter(d => d.status === 'Cancelled').length },
  ];

  // ── Filtered & Paginated ──
  const filtered = useMemo(() => {
    let d = [...demos];
    if (activeTab === 'Today')     d = d.filter(x => isToday(x.date));
    if (activeTab === 'Upcoming')  d = d.filter(x => isUpcoming(x.date) && x.status === 'Scheduled');
    if (activeTab === 'Completed') d = d.filter(x => x.status === 'Completed');
    if (activeTab === 'Cancelled') d = d.filter(x => x.status === 'Cancelled');
    if (filterStatus !== 'All')   d = d.filter(x => x.status === filterStatus);
    if (filterExec   !== 'All')   d = d.filter(x => x.executive === filterExec);
    if (filterDate)               d = d.filter(x => x.date === filterDate);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.clientName.toLowerCase().includes(q) ||
        x.id.toLowerCase().includes(q) ||
        x.leadId.toLowerCase().includes(q) ||
        x.topic.toLowerCase().includes(q)
      );
    }
    return d;
  }, [demos, activeTab, filterStatus, filterExec, filterDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pageNums = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    return nums;
  };

  // ── CRUD ──
  const handleAddSave = (d) => {
    setDemos(prev => [d, ...prev]);
    setShowSchedule(false);
    showToast(`Demo ${d.id} scheduled successfully!`);
  };

  const handleEditSave = (d) => {
    setDemos(prev => prev.map(x => x.id === d.id ? d : x));
    setEditDemo(null);
    showToast('Demo updated successfully!');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this demo permanently?')) return;
    setDemos(prev => prev.filter(x => x.id !== id));
    showToast('Demo deleted.', 'error');
  };

  const handleCancel = (id) => {
    setDemos(prev => prev.map(x =>
      x.id === id ? {
        ...x,
        status: 'Cancelled',
        timeline: [...(x.timeline || []), {
          action: 'Demo Cancelled',
          time: new Date().toLocaleString('en-IN'),
          icon: '❌', bg: '#fee2e2', color: '#dc2626',
        }],
      } : x
    ));
    showToast('Demo cancelled.', 'warn');
  };

  const handleCopyLink = (demo) => {
    if (!demo.meetLink) { showToast('No meet link for this demo.', 'error'); return; }
    navigator.clipboard.writeText(demo.meetLink).catch(() => {});
    showToast('Meet link copied!', 'info');
  };

  const handleCall = (demo) => {
    window.open(`tel:${demo.phone}`, '_self');
  };

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="dm-page">

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="dm-page-header">
        <div>
          <div className="dm-page-title">Demo Management</div>
          
        </div>
        <div className="dm-header-actions">
          <button className="dm-btn-outline">
            <FiCalendar size={14}/> Export
          </button>
          <button className="dm-btn-primary" onClick={() => setShowSchedule(true)}>
            <FiPlus size={15}/> Schedule Demo
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="dm-stats-row">
        <div className="dm-stat-card" style={{ borderTop: '3px solid #7b1113' }}>
          <div className="dm-stat-icon" style={{ background: '#fce8e8', color: '#7b1113' }}><FiMonitor /></div>
          <div className="dm-stat-info">
            <div className="dm-stat-val">{stats.total}</div>
            <div className="dm-stat-label">Total Demos</div>
          </div>
        </div>
        <div className="dm-stat-card" style={{ borderTop: '3px solid #2563eb' }}>
          <div className="dm-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><FiCalendar /></div>
          <div className="dm-stat-info">
            <div className="dm-stat-val">{stats.todayDemos}</div>
            <div className="dm-stat-label">Today's Demos</div>
          </div>
        </div>
        <div className="dm-stat-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="dm-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><FiClock /></div>
          <div className="dm-stat-info">
            <div className="dm-stat-val">{stats.upcoming}</div>
            <div className="dm-stat-label">Upcoming</div>
          </div>
        </div>
        <div className="dm-stat-card" style={{ borderTop: '3px solid #4338ca' }}>
          <div className="dm-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FiCheck /></div>
          <div className="dm-stat-info">
            <div className="dm-stat-val">{stats.completed}</div>
            <div className="dm-stat-label">Completed</div>
          </div>
        </div>
        <div className="dm-stat-card" style={{ borderTop: '3px solid #dc2626' }}>
          <div className="dm-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><FiX /></div>
          <div className="dm-stat-info">
            <div className="dm-stat-val">{stats.cancelled}</div>
            <div className="dm-stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="dm-table-card">

        {/* Tabs */}
        <div className="dm-tabs-row">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`dm-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
              <span className="dm-tab-badge">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="dm-filter-bar">
          <div className="dm-search-wrap">
            <FiSearch className="dm-search-ico" />
            <input
              className="dm-search-input"
              placeholder="Search demo, client, lead ID…"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <select
            className="dm-filter-select"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="All">All Status</option>
            {DEMO_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            className="dm-filter-select"
            value={filterExec}
            onChange={e => { setFilterExec(e.target.value); setPage(1); }}
          >
            {EXECUTIVES.map(e => (
              <option key={e} value={e}>{e === 'All' ? 'All Executives' : e}</option>
            ))}
          </select>
          <input
            type="date"
            className="dm-filter-select"
            value={filterDate}
            onChange={e => { setFilterDate(e.target.value); setPage(1); }}
            style={{ minWidth: 140 }}
          />
          {(filterStatus !== 'All' || filterExec !== 'All' || filterDate || search) && (
            <button className="dm-btn-ghost" onClick={() => {
              setFilterStatus('All'); setFilterExec('All');
              setFilterDate(''); setSearch(''); setPage(1);
            }}>
              <FiX size={13}/> Clear
            </button>
          )}
        </div>

        {/* Schedule button row (table header) */}
        <div className="dm-schedule-row">
          <span className="dm-schedule-label">
            Demo List
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 12.5, marginLeft: 8 }}>
              ({filtered.length} record{filtered.length !== 1 ? 's' : ''})
            </span>
          </span>
          <button className="dm-btn-primary" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => setShowSchedule(true)}>
            <FiPlus size={13}/> Schedule Demo
          </button>
        </div>

        {/* Table */}
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead>
              <tr>
                <th>Demo ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Time</th>
                <th>Executive</th>
                <th>Meeting</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr className="dm-empty-row">
                  <td colSpan={8}>
                    {search ? `No demos found matching "${search}"` : 'No demos found. Try adjusting your filters.'}
                  </td>
                </tr>
              ) : paginated.map(demo => (
                <tr key={demo.id}>
                  <td><span className="dm-id">{demo.id}</span></td>
                  <td>
                    <div className="dm-client-cell">
                      <div className="dm-client-avatar" style={{ background: avatarColor(demo.clientName) }}>
                        {initials(demo.clientName)}
                      </div>
                      <div>
                        <div className="dm-client-name">{demo.clientName}</div>
                        <div className="dm-client-lead">{demo.leadId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="dm-date-cell">{fmtDate(demo.date)}</div>
                    <div className="dm-time-cell" style={{ fontSize: 11, color: 'var(--text-light)' }}>{demo.duration}</div>
                  </td>
                  <td>
                    <div className="dm-date-cell">{fmtTime(demo.time)}</div>
                  </td>
                  <td>
                    <div className="dm-exec-cell">{demo.executive}</div>
                  </td>
                  <td>
                    <MeetBtn demo={demo} />
                  </td>
                  <td>
                    <StatusPill status={demo.status} />
                  </td>
                  <td>
                    <div className="dm-action-group">
                      <button className="dm-act-btn view" title="View" onClick={() => setViewDemo(demo)}>
                        <FiEye />
                      </button>
                      <button className="dm-act-btn edit" title="Edit" onClick={() => setEditDemo(demo)}>
                        <FiEdit2 />
                      </button>
                      {demo.meetLink && (
                        <button className="dm-act-btn copy" title="Copy Link" onClick={() => handleCopyLink(demo)}>
                          <FiCopy />
                        </button>
                      )}
                      <button className="dm-act-btn call" title="Call Client" onClick={() => handleCall(demo)}>
                        <FiPhone />
                      </button>
                      {demo.meetLink && demo.meetType === 'meet' && demo.status !== 'Cancelled' && (
                        <button className="dm-act-btn join" title="Join Meet"
                          onClick={() => window.open(demo.meetLink, '_blank')}>
                          <FiVideo />
                        </button>
                      )}
                      {demo.status !== 'Cancelled' && demo.status !== 'Completed' && (
                        <button className="dm-act-btn cancel" title="Cancel Demo"
                          onClick={() => handleCancel(demo.id)}>
                          <FiX />
                        </button>
                      )}
                      <button className="dm-act-btn del" title="Delete" onClick={() => handleDelete(demo.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="dm-pagination-bar">
          <div className="dm-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="dm-page-nums">
            <button className="dm-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <FiChevronLeft size={13}/>
            </button>
            {pageNums().map((p, i) =>
              p === '...'
                ? <span key={i} style={{ padding: '0 4px', color: 'var(--text-light)' }}>…</span>
                : <button key={p} className={`dm-pg-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )}
            <button className="dm-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <FiChevronRight size={13}/>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSchedule && (
        <DemoFormModal
          allDemos={demos}
          onSave={handleAddSave}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {editDemo && (
        <DemoFormModal
          initial={editDemo}
          allDemos={demos}
          onSave={handleEditSave}
          onClose={() => setEditDemo(null)}
        />
      )}

      {viewDemo && (
        <DemoViewModal
          demo={viewDemo}
          onClose={() => setViewDemo(null)}
          onEdit={(d) => setEditDemo(d)}
        />
      )}
    </div>
  );
};

export default Demo;