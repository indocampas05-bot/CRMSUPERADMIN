// src/pages/Clients/Clients.jsx
import React, { useState } from 'react';
import './Clients.css';
import {
  FiUsers,
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiKey,
  FiLock,
  FiUnlock,
  FiMapPin,
  FiBarChart2,
  FiTarget,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiX,
  FiPhone,
  FiMail,
  FiUser,
  FiAward,
  FiCalendar,
  FiBriefcase,
  FiDollarSign,
  FiHome,
  FiCopy,
  FiRefreshCw,
  FiInfo,
  FiClock,
  FiTag,
  FiBox,
  FiGrid,
  FiShield,
  FiCheck,
  FiSquare,
  FiFileText
} from 'react-icons/fi';

const PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'telecallers', label: 'Telecallers', icon: FiUsers },
  { id: 'leads', label: 'Leads', icon: FiTarget },
  { id: 'quotations', label: 'Quotations', icon: FiFileText },
  { id: 'agreement', label: 'Agreement', icon: FiFileText },
  { id: 'payments', label: 'Payments', icon: FiDollarSign },
  { id: 'followups', label: 'Follow-ups', icon: FiClock },
  { id: 'categories', label: 'Categories', icon: FiTag },
  { id: 'communication', label: 'Communication', icon: FiMail },
  { id: 'reports', label: 'Reports', icon: FiBarChart2 },
  { id: 'calendar', label: 'Calendar', icon: FiCalendar },
  { id: 'clients', label: 'Clients', icon: FiUsers },
  { id: 'settings', label: 'Settings', icon: FiShield }
];

const PERMISSION_ACTIONS = ['read', 'create', 'edit', 'delete'];

