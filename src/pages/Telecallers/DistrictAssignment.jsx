// src/pages/Telecallers/DistrictAssignment.jsx
import React, { useState, useEffect } from 'react';
import { DISTRICTS } from './telecallersData';

const DistrictAssignment = ({ telecallers, onUpdate }) => {
  const [selectedId, setSelectedId] = useState(telecallers[0]?.id || '');
  const [draft, setDraft] = useState([]);

  useEffect(() => {
    const t = telecallers.find((tc) => tc.id === selectedId);
    setDraft(t ? [...t.districts] : []);
  }, [selectedId, telecallers]);

  const selected = telecallers.find((t) => t.id === selectedId);

  const toggle = (d) => {
    setDraft((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]));
  };

  const handleSave = () => {
    onUpdate(selectedId, { districts: draft });
    alert(`Districts updated for ${selected.name}.`);
  };

  const handleRemoveAll = () => setDraft([]);

  return (
    <div className="tc-section">
      <p className="tc-section-hint">Assign one or more districts to each telecaller for automatic lead routing.</p>

      <div className="tc-form-card tc-district-card">
        <div className="form-field" style={{ maxWidth: 320 }}>
          <label>Select Telecaller</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {telecallers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
          </select>
        </div>

        {selected && (
          <>
            <div className="district-assign-list">
              {DISTRICTS.map((d) => (
                <label key={d} className="checkbox-pill checkbox-pill-lg">
                  <input type="checkbox" checked={draft.includes(d)} onChange={() => toggle(d)} />
                  {d}
                </label>
              ))}
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="button" className="secondary-btn" onClick={handleRemoveAll}>Remove All</button>
              <button type="button" className="primary-btn" onClick={handleSave}>Update Assignment</button>
            </div>
          </>
        )}
      </div>

      <div className="tc-table-card">
        <table className="tc-table">
          <thead><tr><th>Telecaller</th><th>Assigned Districts</th></tr></thead>
          <tbody>
            {telecallers.map((t) => (
              <tr key={t.id}>
                <td className="cell-name">{t.name}</td>
                <td><div className="chip-list">{t.districts.length ? t.districts.map((d) => <span key={d} className="chip chip-district">{d}</span>) : <span className="cell-sub">No districts assigned</span>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistrictAssignment;
