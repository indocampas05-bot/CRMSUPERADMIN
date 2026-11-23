// src/pages/Telecallers/telecallersData.js

export const DISTRICTS = [
  'Chennai', 'Chengalpattu', 'Kanchipuram', 'Coimbatore', 'Madurai', 
  'Trichy', 'Salem', 'Cuddalore', 'Pondicherry', 'Villupuram', 'Thindivanam'
];

export const CATEGORIES = [
  'Schools', 'Colleges', 'Hospitals', 'Real Estate', 'Loans',
  'Insurance', 'Tours & Travels', 'Finance', 'Retail', 'Healthcare',
];

export const ROLES = ['Telecaller', 'Senior Telecaller', 'Team Lead'];

export const QUOTATION_ACCESS = ['No', 'View', 'Create & Edit'];
export const PAYMENT_ACCESS = ['No', 'View Only', 'Yes'];
export const REPORTS_ACCESS = ['No', 'Own Only', 'All'];

export const DEFAULT_PERMISSIONS = {
  dashboard: { read: true, create: false, edit: false, delete: false },
  leads: { read: true, create: false, edit: false, delete: false },
  callpanel: { read: true, create: false, edit: false, delete: false },
  clients: { read: true, create: false, edit: false, delete: false },
  followups: { read: true, create: false, edit: false, delete: false },
  demo: { read: true, create: false, edit: false, delete: false },
  quotations: { read: true, create: false, edit: false, delete: false },
  agreements: { read: true, create: false, edit: false, delete: false },
  payment: { read: true, create: false, edit: false, delete: false },
  reports: { read: true, create: false, edit: false, delete: false },
  calendar: { read: true, create: false, edit: false, delete: false },
  settings: { read: true, create: false, edit: false, delete: false },
  help: { read: true, create: false, edit: false, delete: false },
  leave_permissions: { read: true, create: false, edit: false, delete: false },
  communications: { read: true, create: false, edit: false, delete: false },
};

export const DEFAULT_WORK_TIMINGS = {
  shiftName: 'Morning Shift',
  shiftStart: '09:00',
  shiftEnd: '18:00',
  graceTime: 15,
  workingHours: 8,
  enableLunch: true,
  lunchStart: '13:00',
  lunchEnd: '13:45',
  enableTeaBreak: true,
  morningTeaStart: '10:30',
  morningTeaEnd: '10:45',
  eveningTeaStart: '16:30',
  eveningTeaEnd: '16:45',
  lockDuringBreak: true,
  showBreakTimer: true,
  autoResume: true,
};

export const emptyTelecaller = {
  id: '', 
  name: '', 
  mobile: '', 
  email: '', 
  username: '', 
  password: '', 
  role: 'Telecaller',
  districts: [], 
  categories: [], 
  joiningDate: '', 
  status: 'Active', 
  target: 100,
  permissions: { ...DEFAULT_PERMISSIONS },
  performance: { 
    callsToday: 0, 
    followups: 0, 
    conversions: 0, 
    revenue: 0, 
    attendance: 100,
    schoolsCreated: 0,
    connectedCalls: 0,
    invalidNumbers: 0,
    callsNotConnected: 0,
    alreadyUsingSoftware: 0,
    profileShared: 0,
    schoolClosed: 0,
    noRequirement: 0,
    followupsCompleted: 0,
    interestedLeads: 0,
    demoScheduled: 0,
    demoConducted: 0,
    totalLeads: 0,
  },
};

export const nextEmpId = (list) => {
  const max = list.reduce((m, t) => Math.max(m, parseInt(t.id.replace('EMP-', ''), 10) || 0), 100);
  return `EMP-${max + 1}`;
};