const INITIAL_CLIENTS = [
  {
    id: 'CL-001',
    companyName: 'TechCorp Solutions',
    contactPerson: 'John Smith',
    email: 'john@techcorp.com',
    phone: '+91 98765 43210',
    address: '123 Tech Street, Silicon Valley, CA 94025',
    subscriptionPlan: 'Enterprise',
    subscriptionStartDate: '2025-01-01',
    subscriptionExpiryDate: '2026-01-01',
    logo: null,
    status: 'Active',
    username: 'techcorp_admin',
    password: 'TechCorp2025!',
    createdDate: '2025-01-01',
    lastLogin: '2025-06-15',
    employees: 150,
    industry: 'Technology',
    revenue: '₹25,00,000',
    city: 'Silicon Valley',
    subscriptionId: 'SUB-001',
    permissions: {
      dashboard: { read: true, create: true, edit: true, delete: true },
      telecallers: { read: true, create: true, edit: true, delete: true },
      leads: { read: true, create: true, edit: true, delete: true },
      quotations: { read: true, create: true, edit: true, delete: true },
      agreement: { read: true, create: true, edit: true, delete: true },
      payments: { read: true, create: true, edit: true, delete: true },
      followups: { read: true, create: true, edit: true, delete: true },
      categories: { read: true, create: true, edit: true, delete: true },
      communication: { read: true, create: true, edit: true, delete: true },
      reports: { read: true, create: true, edit: true, delete: true },
      calendar: { read: true, create: true, edit: true, delete: true },
      clients: { read: true, create: true, edit: true, delete: true },
      settings: { read: true, create: true, edit: true, delete: true }
    }
  },
  {
    id: 'CL-002',
    companyName: 'HealthPlus Medical',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@healthplus.com',
    phone: '+91 91234 56789',
    address: '456 Health Blvd, Medical District, NY 10001',
    subscriptionPlan: 'Professional',
    subscriptionStartDate: '2024-03-15',
    subscriptionExpiryDate: '2025-12-15',
    logo: null,
    status: 'Active',
    username: 'healthplus_admin',
    password: 'HealthPlus2024!',
    createdDate: '2024-03-15',
    lastLogin: '2025-06-14',
    employees: 85,
    industry: 'Healthcare',
    revenue: '₹18,00,000',
    city: 'Medical District',
    subscriptionId: 'SUB-002',
    permissions: {
      dashboard: { read: true, create: false, edit: false, delete: false },
      telecallers: { read: true, create: true, edit: true, delete: false },
      leads: { read: true, create: true, edit: true, delete: false },
      quotations: { read: true, create: true, edit: true, delete: false },
      agreement: { read: true, create: true, edit: true, delete: false },
      payments: { read: true, create: false, edit: false, delete: false },
      followups: { read: true, create: true, edit: true, delete: false },
      categories: { read: true, create: true, edit: true, delete: false },
      communication: { read: true, create: true, edit: true, delete: false },
      reports: { read: true, create: false, edit: false, delete: false },
      calendar: { read: true, create: true, edit: true, delete: false },
      clients: { read: true, create: true, edit: true, delete: false },
      settings: { read: false, create: false, edit: false, delete: false }
    }
  },
  {
    id: 'CL-003',
    companyName: 'EduLearn Academy',
    contactPerson: 'Michael Brown',
    email: 'michael@edulearn.com',
    phone: '+91 99887 66554',
    address: '789 Education Lane, Boston, MA 02110',
    subscriptionPlan: 'Basic',
    subscriptionStartDate: '2024-08-01',
    subscriptionExpiryDate: '2025-08-01',
    logo: null,
    status: 'Inactive',
    username: 'edulearn_admin',
    password: 'EduLearn2024!',
    createdDate: '2024-08-01',
    lastLogin: '2025-05-30',
    employees: 45,
    industry: 'Education',
    revenue: '₹7,50,000',
    city: 'Boston',
    subscriptionId: 'SUB-003',
    permissions: {
      dashboard: { read: true, create: false, edit: false, delete: false },
      telecallers: { read: true, create: false, edit: false, delete: false },
      leads: { read: true, create: false, edit: false, delete: false },
      quotations: { read: true, create: false, edit: false, delete: false },
      agreement: { read: true, create: false, edit: false, delete: false },
      payments: { read: true, create: false, edit: false, delete: false },
      followups: { read: true, create: false, edit: false, delete: false },
      categories: { read: true, create: false, edit: false, delete: false },
      communication: { read: true, create: false, edit: false, delete: false },
      reports: { read: true, create: false, edit: false, delete: false },
      calendar: { read: true, create: false, edit: false, delete: false },
      clients: { read: true, create: false, edit: false, delete: false },
      settings: { read: false, create: false, edit: false, delete: false }
    }
  },
  {
    id: 'CL-004',
    companyName: 'FinancePro Group',
    contactPerson: 'Emily Davis',
    email: 'emily@financepro.com',
    phone: '+91 87654 32109',
    address: '321 Finance Ave, Wall Street, NY 10005',
    subscriptionPlan: 'Enterprise',
    subscriptionStartDate: '2024-12-01',
    subscriptionExpiryDate: '2025-12-01',
    logo: null,
    status: 'Active',
    username: 'financepro_admin',
    password: 'FinancePro2024!',
    createdDate: '2024-12-01',
    lastLogin: '2025-06-16',
    employees: 200,
    industry: 'Finance',
    revenue: '₹45,00,000',
    city: 'Wall Street',
    subscriptionId: 'SUB-004',
    permissions: {
      dashboard: { read: true, create: true, edit: true, delete: true },
      telecallers: { read: true, create: true, edit: true, delete: true },
      leads: { read: true, create: true, edit: true, delete: true },
      quotations: { read: true, create: true, edit: true, delete: true },
      agreement: { read: true, create: true, edit: true, delete: true },
      payments: { read: true, create: true, edit: true, delete: true },
      followups: { read: true, create: true, edit: true, delete: true },
      categories: { read: true, create: true, edit: true, delete: true },
      communication: { read: true, create: true, edit: true, delete: true },
      reports: { read: true, create: true, edit: true, delete: true },
      calendar: { read: true, create: true, edit: true, delete: true },
      clients: { read: true, create: true, edit: true, delete: true },
      settings: { read: true, create: true, edit: true, delete: true }
    }
  },
  {
    id: 'CL-005',
    companyName: 'RetailMart Inc',
    contactPerson: 'David Wilson',
    email: 'david@retailmart.com',
    phone: '+91 76543 21098',
    address: '654 Market Street, Chicago, IL 60607',
    subscriptionPlan: 'Professional',
    subscriptionStartDate: '2024-10-01',
    subscriptionExpiryDate: '2025-10-01',
    logo: null,
    status: 'Active',
    username: 'retailmart_admin',
    password: 'RetailMart2024!',
    createdDate: '2024-10-01',
    lastLogin: '2025-06-13',
    employees: 120,
    industry: 'Retail',
    revenue: '₹22,00,000',
    city: 'Chicago',
    subscriptionId: 'SUB-005',
    permissions: {
      dashboard: { read: true, create: false, edit: false, delete: false },
      telecallers: { read: true, create: true, edit: true, delete: false },
      leads: { read: true, create: true, edit: true, delete: false },
      quotations: { read: true, create: true, edit: true, delete: false },
      agreement: { read: true, create: true, edit: true, delete: false },
      payments: { read: true, create: false, edit: false, delete: false },
      followups: { read: true, create: true, edit: true, delete: false },
      categories: { read: true, create: true, edit: true, delete: false },
      communication: { read: true, create: true, edit: true, delete: false },
      reports: { read: true, create: false, edit: false, delete: false },
      calendar: { read: true, create: true, edit: true, delete: false },
      clients: { read: true, create: true, edit: true, delete: false },
      settings: { read: false, create: false, edit: false, delete: false }
    }
  },
  {
    id: 'CL-006',
    companyName: 'GreenEnergy Solutions',
    contactPerson: 'Lisa Anderson',
    email: 'lisa@greenenergy.com',
    phone: '+91 65432 10987',
    address: '987 Green Street, Austin, TX 78701',
    subscriptionPlan: 'Basic',
    subscriptionStartDate: '2025-02-15',
    subscriptionExpiryDate: '2026-02-15',
    logo: null,
    status: 'Active',
    username: 'greenenergy_admin',
    password: 'GreenEnergy2025!',
    createdDate: '2025-02-15',
    lastLogin: '2025-06-12',
    employees: 30,
    industry: 'Energy',
    revenue: '₹9,50,000',
    city: 'Austin',
    subscriptionId: 'SUB-006',
    permissions: {
      dashboard: { read: true, create: false, edit: false, delete: false },
      telecallers: { read: true, create: false, edit: false, delete: false },
      leads: { read: true, create: false, edit: false, delete: false },
      quotations: { read: true, create: false, edit: false, delete: false },
      agreement: { read: true, create: false, edit: false, delete: false },
      payments: { read: true, create: false, edit: false, delete: false },
      followups: { read: true, create: false, edit: false, delete: false },
      categories: { read: true, create: false, edit: false, delete: false },
      communication: { read: true, create: false, edit: false, delete: false },
      reports: { read: true, create: false, edit: false, delete: false },
      calendar: { read: true, create: false, edit: false, delete: false },
      clients: { read: true, create: false, edit: false, delete: false },
      settings: { read: false, create: false, edit: false, delete: false }
    }
  }
];

