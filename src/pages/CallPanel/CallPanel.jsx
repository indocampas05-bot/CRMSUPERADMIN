import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CallPanel.css';
import {
  Search,
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Send,
  FileText,
  FileSignature,
  Calendar,
  Bell,
  Copy,
  RefreshCw,
  MoreVertical,
  Settings2,
  Clock,
  User,
  Users,
  Mail,
  MapPin,
  Smartphone,
  Loader,
  RotateCcw,
  CheckCircle2,
  Info,
  AlertCircle,
  Volume2,
  ClipboardList,
  History,
  ArrowRightLeft,
  Bluetooth,
  BluetoothConnected,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone as SmartphoneIcon,
} from "lucide-react";

const AUTO_NEXT_IDLE_SECONDS = 300; // 5 minutes idle → auto-connect next

const INITIAL_QUEUE = [
  { id:'LD-5268', name:'Ravi Kumar',        initials:'RK', mobile:'+91 98765 43210', campaign:'Health Insurance',  status:'New Lead',       time:'10:30 AM', email:'ravi.kumar@email.com',    source:'Website', location:'Chennai, Tamil Nadu',   assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
  { id:'LD-5267', name:'Sangeetha R',       initials:'SR', mobile:'+91 91234 56789', campaign:'Health Insurance',  status:'In Progress',    time:'10:25 AM', email:'sangeetha.r@email.com',   source:'Website', location:'Bengaluru, Karnataka',  assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
  { id:'LD-5266', name:'Vikram Singh',      initials:'VS', mobile:'+91 99887 66554', campaign:'Investment Plan',   status:'Interested',     time:'10:20 AM', email:'vikram.s@email.com',      source:'Referral',location:'Mumbai, Maharashtra',   assigned:'Priya Sharma', isFollowUp:false, prevNotes:'' },
  { id:'LD-5265', name:'Karthik B',         initials:'KB', mobile:'+91 90000 11111', campaign:'Health Insurance',  status:'Not Interested', time:'10:15 AM', email:'karthik.b@email.com',     source:'Website', location:'Hyderabad, Telangana',  assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
  { id:'LD-5264', name:'Lakshmi Narayanan', initials:'LN', mobile:'+91 93456 78901', campaign:'Mutual Fund',       status:'Call Back',      time:'10:10 AM', email:'lakshmi.n@email.com',     source:'Excel',   location:'Puducherry, Tamil Nadu', assigned:'Priya Sharma', isFollowUp:true,  prevNotes:'Called last week. Interested in Mutual Fund SIP plan. Asked to call back after 10th. Wants ₹5000/month plan details.' },
  { id:'LD-5263', name:'Manoj A',           initials:'MA', mobile:'+91 97865 43211', campaign:'Health Insurance',  status:'In Progress',    time:'10:05 AM', email:'manoj.a@email.com',       source:'Website', location:'Coimbatore, Tamil Nadu', assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
  { id:'LD-5262', name:'Deepak Y',          initials:'DY', mobile:'+91 91235 67890', campaign:'Investment Plan',   status:'New Lead',       time:'10:00 AM', email:'deepak.y@email.com',      source:'Referral',location:'Delhi, NCR',             assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
  { id:'LD-5261', name:'Aravind M',         initials:'AM', mobile:'+91 90001 22222', campaign:'Health Insurance',  status:'Interested',     time:'09:55 AM', email:'aravind.m@email.com',     source:'Website', location:'Madurai, Tamil Nadu',   assigned:'Priya Sharma', isFollowUp:true,  prevNotes:'Very interested in Family Floater policy. Wife has pre-existing BP condition. Needs policy with minimum waiting period. Budget ₹15,000/year.' },
  { id:'LD-5260', name:'Jyothi P',          initials:'JP', mobile:'+91 93457 89012', campaign:'Mutual Fund',       status:'Not Interested', time:'09:50 AM', email:'jyothi.p@email.com',      source:'Excel',   location:'Pune, Maharashtra',      assigned:'Arun Kumar',   isFollowUp:false, prevNotes:'' },
];

const RECENT_CALLS_SEED = [
  { id:'LD-5258', name:'Preethi S',  initials:'PS', mobile:'+91 98001 11223', campaign:'Term Insurance',  status:'Interested',  time:'09:40 AM', duration:'04:12', notes:'Interested in ₹1 Cr term plan. 35 years old. Non-smoker.' },
  { id:'LD-5257', name:'Suresh M',   initials:'SM', mobile:'+91 99123 44556', campaign:'Investment Plan', status:'Call Back',   time:'09:30 AM', duration:'02:55', notes:'Will check with family and call back.' },
  { id:'LD-5256', name:'Nivetha R',  initials:'NR', mobile:'+91 91111 22334', campaign:'Mutual Fund',     status:'In Progress', time:'09:20 AM', duration:'06:38', notes:'Wants SIP details emailed. Preferred risk: moderate.' },
];

const STATUS_COLORS = {
  'New Lead':       { bg:'#e0f2fe', color:'#0369a1' },
  'In Progress':    { bg:'#fef9c3', color:'#92400e' },
  'Interested':     { bg:'#dcfce7', color:'#15803d' },
  'Not Interested': { bg:'#fee2e2', color:'#b91c1c' },
  'Call Back':      { bg:'#fef3c7', color:'#b45309' },
  'Converted':      { bg:'#d1fae5', color:'#065f46' },
};
const AGENT_STATUSES = {
  'Available': { 
    label: 'Available', 
    bg: '#dcfce7',
  },
  'Busy': { 
    label: 'Busy', 
    bg: '#fef9c3',
  },
  'Away': { 
    label: 'Away', 
    bg: '#ffedd5',
  },
  'Break': { 
    label: 'Break', 
    bg: '#ede9fe',
  },
  'Lunch': { 
    label: 'Lunch', 
    bg: '#fce7f3',
  },
  'Offline': { 
    label: 'Offline', 
    bg: '#fee2e2',
  },
};

const AVATAR_COLORS = ['#7b1113','#2563eb','#7c3aed','#d97706','#16a34a','#0891b2','#db2777','#ea580c'];
const avatarColor = n => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const fmtTime = s => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return h>0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};
const Toast = ({ msg, type, onClose }) => (
  <div className={`cp-toast cp-toast-${type}`} onClick={onClose}>{msg}</div>
);

const Avatar = ({ initials, name, size=44 }) => (
  <div className="cp-avatar" style={{ width:size, height:size, background:avatarColor(name), fontSize:size*0.36 }}>
    {initials}
  </div>
);

const IdleCountdown = ({ seconds, total, onCancel }) => {
  const pct = ((total - seconds) / total) * 100;
  return (
    <div className="idle-countdown">
      <div className="idle-top">
        <span className="idle-label">⏳ Auto-connecting next call in</span>
        <button className="idle-cancel" onClick={onCancel}>Cancel</button>
      </div>
      <div className="idle-secs">{seconds}s</div>
      <div className="idle-bar-bg"><div className="idle-bar-fill" style={{ width:`${pct}%` }}></div></div>
    </div>
  );
};

const FollowUpBanner = ({ notes }) => (
  <div className="followup-banner">
    <div className="fu-banner-header">📋 Previous Call Notes — Follow-Up Lead</div>
    <p className="fu-banner-text">{notes}</p>
  </div>
);

const AgentStatusSelector = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStatus = AGENT_STATUSES[status] || AGENT_STATUSES['Available'];

  return (
    <div className="agent-status-selector" ref={dropdownRef}>
      <button 
        className="agent-status-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: currentStatus.bg
        }}
      >
        <span className="status-label">{currentStatus.label}</span>
        <span className="status-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="agent-status-dropdown">
          {Object.entries(AGENT_STATUSES).map(([key, value]) => (
            <button
              key={key}
              className={`status-option ${status === key ? 'active' : ''}`}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              style={{ 
                background: status === key ? value.bg : 'transparent',
                borderLeft: status === key ? '3px solid #7b1113' : '3px solid transparent'
              }}
            >
              <span className="status-option-label">{value.label}</span>
              {status === key && (
                <span className="status-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DialpadModal = ({ onClose, onDial }) => {
  const [num, setNum] = useState('');
  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-dialpad-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Dialpad</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="dp-display">{num||<span style={{color:'#aaa'}}>Enter number</span>}</div>
        <div className="dp-grid">
          {keys.map(k=><button key={k} className="dp-key" onClick={()=>setNum(n=>n+k)}>{k}</button>)}
        </div>
        <div className="dp-actions">
          <button className="dp-backspace" onClick={()=>setNum(n=>n.slice(0,-1))}>⌫</button>
          <button className="dp-call-btn" onClick={()=>{if(num){onDial(num);onClose();}}}>📞 Call</button>
        </div>
      </div>
    </div>
  );
};

const ScheduleModal = ({ onClose, onSave, leadName }) => {
  const [date,setDate]=useState('');
  const [time,setTime]=useState('');
  const [note,setNote]=useState('');
  const [type,setType]=useState('Call Back');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-schedule-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📅 Schedule Follow Up</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-lead-name">Lead: <strong>{leadName}</strong></div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              {['Call Back','Follow-Up Call','Demo','Meeting','Send Quotation','Other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div className="form-group"><label>Time</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Note</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Describe the follow-up…" /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{if(!date||!time){alert('Please pick date and time.');return;}onSave({type,date,time,note});onClose();}}>Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReminderModal = ({ onClose, onSave }) => {
  const [mins,setMins]=useState('15');
  const [msg,setMsg]=useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-schedule-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🔔 Add Reminder</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Remind me in</label>
            <select value={mins} onChange={e=>setMins(e.target.value)}>
              {['5','10','15','30','60','120'].map(m=><option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <div className="form-group"><label>Message</label><textarea rows={2} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Reminder message…" /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{onSave({mins,msg});onClose();}}>Set Reminder</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SendDocModal = ({ type, lead, onClose, onSent }) => {
  const [to,setTo]=useState(lead?.email||'');
  const [subject,setSubject]=useState(
    type==='Quotation'?`Quotation for ${lead?.campaign}`:
    type==='Agreement'?`Agreement - ${lead?.campaign}`:`Following up - ${lead?.campaign}`
  );
  const [body,setBody]=useState(
    type==='Quotation'?`Dear ${lead?.name},\n\nPlease find attached the quotation for ${lead?.campaign}.\n\nBest regards,\nArun Kumar`:
    type==='Agreement'?`Dear ${lead?.name},\n\nKindly review and sign the attached agreement at your earliest convenience.\n\nBest regards,\nArun Kumar`:
    `Dear ${lead?.name},\n\nThank you for your time. I'm following up on our discussion regarding ${lead?.campaign}.\n\nBest regards,\nArun Kumar`
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-send-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {type==='Quotation'?'📄 Send Quotation':type==='Agreement'?'📝 Send Agreement':'✉ Send Email'}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label>To</label><input value={to} onChange={e=>setTo(e.target.value)} /></div>
          <div className="form-group"><label>Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} /></div>
          <div className="form-group"><label>Message</label><textarea rows={6} value={body} onChange={e=>setBody(e.target.value)} /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{onSent({type,to,subject,body});onClose();}}>
              {type==='Quotation'?'Send Quotation':type==='Agreement'?'Send Agreement':'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Bluetooth Connection Status Component ────────────────────────────────────
const BluetoothStatus = ({ 
  isConnected, 
  deviceName, 
  isMobile, 
  onConnect, 
  onDisconnect,
  isConnecting 
}) => {
  return (
    <div className={`bluetooth-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="bt-header">
        <span className="bt-icon">
          {isConnected ? <BluetoothConnected size={20} /> : <Bluetooth size={20} />}
        </span>
        <span className="bt-title">Bluetooth</span>
        <span className={`bt-dot ${isConnected ? 'bt-connected' : 'bt-disconnected'}`}></span>
      </div>
      
      <div className="bt-device-info">
        {isConnected ? (
          <>
            <span className="bt-device-name">{deviceName || 'Connected Device'}</span>
            <span className="bt-status-label">Connected</span>
          </>
        ) : (
          <span className="bt-device-name">No device connected</span>
        )}
      </div>
      
      <div className="bt-actions">
        {!isConnected && (
          <button 
            className="bt-connect-btn" 
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader size={16} className="spinning" />
                Connecting...
              </>
            ) : (
              <>
                <Bluetooth size={16} />
                Connect Device
              </>
            )}
          </button>
        )}
        {isConnected && (
          <button className="bt-disconnect-btn" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
        
      </div>
    </div>
  );
};


const CallInitiationModal = ({ lead, onClose, onCall, isMobile }) => {
  const [selectedMethod, setSelectedMethod] = useState('bluetooth');
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-call-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📞 Initiate Call</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="call-lead-info">
            <Avatar initials={lead.initials} name={lead.name} size={48} />
            <div>
              <div className="call-lead-name">{lead.name}</div>
              <div className="call-lead-number">{lead.mobile}</div>
            </div>
          </div>
          
          <div className="call-methods">
            <label className={`call-method ${selectedMethod === 'bluetooth' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="callMethod" 
                value="bluetooth" 
                checked={selectedMethod === 'bluetooth'}
                onChange={() => setSelectedMethod('bluetooth')}
              />
              <BluetoothConnected size={20} />
              <span>Bluetooth Call</span>
              <small>Call via connected mobile</small>
            </label>
            
            {isMobile && (
              <label className={`call-method ${selectedMethod === 'direct' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="callMethod" 
                  value="direct" 
                  checked={selectedMethod === 'direct'}
                  onChange={() => setSelectedMethod('direct')}
                />
                <PhoneCall size={20} />
                <span>Direct Call</span>
                <small>Call from this device</small>
              </label>
            )}
          </div>
          
          <div className="call-actions">
            
            <button 
              className="btn-primary call-initiate-btn"
              onClick={async () => {
                setIsLoading(true);
                await onCall(lead.mobile, selectedMethod);
                setIsLoading(false);
                onClose();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="spinning" />
                  Connecting...
                </>
              ) : (
                <>
                  <PhoneCall size={18} />
                  Call Now
                </>
              )}
            </button>
<button 
              className="btn-outline" 
              onClick={onClose}
            >
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
const OutcomeModal = ({ lead, onClose, onSave }) => {
  const [outcome, setOutcome] = useState('Interested');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const products = ['Health Insurance', 'Investment Plan', 'Mutual Fund', 'Term Insurance', 'Other'];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-outcome-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📊 Update Call Outcome</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="outcome-lead">
            <span>{lead.name}</span>
            <span className="outcome-number">{lead.mobile}</span>
          </div>
          
          <div className="form-group">
            <label>Call Outcome</label>
            <select value={outcome} onChange={e=>setOutcome(e.target.value)}>
              {['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Converted', 'In Progress'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          
          {(outcome === 'Interested' || outcome === 'Converted') && (
            <div className="form-group">
              <label>Interested In</label>
              <div className="product-tags">
                {products.map(p => (
                  <button
                    key={p}
                    className={`product-tag ${selectedProducts.includes(p) ? 'selected' : ''}`}
                    onClick={() => setSelectedProducts(prev => 
                      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {outcome === 'Call Back' && (
            <div className="form-group">
              <label>Next Follow-up Date</label>
              <input 
                type="datetime-local" 
                value={followUpDate} 
                onChange={e=>setFollowUpDate(e.target.value)}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Remarks</label>
            <textarea 
              rows={4} 
              value={remarks} 
              onChange={e=>setRemarks(e.target.value)}
              placeholder="Notes about the call..."
            />
          </div>
          
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => {
              onSave({ outcome, remarks, followUpDate, selectedProducts });
              onClose();
            }}>
              Save Outcome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CallPanel = ({ onNavigate, isMobile = false, backendUrl = 'https://crmbackend-5d2o.onrender.com' }) => {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [activeLead, setActiveLead] = useState(INITIAL_QUEUE[0]);
  const [callState, setCallState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState('Call Queue');
  const [detailTab, setDetailTab] = useState('Customer Details');
  const [outcome, setOutcome] = useState('Interested');
  const [interestedIn, setInterestedIn] = useState(['Health Insurance']);
  const [sentiment, setSentiment] = useState('Positive');
  const [remarks, setRemarks] = useState('Customer is interested in Family Floater Health Insurance. Asked for Premium details.');
  const [notes, setNotes] = useState('');
  const [autoNext, setAutoNext] = useState(true);
  const [agentStatus, setAgentStatus] = useState('Available');
  const [queueSearch, setQueueSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showDialpad, setShowDialpad] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showCallInit, setShowCallInit] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [sendDoc, setSendDoc] = useState(null);
  const [callHistory, setCallHistory] = useState(RECENT_CALLS_SEED);
  const [followUps, setFollowUps] = useState([]);
  const [leadStatus, setLeadStatus] = useState(INITIAL_QUEUE[0].status);
  const [assignedTo, setAssignedTo] = useState(INITIAL_QUEUE[0].assigned);
  const [idleCountdown, setIdleCountdown] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [todaySummary, setTodaySummary] = useState({ total:120, answered:65, notAnswered:35, interested:20, notInterested:10, callBack:15, talkSecs:20720 });

  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callMethod, setCallMethod] = useState('bluetooth');

  const timerRef = useRef(null);
  const idleRef = useRef(null);
  const reminderRefs = useRef([]);
  const wsRef = useRef(null);

  // ── WebSocket Connection ────────
  useEffect(() => {
    if (isMobile) {
      // On mobile, connect to backend WebSocket
      const ws = new WebSocket(`${backendUrl.replace('http', 'ws')}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        showToast('Connected to call server', 'success');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onerror = () => {
        showToast('WebSocket connection error', 'error');
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [isMobile, backendUrl]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'call_started':
        setCallState('connected');
        setCallInProgress(true);
        showToast(`Call started with ${activeLead?.name}`, 'success');
        break;
      case 'call_ended':
        setCallState('idle');
        setCallInProgress(false);
        setShowOutcome(true);
        showToast('Call ended', 'info');
        break;
      case 'call_error':
        showToast(`Call error: ${data.message}`, 'error');
        setCallState('idle');
        setCallInProgress(false);
        break;
      case 'bluetooth_status':
        setBluetoothConnected(data.connected);
        if (data.deviceName) {
          setBluetoothDevice(data.deviceName);
        }
        break;
      default:
        break;
    }
  };

  // ── Live Call Timer ────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // ── Update Talk Time Summary ───────
  useEffect(() => {
    if (callState === 'connected') {
      const id = setInterval(() => setTodaySummary(s => ({ ...s, talkSecs: s.talkSecs + 1 })), 1000);
      return () => clearInterval(id);
    }
  }, [callState]);

  // ── Idle Auto-Next Countdown-------
  useEffect(() => {
    if (idleCountdown === null) { clearInterval(idleRef.current); return; }
    if (idleCountdown <= 0) {
      clearInterval(idleRef.current);
      setIdleCountdown(null);
      connectNextLead();
      return;
    }
    idleRef.current = setInterval(() => setIdleCountdown(c => c - 1), 1000);
    return () => clearInterval(idleRef.current);
  }, [idleCountdown]);
  useEffect(() => {
    reminders.forEach((r, i) => {
      if (!reminderRefs.current[i]) {
        reminderRefs.current[i] = setTimeout(() => {
          showToast(`🔔 Reminder: ${r.msg || 'Time to follow up!'}`, 'info');
        }, r.mins * 60 * 1000);
      }
    });
  }, [reminders]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
      showToast(`Navigating to ${page}...`, 'info');
    } else {
      console.warn('Navigation prop not provided to CallPanel');
      showToast(`Would navigate to ${page}`, 'info');
    }
  };

  // ── Bluetooth Operations ────────────────────────────────────────────────────
  const connectBluetooth = async () => {
    if (isMobile) {
      // On mobile, request Bluetooth via WebSocket
      setIsConnecting(true);
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'connect_bluetooth'
          }));
     
          const response = await new Promise((resolve) => {
            const handler = (event) => {
              const data = JSON.parse(event.data);
              if (data.type === 'bluetooth_status') {
                wsRef.current.removeEventListener('message', handler);
                resolve(data);
              }
            };
            wsRef.current.addEventListener('message', handler);
          });
          
          if (response.connected) {
            setBluetoothConnected(true);
            setBluetoothDevice(response.deviceName || 'Connected Device');
            showToast('Bluetooth connected successfully!', 'success');
          } else {
            showToast('Failed to connect Bluetooth device', 'error');
          }
        } else {
          showToast('Not connected to call server', 'error');
        }
      } catch (error) {
        showToast(`Bluetooth connection error: ${error.message}`, 'error');
      } finally {
        setIsConnecting(false);
      }
    } else {

      try {
        setIsConnecting(true);
      
        if (!navigator.bluetooth) {
          throw new Error('Web Bluetooth not supported in this browser');
        }
        
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access']
        });
        
        setBluetoothConnected(true);
        setBluetoothDevice(device.name || 'Connected Device');
        showToast(`Connected to ${device.name || 'Bluetooth device'}`, 'success');
      } catch (error) {
        if (error.message.includes('user cancelled')) {
          showToast('Bluetooth pairing cancelled', 'info');
        } else {
          showToast(`Bluetooth error: ${error.message}`, 'error');
        }
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const disconnectBluetooth = async () => {
    if (isMobile && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'disconnect_bluetooth'
      }));
    }
    setBluetoothConnected(false);
    setBluetoothDevice(null);
    showToast('Bluetooth disconnected', 'info');
  };

  const makeCall = async (number, method = 'bluetooth') => {
    setCallMethod(method);
    
    if (method === 'bluetooth' && !bluetoothConnected) {
      showToast('Please connect a Bluetooth device first', 'error');
      return;
    }

    setCallState('ringing');
    setCallInProgress(true);
    setElapsed(0);
    
    try {
      if (isMobile && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'initiate_call',
          number: number,
          method: method
        }));
      } else if (method === 'direct' && navigator.userAgent.match(/Mobi|Android|iPhone/i)) {
        window.location.href = `tel:${number}`;
        setTimeout(() => {
          setCallState('connected');
          showToast('Call connected', 'success');
        }, 2000);
      } else if (method === 'bluetooth') {
        // Desktop - use backend API to trigger call
        const response = await fetch(`${backendUrl}/api/call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            number, 
            method: 'bluetooth',
            leadId: activeLead?.id 
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to initiate call');
        }
        
        const data = await response.json();
        if (data.success) {
          setCallState('connected');
          showToast('Call connected via Bluetooth', 'success');
        } else {
          throw new Error(data.message || 'Call failed');
        }
      } else {
        window.location.href = `tel:${number}`;
        setTimeout(() => {
          setCallState('connected');
          showToast('Call connected', 'success');
        }, 2000);
      }

      setTodaySummary(s => ({ ...s, total: s.total + 1 }));
      
    } catch (error) {
      showToast(`Call failed: ${error.message}`, 'error');
      setCallState('idle');
      setCallInProgress(false);
    }
  };

  // ── Find Next Lead ──────────────────────────────────────────────────────────
  const connectNextLead = useCallback(() => {
    const idx = queue.findIndex(l => l.id === activeLead?.id);
    const next = queue[idx + 1];
    if (next) {
      startCall(next);
    } else {
      showToast('All leads in queue completed!', 'info');
      setCallState('idle');
    }
  }, [queue, activeLead]);

  // ── Start a New Call ────────────────────────────────────────────────────────
  const startCall = (lead) => {
    clearInterval(idleRef.current);
    setIdleCountdown(null);
    setActiveLead(lead);
    setLeadStatus(lead.status);
    setAssignedTo(lead.assigned);
    setNotes('');
    setOutcome('Interested');
    setRemarks('');
    setSentiment('Positive');
    setInterestedIn([]);
    setDetailTab(lead.isFollowUp ? 'Customer Details' : 'Customer Details');
    setShowCallInit(true);
  };

  const handleSelectLead = (lead) => {
    if (callState === 'connected' || callState === 'muted' || callState === 'onhold') {
      if (!window.confirm(`End current call with ${activeLead?.name} and call ${lead.name}?`)) return;
      finaliseCall();
    }
    startCall(lead);
  };

  // ── Finalise Call ───────────────────────────────────────────────────────────
  const finaliseCall = () => {
    clearInterval(timerRef.current);
    const rec = {
      ...activeLead,
      duration: fmtTime(elapsed),
      endTime: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      outcome,
      notes: notes || '',
    };
    setCallHistory(h => [rec, ...h]);
    setTodaySummary(s => {
      const update = { answered: s.answered + 1 };
      if      (outcome === 'Interested')     update.interested    = s.interested + 1;
      else if (outcome === 'Not Interested') update.notInterested = s.notInterested + 1;
      else if (outcome === 'Call Back')      update.callBack      = s.callBack + 1;
      return { ...s, ...update };
    });
    setQueue(q => q.map(l => l.id === activeLead.id ? { ...l, status: outcome, prevNotes: notes || l.prevNotes } : l));
    setCallState('idle');
    setCallInProgress(false);
    
    // Show outcome modal
    setShowOutcome(true);
  };

  const handleEndCall = () => {
    // If using WebSocket, send end call message
    if (isMobile && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'end_call'
      }));
    }
    finaliseCall();
    showToast('Call ended.', 'info');
    if (autoNext) {
      setIdleCountdown(AUTO_NEXT_IDLE_SECONDS);
      showToast(`Auto-connecting next call in ${AUTO_NEXT_IDLE_SECONDS / 60} min if idle…`, 'info');
    }
  };

  const cancelAutoNext = () => {
    clearInterval(idleRef.current);
    setIdleCountdown(null);
    showToast('Auto-next cancelled.', 'info');
  };

  // ── Call Controls ───────────────────────────────────────────────────────────
  const handleMute = () => { 
    setCallState(s => s === 'muted' ? 'connected' : 'muted');  
    showToast(callState === 'muted' ? 'Unmuted' : 'Muted', 'info'); 
  };
  
  const handleHold = () => { 
    setCallState(s => s === 'onhold' ? 'connected' : 'onhold'); 
    showToast(callState === 'onhold' ? 'Call Resumed' : 'Call on Hold', 'info'); 
  };

  // ── Save Disposition ─────────────────────────────────────────────────────────
  const handleSaveDisposition = () => {
    setQueue(q => q.map(l => l.id === activeLead.id ? { ...l, status: outcome } : l));
    setLeadStatus(outcome);
    showToast('✅ Disposition saved!');
  };

  // ── Save Notes ──────────────────────────────────────────────────────────────
  const handleSaveNotes = () => {
    if (!notes.trim()) { showToast('Please enter a note.', 'error'); return; }
    showToast('📝 Notes saved!');
  };

  // ── Handle Document Sent ────────────────────────────────────────────────────
  const handleDocSent = ({ type, to }) => {
    const pageMap = {
      'Quotation': 'quotations',
      'Agreement': 'agreements',
      'Email': 'email'
    };
    const page = pageMap[type];
    showToast(`✅ ${type} sent to ${to}!`);
    
    if (page && onNavigate) {
      setTimeout(() => {
        handleNavigate(page);
      }, 1000);
    }
  };

  // ── Handle Schedule ─────────────────────────────────────────────────────────
  const handleScheduleSave = (data) => {
    const fu = { ...data, lead: activeLead.name, leadId: activeLead.id };
    setFollowUps(f => [fu, ...f]);
    setQueue(q => q.map(l => l.id === activeLead.id ? { ...l, isFollowUp: true, prevNotes: notes || l.prevNotes } : l));
    showToast(`📅 Follow-up scheduled for ${data.date} at ${data.time}`);
    
    setTimeout(() => {
      handleNavigate('followups');
    }, 1500);
  };

  // ── Handle Reminder ─────────────────────────────────────────────────────────
  const handleReminderSave = (data) => {
    setReminders(r => [...r, data]);
    showToast(`🔔 Reminder set for ${data.mins} minutes!`);
  };

  // ── Handle Copy Mobile ──────────────────────────────────────────────────────
  const handleCopyMobile = () => {
    navigator.clipboard?.writeText(activeLead.mobile).catch(()=>{});
    showToast('📋 Mobile number copied!');
  };

  // ── Handle Load More ──────────────────────────────────────────────────────
  const handleLoadMore = () => showToast('All leads loaded.', 'info');
  const toggleInterested = (item) => setInterestedIn(p => p.includes(item) ? p.filter(i=>i!==item) : [...p,item]);

  // ── Computed Values ──────────────────────────────────────────────────────────
  const filteredQueue = queue.filter(l =>
    l.name.toLowerCase().includes(queueSearch.toLowerCase()) || l.mobile.includes(queueSearch)
  );

  const callStateLabel = { 
    connected:'Call Connected', 
    ringing:'Ringing…', 
    onhold:'On Hold', 
    muted:'Muted', 
    ended:'Call Ended', 
    idle:'Idle' 
  };
  
  const callStateColor = { 
    connected:'#16a34a', 
    ringing:'#d97706', 
    onhold:'#2563eb', 
    muted:'#6b7280', 
    ended:'#dc2626', 
    idle:'#6b7280' 
  };
  
  const canControl = callState === 'connected' || callState === 'muted' || callState === 'onhold';

  const currentStatusBg = AGENT_STATUSES[agentStatus]?.bg || '#dcfce7';
  return (
    <div className="cp-page">
      {/* ── Toasts ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {/* ── Modals ── */}
      {showDialpad && <DialpadModal onClose={()=>setShowDialpad(false)} onDial={num=>{makeCall(num, callMethod);}} />}
      {showSchedule && <ScheduleModal onClose={()=>setShowSchedule(false)} onSave={handleScheduleSave} leadName={activeLead?.name} />}
      {showReminder && <ReminderModal onClose={()=>setShowReminder(false)} onSave={handleReminderSave} />}
      {sendDoc && <SendDocModal type={sendDoc} lead={activeLead} onClose={()=>setSendDoc(null)} onSent={handleDocSent} />}
      {showCallInit && (
        <CallInitiationModal 
          lead={activeLead} 
          onClose={() => {
            setShowCallInit(false);
            if (callState === 'ringing') {
              setCallState('idle');
            }
          }}
          onCall={async (number, method) => {
            await makeCall(number, method);
            setShowCallInit(false);
          }}
          isMobile={isMobile}
        />
      )}
      {showOutcome && (
        <OutcomeModal 
          lead={activeLead} 
          onClose={() => setShowOutcome(false)}
          onSave={(data) => {
            setOutcome(data.outcome);
            setRemarks(data.remarks);
            if (data.selectedProducts && data.selectedProducts.length > 0) {
              setInterestedIn(data.selectedProducts);
            }
            handleSaveDisposition();
          }}
        />
      )}

      {/* ── Page Header ── */}
      <div className="cp-page-header">
        <div>
          <h1 className="cp-page-title">Call Panel</h1>
        </div>
        <div className="cp-header-right">
          <div className="cp-agent-status">
            <AgentStatusSelector 
              status={agentStatus} 
              onChange={setAgentStatus} 
            />
          </div>
        </div>
      </div>

      {/* ── Bluetooth Status Bar ── */}
      <BluetoothStatus
        isConnected={bluetoothConnected}
        deviceName={bluetoothDevice}
        isMobile={isMobile}
        onConnect={connectBluetooth}
        onDisconnect={disconnectBluetooth}
        isConnecting={isConnecting}
      />

      {/* ── 3-column layout ── */}
      <div className="cp-grid">

        {/* ═══ LEFT: Queue ════════════════════════════════════════════════════ */}
        <div className="cp-left">
          <div className="cp-tabs-row">
            {['Call Queue','Recent Calls'].map(t=>(
              <button key={t} className={`cp-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>
                {t}{t==='Call Queue'?` (${queue.length})`:''}
              </button>
            ))}
          </div>

          <div className="cp-queue-search">
            <span>🔍</span>
            <input placeholder="Search number or name…" value={queueSearch} onChange={e=>setQueueSearch(e.target.value)} />
            <button className="icon-btn" title="Filter" onClick={()=>showToast('Filter coming soon.','info')}>⚙</button>
          </div>

          <div className="cp-queue-list">
            {activeTab === 'Call Queue' ? (
              filteredQueue.length === 0
                ? <div className="cp-empty">No leads match your search.</div>
                : filteredQueue.map(lead => (
                  <div key={lead.id} className={`queue-item ${activeLead?.id===lead.id?'active':''}`} onClick={()=>handleSelectLead(lead)}>
                    <div className="qi-avatar-wrap">
                      <Avatar initials={lead.initials} name={lead.name} size={40} />
                      {lead.isFollowUp && <span className="fu-badge" title="Follow-Up Lead"><RotateCcw size={14} /></span>}
                    </div>
                    <div className="qi-info">
                      <div className="qi-name">{lead.name}</div>
                      <div className="qi-mobile">{lead.mobile}</div>
                      <div className="qi-campaign">{lead.campaign}</div>
                      <span className="qi-status" style={STATUS_COLORS[lead.status]}>{lead.status}</span>
                    </div>
                    <div className="qi-right">
                      <span className="qi-time">{lead.time}</span>
                      <button 
                        className="qi-call-btn" 
                        onClick={e=>{e.stopPropagation();handleSelectLead(lead);}}
                        disabled={callInProgress && activeLead?.id !== lead.id}
                      >
                        <PhoneCall size={18} />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              callHistory.map((c,i) => (
                <div key={i} className="queue-item">
                  <Avatar initials={c.initials||c.name.split(' ').map(w=>w[0]).join('')} name={c.name} size={40} />
                  <div className="qi-info">
                    <div className="qi-name">{c.name}</div>
                    <div className="qi-mobile">{c.mobile}</div>
                    <div className="qi-campaign">{c.campaign}</div>
                    <span className="qi-status" style={STATUS_COLORS[c.status]}>{c.status}</span>
                  </div>
                  <div className="qi-right">
                    <span className="qi-time">{c.endTime||c.time}</span>
                    <span className="qi-duration">{c.duration}</span>
                    <button className="qi-call-btn" onClick={()=>handleSelectLead({...c,isFollowUp:true,prevNotes:c.notes||''})}>📞</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="load-more-btn" onClick={handleLoadMore}>Load More Leads ↻</button>

          <div className="target-box">
            <div className="target-title">Today's Target</div>
            <div className="target-row"><span>Calls</span><span className="target-val">{todaySummary.answered} / {todaySummary.total}</span></div>
            <div className="target-bar-bg"><div className="target-bar-fill" style={{width:`${Math.min(100,Math.round(todaySummary.answered/todaySummary.total*100))}%`}}></div></div>
            <div className="target-pct">{Math.min(100,Math.round(todaySummary.answered/todaySummary.total*100))}%</div>
          </div>
        </div>

        {/* ═══ CENTRE: Active Call ════════════════════════════════════════════ */}
        <div className="cp-centre">
          <div className="active-call-card">

            {/* Header */}
            <div className="ac-header">
              <div className="ac-status-row">
                <span className={`ac-live-dot ${callState==='connected'?'dot-pulse-green':callState==='ringing'?'dot-pulse-amber':'dot-grey'}`}></span>
                <span className="ac-live-label" style={{color: callStateColor[callState]}}>
                  {callStateLabel[callState]}
                </span>
                {callInProgress && (
                  <span className="ac-call-method">
                    {callMethod === 'bluetooth' ? <BluetoothConnected size={14} /> : <PhoneCall size={14} />}
                    {callMethod === 'bluetooth' ? 'Bluetooth' : 'Direct'}
                  </span>
                )}
              </div>
              <div className="ac-header-right">
                <span className="auto-next-label">Auto Next Call</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <button className="icon-btn" onClick={()=>showToast('Options coming soon.','info')}>⋮</button>
              </div>
            </div>

            {/* Auto-next idle countdown */}
            {idleCountdown !== null && (
              <IdleCountdown seconds={idleCountdown} total={AUTO_NEXT_IDLE_SECONDS} onCancel={cancelAutoNext} />
            )}

            {/* Follow-up previous notes banner */}
            {activeLead?.isFollowUp && activeLead?.prevNotes && (
              <FollowUpBanner notes={activeLead.prevNotes} />
            )}

            {/* Contact */}
            <div className="ac-contact">
              <div className="ac-avatar-wrap">
                <Avatar initials={activeLead.initials} name={activeLead.name} size={68} />
                {activeLead?.isFollowUp && <span className="ac-fu-tag">Follow-Up</span>}
              </div>
              <div className="ac-contact-info">
                <div className="ac-name">{activeLead.name}</div>
                <div className="ac-mobile">{activeLead.mobile}</div>
                <div className="ac-campaign">{activeLead.campaign}</div>
              </div>
            </div>

            {/* Calling via */}
            <div className="ac-via-row">
              <span className="via-label">Calling via</span>
              <span className="via-icon">{bluetoothConnected ? '🔵' : '⚪'}</span>
              <span className="via-device">
                {bluetoothConnected ? (bluetoothDevice || 'Bluetooth Device') : 'No Device'}
              </span>
              <span className={`via-status ${callState==='connected'?'via-connected':callState==='onhold'?'via-hold':'via-ringing'}`}>
                {callState==='connected'?'Connected':callState==='onhold'?'On Hold':callState==='muted'?'Muted':callState==='ringing'?'Ringing…':'Ended'}
              </span>
            </div>

            {/* Timer */}
            <div className="ac-timer">{fmtTime(elapsed)}</div>
            <div className="ac-state-label" style={{color:callStateColor[callState]}}>
              {callStateLabel[callState]}
            </div>

            {/* Controls */}
            <div className="ac-controls">
              <button className={`ctrl-btn ${callState==='muted'?'ctrl-active':''}`} onClick={handleMute} disabled={!canControl}>
                <span className="ctrl-icon">{callState === "muted" ? <MicOff size={22}/> : <Mic size={22}/>}</span>
                <span className="ctrl-label">{callState==='muted'?'Unmute':'Mute'}</span>
              </button>
              <button className={`ctrl-btn ${callState==='onhold'?'ctrl-active':''}`} onClick={handleHold} disabled={!canControl}>
                <span className="ctrl-icon">{callState==="onhold" ? <Play size={22}/> : <Pause size={22}/>}</span>
                <span className="ctrl-label">{callState==='onhold'?'Resume':'Hold'}</span>
              </button>
              <button className="ctrl-btn ctrl-end" onClick={handleEndCall} disabled={!canControl}>
                <span className="ctrl-icon"><PhoneOff size={22}/></span>
                <span className="ctrl-label">End Call</span>
              </button>
              <button className="ctrl-btn" onClick={()=>setShowDialpad(true)} disabled={!bluetoothConnected && !isMobile}>
                <span className="ctrl-icon"><Phone size={22}/></span>
                <span className="ctrl-label">Dialpad</span>
              </button>
              <button className="ctrl-btn" onClick={()=>showToast('Transfer feature coming soon.','info')} disabled={!canControl}>
                <span className="ctrl-icon"><ArrowRightLeft size={22}/></span>
                <span className="ctrl-label">Transfer</span>
              </button>
            </div>

            {/* Detail tabs */}
            <div className="detail-tabs">
              {['Customer Details','Call Notes','History','Follow Ups'].map(t=>(
                <button key={t} className={`detail-tab ${detailTab===t?'active':''}`} onClick={()=>setDetailTab(t)}>
                  {t}{t==='Follow Ups'&&followUps.length>0?` (${followUps.length})`:''}
                </button>
              ))}
            </div>

            <div className="detail-content">
              {/* ── Customer Details ── */}
              {detailTab==='Customer Details' && (
                <div className="customer-grid">
                  <div className="cg-col">
                    {[['Lead ID',activeLead.id],['Mobile',activeLead.mobile,true],['Email',activeLead.email],['Campaign',activeLead.campaign],['Source',activeLead.source],['Location',activeLead.location]].map(([k,v,copy])=>(
                      <div key={k} className="cg-row">
                        <span className="cg-key">{k}</span>
                        <span className="cg-val">{v}{copy&&<button className="copy-btn" onClick={handleCopyMobile}>⧉</button>}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cg-col">
                    <div className="cg-row">
                      <span className="cg-key">Lead Status</span>
                      <select className="inline-select" value={leadStatus} onChange={e=>setLeadStatus(e.target.value)}>
                        {Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="cg-row">
                      <span className="cg-key">Assigned To</span>
                      <select className="inline-select" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
                        {['Arun Kumar','Priya Sharma','Raj Mohan'].map(a=><option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="cg-row"><span className="cg-key">Last Contact</span><span className="cg-val">--</span></div>
                    <div className="cg-row"><span className="cg-key">Last Status</span><span className="cg-val">--</span></div>
                    {activeLead?.isFollowUp && (
                      <div className="cg-row fu-row">
                        <span className="cg-key">Type</span>
                        <span className="fu-tag-inline">🔁 Follow-Up</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Call Notes ── */}
              {detailTab==='Call Notes' && (
                <div className="notes-tab">
                  {activeLead?.isFollowUp && activeLead?.prevNotes && (
                    <div className="prev-notes-block">
                      <div className="pn-label">📋 Previous Notes</div>
                      <p className="pn-text">{activeLead.prevNotes}</p>
                    </div>
                  )}
                  <div className="notes-hint">Current call notes:</div>
                  {callHistory.filter(c=>c.id===activeLead?.id).map((c,i)=>(
                    <div key={i} className="note-item">
                      <span className="note-date">{c.endTime}</span>
                      <span className="note-text">{c.notes||'No notes added.'}</span>
                    </div>
                  ))}
                  {callHistory.filter(c=>c.id===activeLead?.id).length===0 && (
                    <div className="cp-empty" style={{paddingTop:8}}>No previous call notes for this lead.</div>
                  )}
                </div>
              )}

              {/* ── History ── */}
              {detailTab==='History' && (
                <div className="history-tab">
                  {callHistory.length===0
                    ? <div className="cp-empty">No call history yet.</div>
                    : callHistory.map((c,i)=>(
                      <div key={i} className="history-item">
                        <span className="hi-name">{c.name}</span>
                        <span className="hi-time">{c.endTime||c.time}</span>
                        <span className="hi-duration">{c.duration}</span>
                        <span className="hi-outcome">{c.outcome||c.status}</span>
                        <span className="hi-status" style={STATUS_COLORS[c.status]}>{c.status}</span>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* ── Follow Ups ── */}
              {detailTab==='Follow Ups' && (
                <div className="followups-tab">
                  <button className="btn-primary" style={{marginBottom:12}} onClick={() => {
                    setShowSchedule(true);
                    setTimeout(() => handleNavigate('followups'), 100);
                  }}>
                    + Schedule Follow Up
                  </button>
                  {followUps.length===0
                    ? <div className="cp-empty">No follow-ups scheduled.</div>
                    : followUps.map((f,i)=>(
                      <div key={i} className="fu-item">
                        <div className="fu-item-top">
                          <span className="fu-lead">{f.lead}</span>
                          <span className="fu-type-badge">{f.type}</span>
                        </div>
                        <div className="fu-date">📅 {f.date} at {f.time}</div>
                        {f.note&&<div className="fu-note">📝 {f.note}</div>}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Quick Notes */}
            <div className="quick-notes-section">
              <div className="qn-header">Quick Notes</div>
              <textarea className="qn-textarea" placeholder="Write notes about this call…" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} rows={3} />
              <div className="qn-footer">
                <span className="qn-count">{notes.length}/500</span>
                <button className="btn-primary" onClick={handleSaveNotes}>Save Notes</button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Disposition + Quick Actions ════════════════════════════ */}
        <div className="cp-right">
          {/* Disposition */}
          <div className="disp-card">
            <div className="disp-title">Disposition</div>
            <div className="disp-section">
              <label className="disp-label">Call Outcome</label>
              <select className="disp-select" value={outcome} onChange={e=>setOutcome(e.target.value)}>
                {['Interested','Not Interested','Call Back','No Answer','Converted','In Progress'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="disp-section">
              <label className="disp-label">Interested In</label>
              {['Health Insurance','Investment Plan','Mutual Fund','Other'].map(item=>(
                <label key={item} className="disp-check">
                  <input type="checkbox" checked={interestedIn.includes(item)} onChange={()=>toggleInterested(item)} />{item}
                </label>
              ))}
            </div>
            <div className="disp-section">
              <label className="disp-label">Customer Sentiment</label>
              <div className="sentiment-row">
                {[['😊','Positive'],['😐','Neutral'],['😡','Negative']].map(([icon,s])=>(
                  <button key={s} className={`sent-btn ${sentiment===s?'sent-active':''}`} onClick={()=>setSentiment(s)}>
                    <span>{icon}</span><span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="disp-section">
              <label className="disp-label">Remarks</label>
              <textarea className="disp-textarea" value={remarks} onChange={e=>setRemarks(e.target.value)} rows={4} maxLength={500} />
              <div className="disp-count">{remarks.length}/500</div>
            </div>
            <button className="save-disp-btn" onClick={handleSaveDisposition}>Save Disposition</button>
          </div>

          {/* Quick Actions */}
          <div className="qa-card">
            <div className="qa-title">Quick Actions</div>
            <div className="qa-grid">
              <button className="qa-action-btn" onClick={() => {
                setSendDoc('Quotation');
                setTimeout(() => handleNavigate('quotations'), 500);
              }}>
                <span>📄</span><span>Send Quotation</span>
              </button>
              <button className="qa-action-btn" onClick={() => {
                setSendDoc('Agreement');
                setTimeout(() => handleNavigate('agreements'), 500);
              }}>
                <span>📝</span><span>Send Agreement</span>
              </button>
              <button className="qa-action-btn" onClick={() => {
                setSendDoc('Email');
                setTimeout(() => handleNavigate('email'), 500);
              }}>
                <span>✉</span><span>Send Email</span>
              </button>
              <button className="qa-action-btn" onClick={() => {
                setShowSchedule(true);
                setTimeout(() => handleNavigate('followups'), 500);
              }}>
                <span>📅</span><span>Schedule Follow Up</span>
              </button>
            </div>
            <button className="qa-full-btn" onClick={() => setShowReminder(true)}>🔔 Add Reminder</button>

            {/* Navigate links */}
            <div className="qa-nav-links">
              <div className="qa-nav-label">Go to page</div>
              <div className="qa-nav-row">
                {[
                  { icon:'📄', label:'Quotations', page:'quotations' },
                  { icon:'📝', label:'Agreements', page:'agreements' },
                  { icon:'📊', label:'Reports',    page:'reports'    },
                  { icon:'🔁', label:'Follow Ups', page:'followups'  },
                ].map(n=>(
                  <button key={n.page} className="qa-nav-btn" onClick={() => handleNavigate(n.page)}>
                    {n.icon} {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPanel;