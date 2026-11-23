// src/pages/Telecallers/UserAccounts.jsx
import React, { useState } from 'react';
import { FiKey, FiEye, FiEyeOff, FiLock, FiUnlock } from 'react-icons/fi';
import { ROLES } from './telecallersData';

const UserAccounts = ({ telecallers, onUpdate, onResetPassword }) => {
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((v) => ({ ...v, [id]: !v[id] }));
  };

  return (
    <div className="tc-section">
      <p className="tc-section-hint">Manage login credentials, roles and account status for every telecaller.</p>
      <div className="tc-table-card">
        <table className="tc-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Username</th>
              <th>Password</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {telecallers.map((t) => (
              <tr key={t.id}>
                <td className="cell-name">{t.name}</td>
                <td>{t.username}</td>
                <td>
                  <div className="password-cell">
                    <span>{visiblePasswords[t.id] ? t.password : '•'.repeat(Math.max(t.password.length, 8))}</span>
                    <button className="icon-btn-sm" onClick={() => togglePasswordVisibility(t.id)}>
                      {visiblePasswords[t.id] ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </td>
                <td>
                  <select value={t.role} onChange={(e) => onUpdate(t.id, { role: e.target.value })}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td><span className={`status-pill ${t.status === 'Active' ? 'status-active' : 'status-inactive'}`}>{t.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button title="Reset Password" onClick={() => onResetPassword(t.id)}><FiKey /></button>
                    <button
                      title={t.status === 'Active' ? 'Disable Login' : 'Enable Login'}
                      className={t.status === 'Active' ? 'btn-deactivate' : 'btn-activate'}
                      onClick={() => onUpdate(t.id, { status: t.status === 'Active' ? 'Inactive' : 'Active' })}
                    >
                      {t.status === 'Active' ? <FiLock /> : <FiUnlock />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAccounts;
