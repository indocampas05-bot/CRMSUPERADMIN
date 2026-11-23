// src/pages/Telecallers/Permissions.jsx
import React, { useState, useEffect } from 'react';
import { QUOTATION_ACCESS, PAYMENT_ACCESS, REPORTS_ACCESS } from './telecallersData';

const BOOLEAN_PERMS = [
  { key: 'dashboard', label: 'Dashboard Access' },
  { key: 'leads', label: 'Lead Access' },
  { key: 'editLeads', label: 'Edit Leads' },
  { key: 'deleteLeads', label: 'Delete Leads' },
];

const Permissions = ({ telecallers, onUpdate }) => {
  const [selectedId, setSelectedId] = useState(telecallers[0]?.id || '');
  const [draft, setDraft] = useState(telecallers[0]?.permissions || {});

  useEffect(() => {
    const t = telecallers.find((tc) => tc.id === selectedId);
    setDraft(t ? { ...t.permissions } : {});
  }, [selectedId, telecallers]);

  const selected = telecallers.find((t) => t.id === selectedId);

  const handleSave = () => {
    onUpdate(selectedId, { permissions: draft });
    alert(`Permissions updated for ${selected.name}.`);
  };

  return (
    <div className="tc-section">
      <p className="tc-section-hint">Control exactly what each telecaller can see and do inside their portal.</p>

      <div className="tc-form-card">
        <div className="form-field" style={{ maxWidth: 320 }}>
          <label>Select Telecaller</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {telecallers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
          </select>
        </div>

        {selected && (
          <>
            <div className="permission-grid">
              {BOOLEAN_PERMS.map((p) => (
                <div className="permission-row" key={p.key}>
                  <span>{p.label}</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!draft[p.key]}
                      onChange={(e) => setDraft({ ...draft, [p.key]: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}

              <div className="permission-row">
                <span>Quotations</span>
                <select value={draft.quotations} onChange={(e) => setDraft({ ...draft, quotations: e.target.value })}>
                  {QUOTATION_ACCESS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>

              <div className="permission-row">
                <span>Payments</span>
                <select value={draft.payments} onChange={(e) => setDraft({ ...draft, payments: e.target.value })}>
                  {PAYMENT_ACCESS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>

              <div className="permission-row">
                <span>Reports</span>
                <select value={draft.reports} onChange={(e) => setDraft({ ...draft, reports: e.target.value })}>
                  {REPORTS_ACCESS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="button" className="primary-btn" onClick={handleSave}>Save Permissions</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Permissions;
