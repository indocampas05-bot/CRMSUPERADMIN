// src/pages/Telecallers/Telecallers.jsx
import React, { useState, useEffect } from 'react';
import './Telecallers.css';
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
  FiShield,
  FiHome,
  FiFileText,
  FiClock,
  FiDollarSign,
  FiCalendar as FiCalendarIcon,
  FiSettings,
  FiHelpCircle,
  FiVideo,
  FiBriefcase,
  FiGlobe,
  FiClock as FiClockIcon,
} from 'react-icons/fi';

import {
  CATEGORIES,
  ROLES,
  DEFAULT_WORK_TIMINGS,
  DEFAULT_PERMISSIONS,
} from './telecallersData';

import { telecallerService } from '../../services/telecallerService';
import { superAdminService } from '../../services/superAdminService';
import TelecallerPortal from './TelecallerPortal';
import TelecallerPerformanceDetails from './TelecallerPerformanceDetails';
import TelecallerFollowUps from './TelecallerFollowUps';
import WorkTimings from './WorkTimings';
import AddTelecaller from './AddTelecaller';

// Fallback districts
const FALLBACK_DISTRICTS = [
  'Chennai', 'Chengalpattu', 'Kanchipuram', 'Coimbatore', 'Madurai', 
  'Trichy', 'Salem', 'Cuddalore', 'Pondicherry', 'Villupuram', 'Thindivanam'
];

// Permissions list
const TELECALLER_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'leads', label: 'Leads', icon: FiTarget },
  { id: 'callpanel', label: 'Call Panel', icon: FiPhone },
  { id: 'clients', label: 'Clients', icon: FiUsers },
  { id: 'followups', label: 'Follow-ups', icon: FiClock },
  { id: 'demo', label: 'Demo', icon: FiVideo },
  { id: 'quotations', label: 'Quotations', icon: FiFileText },
  { id: 'agreements', label: 'Agreements', icon: FiFileText },
  { id: 'payment', label: 'Payment', icon: FiDollarSign },
  { id: 'reports', label: 'Reports', icon: FiBarChart2 },
  { id: 'calendar', label: 'Calendar', icon: FiCalendarIcon },
  { id: 'settings', label: 'Settings', icon: FiSettings },
  { id: 'help', label: 'Help and Support', icon: FiHelpCircle },
  { id: 'leave_permissions', label: 'Leave & Permissions', icon: FiBriefcase },
  { id: 'communications', label: 'Communications', icon: FiGlobe },
];

const PERMISSION_ACTIONS = ['read', 'create', 'edit', 'delete'];

