import React, { useEffect, useState, useCallback } from 'react';
import { FiMapPin, FiRefreshCw, FiSave, FiCheck } from 'react-icons/fi';
import { superAdminService } from '../../services/superAdminService';
import '../SuperAdmin/SuperAdmin.css';
import './Districts.css';

const Districts = () => {
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d, e] = await Promise.all([superAdminService.getDistricts(), superAdminService.getEmployees()]);
      setDistricts(Array.isArray(d) ? d : []);
      setEmployees(Array.isArray(e) ? e.filter(x => !['SUPER_ADMIN','ADMIN'].includes(String(x.role || '').toUpperCase())) : []);
    } catch (err) { setError(err.message || 'Failed to load assignment data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectEmployee = async (username) => {
    setSelectedEmployee(username); setMessage(''); setError('');
    if (!username) { setSelectedDistricts([]); return; }
    try {
      const data = await superAdminService.getTelecallerDistrictAssignments();
      const tc = data.find(x => x.username === username);
      setSelectedDistricts(tc?.districts || []);
    } catch (err) { setError(err.message || 'Failed to load telecaller districts'); }
  };

  const toggleDistrict = (name) => setSelectedDistricts(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);

  const save = async () => {
    if (!selectedEmployee) { setError('Select a telecaller first.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await superAdminService.setTelecallerDistricts(selectedEmployee, selectedDistricts);
      setMessage('District assignment updated successfully.');
      await load();
    } catch (err) { setError(err.message || 'Failed to update district assignment'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="sa-loading">Loading district assignments…</div>;

  return (
    <div className="ad-dashboard">
      <div className="ad-card" style={{ marginBottom: 18 }}>
        <div className="card-header"><span className="card-title">District Assignment</span><button className="btn-outline" onClick={load}><FiRefreshCw /> Refresh</button></div>
        {error && <div className="sa-alert sa-alert-error">{error}</div>}
        {message && <div className="sa-alert sa-alert-success"><FiCheck /> {message}</div>}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Telecaller</label>
          <select value={selectedEmployee} onChange={e => selectEmployee(e.target.value)} style={{ width: '100%', maxWidth: 520, padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <option value="">Select Telecaller…</option>
            {employees.map(e => <option key={e.id || e.username} value={e.username}>{e.fullName || e.username} ({e.username})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {districts.map(d => { const checked = selectedDistricts.includes(d.name); return (
            <label key={d.id || d.name} style={{ border: checked ? '2px solid #7b1113' : '1px solid #e5e7eb', borderRadius: 12, padding: 16, cursor: 'pointer', background: checked ? '#fff7f7' : '#fff' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleDistrict(d.name)} disabled={!selectedEmployee} />
              <span style={{ marginLeft: 10, fontWeight: 700 }}>{d.name}</span>
              <div style={{ marginLeft: 25, color: '#6b7280', fontSize: 12 }}>{Number(d.leadCount || 0).toLocaleString()} leads</div>
            </label>
          ); })}
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" disabled={!selectedEmployee || saving} onClick={save}><FiSave /> {saving ? 'Saving…' : `Save Assignment (${selectedDistricts.length})`}</button>
        </div>
      </div>
    </div>
  );
};

export default Districts;