const SUBSCRIPTION_PLANS = ['Basic', 'Professional', 'Enterprise'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Education', 'Finance', 'Retail', 'Energy', 'Manufacturing', 'Consulting'];

const Clients = () => {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingClient, setViewingClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [selectedPlan, setSelectedPlan] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form state for add/edit
  const [form, setForm] = useState({
    id: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'Basic',
    subscriptionStartDate: '',
    subscriptionExpiryDate: '',
    logo: null,
    status: 'Active',
    username: '',
    password: '',
    industry: '',
    employees: '',
    revenue: '',
    permissions: {}
  });

  const nextClientId = (list) => {
    const max = list.reduce((m, t) => Math.max(m, parseInt(t.id.replace('CL-', ''), 10) || 0), 0);
    return `CL-${String(max + 1).padStart(3, '0')}`;
  };

  const getDefaultPermissions = () => {
    const perms = {};
    PERMISSIONS.forEach(p => {
      perms[p.id] = {
        read: false,
        create: false,
        edit: false,
        delete: false
      };
    });
    return perms;
  };

  const resetForm = () => {
    setForm({
      id: nextClientId(clients),
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      subscriptionPlan: 'Basic',
      subscriptionStartDate: '',
      subscriptionExpiryDate: '',
      logo: null,
      status: 'Active',
      username: '',
      password: '',
      industry: '',
      employees: '',
      revenue: '',
      permissions: getDefaultPermissions()
    });
    setEditingClient(null);
  };

  const handleAddClick = () => {
    resetForm();
    const newId = nextClientId(clients);
    setForm((prev) => ({ ...prev, id: newId, permissions: getDefaultPermissions() }));
    setShowAddModal(true);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setForm({ 
      ...client,
      permissions: client.permissions || getDefaultPermissions()
    });
    setShowAddModal(true);
  };

  const handleViewClick = (client) => {
    setViewingClient(client);
    setShowViewModal(true);
  };

  const handleSave = () => {
    if (!form.companyName || !form.contactPerson || !form.email || !form.username) {
      alert('Company Name, Contact Person, Email and Username are required.');
      return;
    }

    setClients((list) => {
      const exists = list.some((t) => t.id === form.id);
      if (exists) {
        return list.map((t) => (t.id === form.id ? { ...form } : t));
      } else {
        return [...list, { ...form }];
      }
    });
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this client? This cannot be undone.')) {
      setClients((list) => list.filter((t) => t.id !== id));
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((v) => ({ ...v, [id]: !v[id] }));
  };

  const resetPassword = (id) => {
    const tempPass = Math.random().toString(36).slice(-8);
    setClients((list) => list.map((t) => (t.id === id ? { ...t, password: tempPass } : t)));
    alert(`Password reset. New temporary password: ${tempPass}`);
  };

  const toggleStatus = (id) => {
    setClients((list) =>
      list.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t
      )
    );
  };

  const copyCredentials = (client) => {
    const credentials = `Username: ${client.username}\nPassword: ${client.password}`;
    navigator.clipboard.writeText(credentials);
    alert('Credentials copied to clipboard!');
  };

  // Permission handlers
  const handlePermissionChange = (moduleId, action, value) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [action]: value
        }
      }
    }));
  };

  const handleSelectAllModule = (moduleId, value) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          read: value,
          create: value,
          edit: value,
          delete: value
        }
      }
    }));
  };

  const handleSelectAllActions = (action, value) => {
    setForm(prev => {
      const newPermissions = { ...prev.permissions };
      PERMISSIONS.forEach(p => {
        newPermissions[p.id] = {
          ...newPermissions[p.id],
          [action]: value
        };
      });
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSelectAllPermissions = (value) => {
    setForm(prev => {
      const newPermissions = {};
      PERMISSIONS.forEach(p => {
        newPermissions[p.id] = {
          read: value,
          create: value,
          edit: value,
          delete: value
        };
      });
      return { ...prev, permissions: newPermissions };
    });
  };

  // Check if all permissions for a specific action are selected
  const isAllActionSelected = (action) => {
    return PERMISSIONS.every(p => form.permissions[p.id]?.[action] === true);
  };

  // Filter clients
  const filteredClients = clients.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.companyName.toLowerCase().includes(q) ||
      t.contactPerson.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.phone.includes(search) ||
      t.id.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q);
    const matchesPlan = selectedPlan === 'All' || t.subscriptionPlan === selectedPlan;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter((t) => t.status === 'Active').length;
  const inactiveClients = clients.filter((t) => t.status === 'Inactive').length;
  const totalRevenue = clients.reduce((sum, t) => {
    const num = parseInt(t.revenue.replace(/[₹,]/g, '')) || 0;
    return sum + num;
  }, 0);

  const currency = (n) =>
    '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : (n || 0).toLocaleString('en-IN'));

  const getPlanColor = (plan) => {
    const colors = {
      'Basic': '#78909c',
      'Professional': '#1976d2',
      'Enterprise': '#9c27b0'
    };
    return colors[plan] || '#78909c';
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#16a34a' : '#dc2626';
  };

  const getPermissionSummary = (permissions) => {
    if (!permissions) return 'No permissions set';
    let total = 0;
    let granted = 0;
    PERMISSIONS.forEach(p => {
      if (permissions[p.id]) {
        PERMISSION_ACTIONS.forEach(action => {
          total++;
          if (permissions[p.id][action]) granted++;
        });
      }
    });
    return `${granted}/${total}`;
  };

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <h1 className="page-title">🏢 Clients Management</h1>
          <p className="page-subtitle">Manage client companies, subscriptions, and access</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary-btn" onClick={handleAddClick}>
            <FiUserPlus /> Add Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="tc-stats-grid">
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
            <FiUsers size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{totalClients}</div>
            <div className="tc-stat-label">Total Clients</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <FiCheckCircle size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{activeClients}</div>
            <div className="tc-stat-label">Active</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <FiXCircle size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{inactiveClients}</div>
            <div className="tc-stat-label">Inactive</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FiDollarSign size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{currency(totalRevenue)}</div>
            <div className="tc-stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <FiBriefcase size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{clients.filter(c => c.subscriptionPlan === 'Enterprise').length}</div>
            <div className="tc-stat-label">Enterprise Plans</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="tc-toolbar">
        <div className="search-box">
          <FiSearch />
          <input
            placeholder="Search by company, contact, email, phone or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
        >
          <option value="All">All Plans</option>
          {SUBSCRIPTION_PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Clients Grid */}
      <div className="tc-grid">
        {filteredClients.map((t) => (
          <div key={t.id} className="tc-card">
            <div className="tc-card-header">
              <div className="tc-card-id">{t.id}</div>
              <div className={`tc-card-status ${t.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                {t.status === 'Active' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                {t.status}
              </div>
            </div>

            <div className="tc-card-body">
              <div className="tc-card-name">{t.companyName}</div>
              <div className="tc-card-role-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                {t.subscriptionPlan}
              </div>
              <div style={{ fontSize: '12px', color: '#8888aa', marginTop: '2px' }}>
                {t.industry || 'N/A'} • {t.employees || 0} employees
              </div>

              <div className="tc-card-details">
                <div className="tc-card-detail">
                  <span className="tc-card-detail-label"><FiUser size={14} /> Contact</span>
                  <span>{t.contactPerson}</span>
                </div>
                <div className="tc-card-detail">
                  <span className="tc-card-detail-label"><FiMail size={14} /> Email</span>
                  <span>{t.email}</span>
                </div>
                <div className="tc-card-detail">
                  <span className="tc-card-detail-label"><FiPhone size={14} /> Phone</span>
                  <span>{t.phone}</span>
                </div>
                <div className="tc-card-detail">
                  <span className="tc-card-detail-label"><FiShield size={14} /> Permissions</span>
                  <span style={{ fontSize: '11px', color: '#7b1113', fontWeight: 600 }}>
                    {getPermissionSummary(t.permissions)}
                  </span>
                </div>
              </div>
            </div>

            <div className="tc-card-actions">
              <button className="tc-action-btn view-btn" onClick={() => handleViewClick(t)}>
                <FiEye /> View
              </button>
              <button className="tc-action-btn edit-btn" onClick={() => handleEditClick(t)}>
                <FiEdit2 /> Edit
              </button>
              <button className="tc-action-btn password-btn" onClick={() => resetPassword(t.id)}>
                <FiKey /> Reset Password
              </button>
              <button className="tc-action-btn copy-btn" onClick={() => copyCredentials(t)}>
                <FiCopy /> Copy
              </button>
              <button className="tc-action-btn status-btn" onClick={() => toggleStatus(t.id)}>
                {t.status === 'Active' ? <FiLock /> : <FiUnlock />}
                {t.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="tc-action-btn delete-btn" onClick={() => handleDelete(t.id)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="empty-state">
          <p>No clients found matching your filters.</p>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingClient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <div className="view-modal-title">
                <FiInfo size={20} />
                <span>Client Details</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="view-modal-body">
              {/* Header Section */}
              <div className="view-client-header">
                <div className="view-client-avatar" style={{ background: '#7b1113' }}>
                  {viewingClient.companyName.charAt(0)}
                </div>
                <div className="view-client-title">
                  <h2>{viewingClient.companyName}</h2>
                  <div className="view-client-meta">
                    <span className="view-meta-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                      {viewingClient.subscriptionPlan}
                    </span>
                    <span className="view-meta-badge" style={{ 
                      background: viewingClient.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: viewingClient.status === 'Active' ? '#16a34a' : '#dc2626'
                    }}>
                      {viewingClient.status}
                    </span>
                    <span className="view-meta-id">{viewingClient.id}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="view-info-grid">
                <div className="view-info-section">
                  <h3 className="view-section-title">
                    <FiUser size={16} /> Contact Information
                  </h3>
                  <div className="view-info-row">
                    <span className="view-info-label">Contact Person</span>
                    <span className="view-info-value">{viewingClient.contactPerson}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Email</span>
                    <span className="view-info-value">{viewingClient.email}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Phone</span>
                    <span className="view-info-value">{viewingClient.phone}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Address</span>
                    <span className="view-info-value">{viewingClient.address}</span>
                  </div>
                </div>

                <div className="view-info-section">
                  <h3 className="view-section-title">
                    <FiBriefcase size={16} /> Company Details
                  </h3>
                  <div className="view-info-row">
                    <span className="view-info-label">Industry</span>
                    <span className="view-info-value">{viewingClient.industry || 'N/A'}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Employees</span>
                    <span className="view-info-value">{viewingClient.employees || 0}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Revenue</span>
                    <span className="view-info-value" style={{ color: '#16a34a', fontWeight: 600 }}>
                      {viewingClient.revenue || '₹0'}
                    </span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Subscription ID</span>
                    <span className="view-info-value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {viewingClient.subscriptionId}
                    </span>
                  </div>
                </div>

                <div className="view-info-section">
                  <h3 className="view-section-title">
                    <FiCalendar size={16} /> Subscription Details
                  </h3>
                  <div className="view-info-row">
                    <span className="view-info-label">Plan</span>
                    <span className="view-info-value">
                      <span className="plan-badge" style={{ 
                        background: getPlanColor(viewingClient.subscriptionPlan),
                        color: '#fff',
                        padding: '2px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {viewingClient.subscriptionPlan}
                      </span>
                    </span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Start Date</span>
                    <span className="view-info-value">{viewingClient.subscriptionStartDate}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Expiry Date</span>
                    <span className="view-info-value">{viewingClient.subscriptionExpiryDate}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Created</span>
                    <span className="view-info-value">{viewingClient.createdDate}</span>
                  </div>
                </div>

                <div className="view-info-section">
                  <h3 className="view-section-title">
                    <FiKey size={16} /> Login Credentials
                  </h3>
                  <div className="view-info-row">
                    <span className="view-info-label">Username</span>
                    <span className="view-info-value" style={{ fontFamily: 'monospace' }}>
                      {viewingClient.username}
                    </span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-info-label">Password</span>
                    <span className="view-info-value" style={{ fontFamily: 'monospace' }}>
                      {visiblePasswords[viewingClient.id] ? viewingClient.password : '••••••••'}
                      <button 
                        className="view-password-toggle"
                        onClick={() => togglePasswordVisibility(viewingClient.id)}
                      >
                        {visiblePasswords[viewingClient.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </span>
                  </div>
                  <div className="view-info-row" style={{ marginTop: '8px' }}>
                    <button 
                      className="view-copy-btn"
                      onClick={() => copyCredentials(viewingClient)}
                    >
                      <FiCopy size={14} /> Copy Credentials
                    </button>
                    <button 
                      className="view-reset-btn"
                      onClick={() => {
                        resetPassword(viewingClient.id);
                        setShowViewModal(false);
                      }}
                    >
                      <FiRefreshCw size={14} /> Reset Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions Summary in View */}
              <div className="view-info-section" style={{ marginTop: '20px' }}>
                <h3 className="view-section-title">
                  <FiShield size={16} /> Module Permissions
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px'
                }}>
                  {PERMISSIONS.map(p => {
                    const perms = viewingClient.permissions?.[p.id] || { read: false, create: false, edit: false, delete: false };
                    const total = Object.values(perms).filter(v => v).length;
                    return (
                      <div key={p.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <p.icon size={14} style={{ color: total > 0 ? '#7b1113' : '#9ca3af' }} />
                        <span style={{ fontSize: '12px', flex: 1 }}>{p.label}</span>
                        <span style={{ 
                          fontSize: '11px',
                          fontWeight: 600,
                          color: total > 0 ? '#16a34a' : '#9ca3af'
                        }}>
                          {total}/4
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="view-modal-footer">
              <button className="view-close-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="view-edit-btn" onClick={() => {
                setShowViewModal(false);
                handleEditClick(viewingClient);
              }}>
                <FiEdit2 size={14} /> Edit Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Same size as View Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <div className="view-modal-title">
                {editingClient ? <FiEdit2 size={20} /> : <FiUserPlus size={20} />}
                <span>{editingClient ? `Edit Client — ${editingClient.companyName}` : 'Add New Client'}</span>
              </div>
              <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <FiX size={20} />
              </button>
            </div>

            <div className="view-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="modal-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Client ID</label>
                    <input value={form.id} disabled />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Company Name *</label>
                    <input 
                      value={form.companyName} 
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Contact Person *</label>
                    <input 
                      value={form.contactPerson} 
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input 
                      type="email"
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Username *</label>
                    <input 
                      value={form.username} 
                      onChange={(e) => setForm({ ...form, username: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Password</label>
                    <input 
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <div className="form-field">
                    <label>Subscription Plan</label>
                    <select 
                      value={form.subscriptionPlan} 
                      onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
                    >
                      {SUBSCRIPTION_PLANS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Industry</label>
                    <select 
                      value={form.industry} 
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Employees</label>
                    <input 
                      type="number"
                      value={form.employees}
                      onChange={(e) => setForm({ ...form, employees: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Revenue</label>
                    <input 
                      value={form.revenue}
                      onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                      placeholder="e.g. ₹25,00,000"
                    />
                  </div>
                  <div className="form-field">
                    <label>Start Date</label>
                    <input 
                      type="date"
                      value={form.subscriptionStartDate}
                      onChange={(e) => setForm({ ...form, subscriptionStartDate: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Expiry Date</label>
                    <input 
                      type="date"
                      value={form.subscriptionExpiryDate}
                      onChange={(e) => setForm({ ...form, subscriptionExpiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Company Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows="2"
                  />
                </div>

                {/* Permissions Section - Always Visible with Checkbox-style buttons */}
                <div className="form-field" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <label style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiShield size={18} /> Module Permissions
                    </label>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {getPermissionSummary(form.permissions)} granted
                    </span>
                  </div>

                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fafafa'
                  }}>
                    {/* Global Controls with Checkbox-style buttons */}
                    <div className="permission-actions-bar">
                      <button
                        type="button"
                        className="permission-action-btn select-all"
                        onClick={() => handleSelectAllPermissions(true)}
                      >
                        <FiCheck size={14} /> Select All
                      </button>
                      <button
                        type="button"
                        className="permission-action-btn clear-all"
                        onClick={() => handleSelectAllPermissions(false)}
                      >
                        <FiX size={14} /> Clear All
                      </button>
                      <div style={{ marginLeft: '8px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Actions:</span>
                        {PERMISSION_ACTIONS.map(action => {
                          const isAllSelected = isAllActionSelected(action);
                          return (
                            <button
                              key={action}
                              type="button"
                              className={`permission-action-btn action-btn ${isAllSelected ? 'active' : ''}`}
                              onClick={() => handleSelectAllActions(action, !isAllSelected)}
                              style={{
                                textTransform: 'capitalize',
                                background: isAllSelected ? '#7b1113' : '#e5e7eb',
                                color: isAllSelected ? '#fff' : '#374151'
                              }}
                            >
                              {isAllSelected ? <FiCheck size={12} /> : <FiSquare size={12} />}
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permission Grid */}
                    <div className="permission-grid">
                      {/* Header */}
                      <div className="permission-grid-header">
                        <div className="permission-header-module">Module</div>
                        <div className="permission-header-action">Read</div>
                        <div className="permission-header-action">Create</div>
                        <div className="permission-header-action">Edit</div>
                        <div className="permission-header-action">Delete</div>
                        <div className="permission-header-action">All</div>
                      </div>

                      {/* Permission Rows */}
                      {PERMISSIONS.map(module => {
                        const perms = form.permissions?.[module.id] || { read: false, create: false, edit: false, delete: false };
                        const allSelected = perms.read && perms.create && perms.edit && perms.delete;
                        return (
                          <div key={module.id} className="permission-row">
                            <div className="permission-module-name">
                              <module.icon size={14} />
                              {module.label}
                            </div>
                            {PERMISSION_ACTIONS.map(action => (
                              <div key={action} className="permission-cell" data-label={action}>
                                <input
                                  type="checkbox"
                                  className="permission-checkbox"
                                  checked={perms[action] || false}
                                  onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                                />
                              </div>
                            ))}
                            <div className="permission-cell" data-label="all">
                              <input
                                type="checkbox"
                                className="permission-checkbox"
                                checked={allSelected}
                                onChange={(e) => handleSelectAllModule(module.id, e.target.checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="permission-summary">
                      <span>Total Permissions Granted:</span>
                      <span style={{ fontWeight: 600, color: '#7b1113' }}>
                        {getPermissionSummary(form.permissions)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-modal-footer" style={{ marginTop: '16px' }}>
                  <button type="button" className="view-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="button" className="view-edit-btn" onClick={handleSave}>
                    {editingClient ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Clients;