const Telecallers = () => {
  // ===== State =====
  const [telecallers, setTelecallers] = useState([]);
  const [districts, setDistricts] = useState(FALLBACK_DISTRICTS);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [workTimings, setWorkTimings] = useState(DEFAULT_WORK_TIMINGS);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTelecaller, setEditingTelecaller] = useState(null);
  const [portalTelecaller, setPortalTelecaller] = useState(null);
  const [followUpTelecaller, setFollowUpTelecaller] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPerformance, setShowPerformance] = useState(false);
  const [activeTab, setActiveTab] = useState('telecallers');

  // ===== Form state =====
  const getDefaultPermissions = () => {
    return { ...DEFAULT_PERMISSIONS };
  };

  const getDefaultPerformance = () => ({
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
  });

  const [form, setForm] = useState({
    employeeId: '',
    fullName: '',
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
    permissions: getDefaultPermissions(),
    performance: getDefaultPerformance(),
    workTiming: { ...DEFAULT_WORK_TIMINGS },
  });

  // ===== Reset form =====
  const resetForm = () => {
    setForm({
      employeeId: '',
      fullName: '',
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
      permissions: getDefaultPermissions(),
      performance: getDefaultPerformance(),
      workTiming: { ...DEFAULT_WORK_TIMINGS },
    });
    setEditingTelecaller(null);
  };

  // ===== API calls =====
  const fetchTelecallers = async () => {
    try {
      setLoading(true);
      const data = await telecallerService.getAll();
      setTelecallers(data);
    } catch (error) {
      console.error('Failed to fetch telecallers:', error);
      alert('Error loading telecallers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const data = await superAdminService.getDistricts();
      
      if (data && Array.isArray(data) && data.length > 0) {
        const districtNames = data.map(d => d.name || d);
        setDistricts(districtNames);
      } else {
        setDistricts(FALLBACK_DISTRICTS);
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error);
      setDistricts(FALLBACK_DISTRICTS);
    } finally {
      setLoadingDistricts(false);
    }
  };

  useEffect(() => {
    fetchTelecallers();
    fetchDistricts();
  }, []);

  // ===== CRUD handlers =====
  const handleSave = async (formData) => {
    if (!formData.fullName || !formData.mobile || !formData.username) {
      alert('Full Name, Mobile and Username are required.');
      return;
    }

    try {
      const saveData = {
        employeeId: formData.id || formData.employeeId || '',
        fullName: formData.fullName || formData.name,
        mobile: formData.mobile,
        email: formData.email || '',
        username: formData.username,
        password: formData.password || '',
        role: formData.role || 'Telecaller',
        districts: [],
        categories: [],
        joiningDate: formData.joiningDate || '',
        status: formData.status || 'Active',
        target: formData.target || 100,
        permissions: formData.permissions || getDefaultPermissions(),
        performance: formData.performance || getDefaultPerformance(),
        workTiming: formData.workTiming || { ...DEFAULT_WORK_TIMINGS },
      };

      if (editingTelecaller) {
        await telecallerService.update(editingTelecaller.id, saveData);
        alert('Telecaller updated successfully.');
      } else {
        await telecallerService.create(saveData);
        alert('Telecaller created successfully.');
      }
      await fetchTelecallers();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving telecaller: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this telecaller? This cannot be undone.')) return;
    try {
      await telecallerService.delete(id);
      await fetchTelecallers();
    } catch (error) {
      alert('Error deleting telecaller: ' + error.message);
    }
  };

  const handleEditClick = (telecaller) => {
    setEditingTelecaller(telecaller);
    const { password, ...rest } = telecaller;
    setForm({
      ...rest,
      fullName: telecaller.fullName || telecaller.name || '',
      password: '',
      permissions: telecaller.permissions || getDefaultPermissions(),
      performance: telecaller.performance || getDefaultPerformance(),
      workTiming: telecaller.workTiming || { ...DEFAULT_WORK_TIMINGS },
    });
    setShowAddModal(true);
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const resetPassword = async (id) => {
    const newPass = prompt('Enter new temporary password (leave blank to generate):');
    if (newPass === null) return;
    const password = newPass.trim() || Math.random().toString(36).slice(-8);
    try {
      await telecallerService.resetPassword(id, password);
      alert(`Password reset successfully!\nNew password: ${password}`);
      await fetchTelecallers();
    } catch (error) {
      alert('Error resetting password: ' + error.message);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await telecallerService.toggleStatus(id);
      await fetchTelecallers();
    } catch (error) {
      alert('Error toggling status: ' + error.message);
    }
  };

  // ===== Utility functions =====
  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((v) => ({ ...v, [id]: !v[id] }));
  };

  const getPermissionSummary = (permissions) => {
    if (!permissions) return 'No permissions set';
    let total = 0, granted = 0;
    TELECALLER_PERMISSIONS.forEach((p) => {
      if (permissions[p.id]) {
        PERMISSION_ACTIONS.forEach((action) => {
          total++;
          if (permissions[p.id][action]) granted++;
        });
      }
    });
    return `${granted}/${total}`;
  };

  const handleWorkTimingsSave = (newTimings) => {
    setWorkTimings(newTimings);
  };

  // ===== Filtering =====
  const filteredTelecallers = telecallers.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (t.fullName || '').toLowerCase().includes(q) ||
      (t.mobile || '').includes(search) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.employeeId || '').toLowerCase().includes(q) ||
      (t.username || '').toLowerCase().includes(q);
    const matchesDistrict =
      selectedDistrict === 'All' || (t.districts || []).includes(selectedDistrict);
    const matchesCategory =
      selectedCategory === 'All' || (t.categories || []).includes(selectedCategory);
    return matchesSearch && matchesDistrict && matchesCategory;
  });

  // ===== Stats =====
  const totalTelecallers = telecallers.length;
  const activeTelecallers = telecallers.filter((t) => t.status === 'Active').length;
  const inactiveTelecallers = telecallers.filter((t) => t.status === 'Inactive').length;
  const totalConversions = telecallers.reduce(
    (sum, t) => sum + (t.performance?.conversions || 0),
    0
  );
  const totalRevenue = telecallers.reduce(
    (sum, t) => sum + (t.performance?.revenue || 0),
    0
  );

  const currency = (n) =>
    '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : (n || 0).toLocaleString('en-IN'));

  // ===== Render =====
  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <h1 className="page-title">📞 Telecaller Management</h1>
          <p className="page-subtitle">
            Manage your telecalling team, accounts, assignments and performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="primary-btn"
            onClick={() => setShowPerformance(!showPerformance)}
            style={{
              background: showPerformance ? '#6b7280' : '#7b1113',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiBarChart2 /> {showPerformance ? 'Hide Performance' : 'View Performance'}
          </button>
          <button className="primary-btn" onClick={handleAddClick}>
            <FiUserPlus /> Add Telecaller
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
            <div className="tc-stat-value">{totalTelecallers}</div>
            <div className="tc-stat-label">Total Telecallers</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <FiCheckCircle size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{activeTelecallers}</div>
            <div className="tc-stat-label">Active</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <FiXCircle size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{inactiveTelecallers}</div>
            <div className="tc-stat-label">Inactive</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FiTarget size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{totalConversions}</div>
            <div className="tc-stat-label">Total Conversions</div>
          </div>
        </div>
        <div className="tc-stat-card">
          <div className="tc-stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <FiBarChart2 size={24} />
          </div>
          <div className="tc-stat-content">
            <div className="tc-stat-value">{currency(totalRevenue)}</div>
            <div className="tc-stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tc-tabs">
        <button
          className={`tc-tab ${activeTab === 'telecallers' ? 'active' : ''}`}
          onClick={() => setActiveTab('telecallers')}
        >
          <FiUsers /> Telecallers
        </button>
        <button
          className={`tc-tab ${activeTab === 'worktimings' ? 'active' : ''}`}
          onClick={() => setActiveTab('worktimings')}
        >
          <FiClockIcon /> Work Timings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'worktimings' ? (
        <WorkTimings workTimings={workTimings} onSave={handleWorkTimingsSave} />
      ) : (
        <>
          {/* Performance Details Section */}
          {showPerformance && (
            <TelecallerPerformanceDetails telecallers={telecallers} />
          )}

          {/* Search and Filters */}
          <div className="tc-toolbar">
            <div className="search-box">
              <FiSearch />
              <input
                placeholder="Search by name, mobile, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="All">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Telecallers Grid */}
          {loading ? (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <p>Loading telecallers...</p>
            </div>
          ) : (
            <div className="tc-grid">
              {filteredTelecallers.map((t) => (
                <div key={t.id} className="tc-card">
                  <div className="tc-card-header">
                    <div className="tc-card-id">{t.employeeId}</div>
                    <div className={`tc-card-status ${t.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                      {t.status === 'Active' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                      {t.status}
                    </div>
                  </div>

                  <div className="tc-card-body">
                    <div className="tc-card-name">{t.fullName}</div>
                    <div className="tc-card-role-badge">{t.role}</div>

                    <div className="tc-card-details">
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiPhone size={14} /> Mobile</span>
                        <span>{t.mobile}</span>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiMail size={14} /> Email</span>
                        <span>{t.email}</span>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiUser size={14} /> Username</span>
                        <span>{t.username}</span>
                      </div>
                      
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiKey size={14} /> Password</span>
                        <div className="password-cell">
                          <span>••••••••</span>
                          <button className="icon-btn-sm" onClick={() => togglePasswordVisibility(t.id)}>
                            {visiblePasswords[t.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                          <button
                            className="icon-btn-sm"
                            onClick={() => resetPassword(t.id)}
                            style={{ marginLeft: '4px', color: '#2563eb' }}
                            title="Reset Password"
                          >
                            <FiKey size={14} /> Reset
                          </button>
                        </div>
                      </div>
                      
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiShield size={14} /> Permissions</span>
                        <span style={{ fontSize: '11px', color: '#7b1113', fontWeight: 600 }}>
                          {getPermissionSummary(t.permissions)}
                        </span>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiAward size={14} /> Target</span>
                        <span>{t.target} leads</span>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiCalendar size={14} /> Joining</span>
                        <span>{t.joiningDate}</span>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label"><FiMapPin size={14} /> Districts</span>
                        <div className="chip-list">
                          {(t.districts || []).map((d) => (
                            <span key={d} className="chip chip-district">{d}</span>
                          ))}
                        </div>
                      </div>
                      <div className="tc-card-detail">
                        <span className="tc-card-detail-label">Categories</span>
                        <div className="chip-list">
                          {(t.categories || []).map((c) => (
                            <span key={c} className="chip chip-category">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="tc-card-actions">
                    <button className="tc-action-btn view-btn" onClick={() => setPortalTelecaller(t)}>
                      <FiEye /> View
                    </button>
                    <button className="tc-action-btn view-btn" onClick={() => setFollowUpTelecaller(t)}>
                      <FiClock /> Follow-ups
                    </button>
                    <button className="tc-action-btn edit-btn" onClick={() => handleEditClick(t)}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="tc-action-btn password-btn" onClick={() => resetPassword(t.id)}>
                      <FiKey /> Reset Password
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
          )}

          {!loading && filteredTelecallers.length === 0 && (
            <div className="empty-state">
              <p>No telecallers found matching your filters.</p>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setShowAddModal(false);
            resetForm();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <AddTelecaller
              telecallers={telecallers}
              editing={editingTelecaller}
              onSave={handleSave}
              onCancel={() => {
                setShowAddModal(false);
                resetForm();
              }}
            />
          </div>
        </div>
      )}

      {/* View Portal Modal */}
      {portalTelecaller && (
        <TelecallerPortal
          telecaller={portalTelecaller}
          onClose={() => setPortalTelecaller(null)}
        />
      )}

      {/* Telecaller Follow-ups Modal */}
      {followUpTelecaller && (
        <TelecallerFollowUps
          telecaller={followUpTelecaller}
          onClose={() => setFollowUpTelecaller(null)}
        />
      )}
    </div>
  );
};

export default Telecallers;