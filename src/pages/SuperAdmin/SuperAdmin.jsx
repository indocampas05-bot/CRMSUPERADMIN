// src/pages/SuperAdmin/SuperAdmin.jsx
//
// This file did not exist before, even though src/App.jsx imports it
// (`import SuperAdmin from './pages/SuperAdmin/SuperAdmin';`). That import
// alone is enough to break the whole Vite build with a
// "Failed to resolve import ./pages/SuperAdmin/SuperAdmin" error the moment
// this route is reached — this was one of the "one error after another"
// issues. This component is now implemented and fully wired to the real
// Super Admin backend (SuperAdminController / SuperAdminService), not mock
// data.
import React, { useEffect, useState, useCallback } from 'react';
import {
  FiMapPin, FiUsers, FiTarget, FiUploadCloud, FiPlus, FiEdit2, FiTrash2,
  FiUpload, FiRefreshCw, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import StatsCard from '../../components/Cards/StatsCard';
import { superAdminService } from '../../services/superAdminService';
import './SuperAdmin.css';

const emptyEmployee = {
  username: '', password: '', fullName: '', email: '', phone: '', role: 'EMPLOYEE',
};

const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const EmployeeForm = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState(initial || emptyEmployee);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(initial && initial.id);

  return (
    <div className="lead-form">
      <div className="form-grid-2">
        <div className="form-group">
          <label>Username *</label>
          <input value={form.username} disabled={isEdit}
            onChange={(e) => set('username', e.target.value)} placeholder="login username" />
        </div>
        <div className="form-group">
          <label>{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
          <input type="password" value={form.password || ''}
            onChange={(e) => set('password', e.target.value)} placeholder="password" />
        </div>
        <div className="form-group">
          <label>Full Name *</label>
          <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Full name" />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
        </div>
        <div className="form-group">
          <label>Role *</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="EMPLOYEE">Employee (Telecaller)</option>
            <option value="SUPER_ADMIN">Super Admin (Manager)</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn-primary" disabled={saving} onClick={() => onSave(form)}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
        </button>
      </div>
    </div>
  );
};

const SuperAdmin = () => {
  const [stats, setStats] = useState({ totalDistricts: 0, totalEmployees: 0, totalLeads: 0, totalUploads: 0 });
  const [employees, setEmployees] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, employeesRes, historyRes] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getEmployees(),
        superAdminService.getUploadHistory(),
      ]);
      setStats(statsRes || {});
      setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
      setUploadHistory(Array.isArray(historyRes) ? historyRes : []);
    } catch (err) {
      setError(err.message || 'Failed to load Super Admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const overviewStats = [
    { label: 'Total Districts', value: stats.totalDistricts ?? 0, icon: <FiMapPin size={22} />, color: '#7b1113' },
    { label: 'Total Employees', value: stats.totalEmployees ?? 0, icon: <FiUsers size={22} />, color: '#2563eb' },
    { label: 'Total Leads', value: stats.totalLeads ?? 0, icon: <FiTarget size={22} />, color: '#16a34a' },
    { label: 'Total Uploads', value: stats.totalUploads ?? 0, icon: <FiUploadCloud size={22} />, color: '#7c3aed' },
  ];

  const openCreate = () => { setEditingEmployee(null); setShowEmployeeModal(true); };
  const openEdit = (emp) => {
    setEditingEmployee({
      id: emp.id, username: emp.username, password: '', fullName: emp.fullName,
      email: emp.email, phone: emp.phone, role: emp.role,
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async (form) => {
    setSaving(true);
    try {
      if (form.id) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await superAdminService.updateEmployee(form.id, payload);
      } else {
        if (!form.username || !form.password || !form.fullName || !form.email) {
          throw new Error('Username, password, full name and email are required');
        }
        await superAdminService.createEmployee(form);
      }
      setShowEmployeeModal(false);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (emp) => {
    if (!window.confirm(`Delete employee "${emp.fullName}" (${emp.username})? This cannot be undone.`)) return;
    try {
      await superAdminService.deleteEmployee(emp.id);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const uploadedBy = JSON.parse(localStorage.getItem('user') || '{}').username || 'super-admin';
      const result = await superAdminService.importLeads(file, uploadedBy);
      setImportMsg({
        type: result.status === 'SUCCESS' ? 'success' : 'warning',
        text: `Imported ${result.importedRecords}/${result.totalRecords} leads${
          result.errors && result.errors.length ? ` (${result.errors.length} row errors)` : ''
        }.`,
      });
      await loadAll();
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message || 'Import failed. CSV files only for now.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="sa-loading">Loading Super Admin dashboard…</div>;

  return (
    <div className="ad-dashboard">
      {error && (
        <div className="sa-alert sa-alert-error">
          {error}
          <button className="btn-outline sa-retry-btn" onClick={loadAll}><FiRefreshCw /> Retry</button>
        </div>
      )}

      <div className="ad-stats-grid">
        {overviewStats.map((s) => (
          <StatsCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="ad-charts-row">
        {/* Employees */}
        <div className="ad-card sa-span-2">
          <div className="card-header">
            <span className="card-title">Employees</span>
            <button className="btn-primary sa-small-btn" onClick={openCreate}>
              <FiPlus /> New Employee
            </button>
          </div>
          <table className="ad-table">
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Role</th><th>District</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={6} className="sa-empty-row">No employees yet. Click "New Employee" to add one.</td></tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.fullName}</td>
                  <td>{emp.username}</td>
                  <td>
                    <span className={`sa-badge ${emp.role === 'SUPER_ADMIN' ? 'sa-badge-purple' : 'sa-badge-blue'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td>{emp.assignedDistrict || '—'}</td>
                  <td>
                    {emp.enabled
                      ? <span className="sa-badge sa-badge-green"><FiCheckCircle size={12} /> Active</span>
                      : <span className="sa-badge sa-badge-red"><FiXCircle size={12} /> Disabled</span>}
                  </td>
                  <td className="sa-row-actions">
                    <button className="sa-icon-btn" onClick={() => openEdit(emp)}><FiEdit2 /></button>
                    <button className="sa-icon-btn sa-icon-btn-danger" onClick={() => handleDeleteEmployee(emp)}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Import leads */}
        <div className="ad-card">
          <div className="card-header"><span className="card-title">Import Leads (CSV)</span></div>
          <p className="muted-text">
            Upload a CSV with columns: name, mobile, district, email, area.
            The backend currently accepts CSV only.
          </p>
          <label className="sa-upload-dropzone">
            <FiUpload size={22} />
            <span>{importing ? 'Importing…' : 'Choose CSV file'}</span>
            <input type="file" accept=".csv" hidden disabled={importing} onChange={handleImportFile} />
          </label>
          {importMsg && (
            <div className={`sa-alert sa-alert-${importMsg.type}`} style={{ marginTop: 12 }}>
              {importMsg.text}
            </div>
          )}
        </div>
      </div>

      <div className="ad-tables-row">
        <div className="ad-card">
          <div className="card-header"><span className="card-title">Upload History</span></div>
          <table className="ad-table">
            <thead>
              <tr><th>File</th><th>Uploaded By</th><th>Total</th><th>Imported</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {uploadHistory.length === 0 && (
                <tr><td colSpan={6} className="sa-empty-row">No uploads yet.</td></tr>
              )}
              {uploadHistory.map((h) => (
                <tr key={h.id}>
                  <td>{h.fileName}</td>
                  <td>{h.uploadedBy}</td>
                  <td>{h.totalRecords}</td>
                  <td>{h.importedRecords}</td>
                  <td>
                    <span className={`sa-badge ${h.status === 'SUCCESS' ? 'sa-badge-green' : 'sa-badge-amber'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td>{h.uploadedAt ? new Date(h.uploadedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={showEmployeeModal} title={editingEmployee ? 'Edit Employee' : 'New Employee'} onClose={() => setShowEmployeeModal(false)}>
        <EmployeeForm initial={editingEmployee} onSave={handleSaveEmployee} onClose={() => setShowEmployeeModal(false)} saving={saving} />
      </Modal>
    </div>
  );
};

export default SuperAdmin;
