// src/pages/Telecallers/WorkTimings.jsx
import React, { useState } from 'react';
import { FiClock, FiCoffee, FiSun, FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi';

const WorkTimings = ({ workTimings, onSave }) => {
  const [form, setForm] = useState(workTimings || {
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
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSave(form);
    alert('Work timings updated for all telecallers.');
  };

  // Helper function to check if a break is currently active
  const isBreakActive = (startTime, endTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return currentMinutes >= startTotal && currentMinutes <= endTotal;
  };

  return (
    <div className="tc-section">
      <div className="tc-section-header">
        <h3 className="tc-section-title">⏰ Work Timings & Break Management</h3>
        <p className="tc-section-hint">Configure shift hours, lunch breaks, tea breaks, and dashboard lock policies for all telecallers.</p>
      </div>

      <form className="tc-work-timing-form" onSubmit={handleSave}>
        {/* Shift Details */}
        <div className="timing-section">
          <div className="timing-section-header">
            <FiClock className="section-icon" />
            <h4>Shift Details</h4>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Shift Name</label>
              <select 
                value={form.shiftName} 
                onChange={(e) => setForm({ ...form, shiftName: e.target.value })}
              >
                <option>Morning Shift</option>
                <option>Afternoon Shift</option>
                <option>Evening Shift</option>
                <option>Night Shift</option>
                <option>Flexible Shift</option>
              </select>
            </div>
            <div className="form-field">
              <label>Shift Start</label>
              <input 
                type="time" 
                value={form.shiftStart} 
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Shift End</label>
              <input 
                type="time" 
                value={form.shiftEnd} 
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Grace Time (minutes)</label>
              <input 
                type="number" 
                value={form.graceTime} 
                onChange={(e) => setForm({ ...form, graceTime: Number(e.target.value) })}
                min="0"
                max="60"
              />
            </div>
            <div className="form-field">
              <label>Working Hours</label>
              <input 
                type="number" 
                value={form.workingHours} 
                onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
                min="4"
                max="12"
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Lunch Break */}
        <div className="timing-section">
          <div className="timing-section-header">
            <FiSun className="section-icon" />
            <h4>Lunch Break</h4>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Enable Lunch Break</label>
              <select 
                value={form.enableLunch ? 'Yes' : 'No'} 
                onChange={(e) => setForm({ ...form, enableLunch: e.target.value === 'Yes' })}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-field">
              <label>Lunch Start</label>
              <input 
                type="time" 
                value={form.lunchStart} 
                onChange={(e) => setForm({ ...form, lunchStart: e.target.value })}
                disabled={!form.enableLunch}
              />
            </div>
            <div className="form-field">
              <label>Lunch End</label>
              <input 
                type="time" 
                value={form.lunchEnd} 
                onChange={(e) => setForm({ ...form, lunchEnd: e.target.value })}
                disabled={!form.enableLunch}
              />
            </div>
            <div className="form-field">
              <label>Duration</label>
              <input 
                type="text" 
                value={(() => {
                  if (!form.enableLunch) return 'Disabled';
                  const start = new Date(`2000-01-01T${form.lunchStart}:00`);
                  const end = new Date(`2000-01-01T${form.lunchEnd}:00`);
                  const diff = (end - start) / 60000;
                  const hours = Math.floor(diff / 60);
                  const minutes = diff % 60;
                  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                })()}
                disabled
                style={{ background: '#f5f6fa' }}
              />
            </div>
          </div>
        </div>

        {/* Tea Breaks */}
        <div className="timing-section">
          <div className="timing-section-header">
            <FiCoffee className="section-icon" />
            <h4>Tea Breaks</h4>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Enable Tea Breaks</label>
              <select 
                value={form.enableTeaBreak ? 'Yes' : 'No'} 
                onChange={(e) => setForm({ ...form, enableTeaBreak: e.target.value === 'Yes' })}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-field">
              <label>Morning Tea Start</label>
              <input 
                type="time" 
                value={form.morningTeaStart} 
                onChange={(e) => setForm({ ...form, morningTeaStart: e.target.value })}
                disabled={!form.enableTeaBreak}
              />
            </div>
            <div className="form-field">
              <label>Morning Tea End</label>
              <input 
                type="time" 
                value={form.morningTeaEnd} 
                onChange={(e) => setForm({ ...form, morningTeaEnd: e.target.value })}
                disabled={!form.enableTeaBreak}
              />
            </div>
            <div className="form-field">
              <label>Evening Tea Start</label>
              <input 
                type="time" 
                value={form.eveningTeaStart} 
                onChange={(e) => setForm({ ...form, eveningTeaStart: e.target.value })}
                disabled={!form.enableTeaBreak}
              />
            </div>
            <div className="form-field">
              <label>Evening Tea End</label>
              <input 
                type="time" 
                value={form.eveningTeaEnd} 
                onChange={(e) => setForm({ ...form, eveningTeaEnd: e.target.value })}
                disabled={!form.enableTeaBreak}
              />
            </div>
          </div>
        </div>

        {/* Dashboard Lock */}
        <div className="timing-section">
          <div className="timing-section-header">
            <FiLock className="section-icon" />
            <h4>Dashboard Lock Policies</h4>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Lock Dashboard During Break</label>
              <select 
                value={form.lockDuringBreak ? 'Yes' : 'No'} 
                onChange={(e) => setForm({ ...form, lockDuringBreak: e.target.value === 'Yes' })}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-field">
              <label>Show Break Timer on Dashboard</label>
              <select 
                value={form.showBreakTimer ? 'Yes' : 'No'} 
                onChange={(e) => setForm({ ...form, showBreakTimer: e.target.value === 'Yes' })}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-field">
              <label>Auto Resume After Break</label>
              <select 
                value={form.autoResume ? 'Yes' : 'No'} 
                onChange={(e) => setForm({ ...form, autoResume: e.target.value === 'Yes' })}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>

          {form.lockDuringBreak && (
            <div className="lock-policy-preview">
              <FiAlertCircle className="preview-icon" />
              <div className="preview-content">
                <strong>When dashboard is locked during breaks:</strong>
                <ul>
                  <li>✓ Telecallers cannot access Leads</li>
                  <li>✓ Calling features are disabled</li>
                  <li>✓ Auto-dialer is paused</li>
                  <li>✓ Follow-ups cannot be updated</li>
                  <li>✓ Quotations and Payments are blocked</li>
                  <li>✗ Only Logout and Profile are accessible</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Break Preview */}
        <div className="timing-section break-preview">
          <div className="timing-section-header">
            <FiClock className="section-icon" />
            <h4>Today's Break Schedule</h4>
          </div>
          <div className="break-schedule">
            {form.enableLunch && (
              <div className="break-item">
                <span className="break-type lunch">🍽️ Lunch Break</span>
                <span className="break-time">{form.lunchStart} - {form.lunchEnd}</span>
                <span className="break-status">
                  {isBreakActive(form.lunchStart, form.lunchEnd) ? '🟠 Active Now' : '⚪ Scheduled'}
                </span>
              </div>
            )}
            {form.enableTeaBreak && (
              <>
                <div className="break-item">
                  <span className="break-type tea">☕ Morning Tea</span>
                  <span className="break-time">{form.morningTeaStart} - {form.morningTeaEnd}</span>
                  <span className="break-status">
                    {isBreakActive(form.morningTeaStart, form.morningTeaEnd) ? '🟠 Active Now' : '⚪ Scheduled'}
                  </span>
                </div>
                <div className="break-item">
                  <span className="break-type tea">☕ Evening Tea</span>
                  <span className="break-time">{form.eveningTeaStart} - {form.eveningTeaEnd}</span>
                  <span className="break-status">
                    {isBreakActive(form.eveningTeaStart, form.eveningTeaEnd) ? '🟠 Active Now' : '⚪ Scheduled'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="submit" className="primary-btn">
            Save Work Timings
          </button>
        </div>
      </form>

      <style>{`
        .tc-work-timing-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .timing-section {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #f0f0f5;
        }

        .timing-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f5f6fa;
        }

        .timing-section-header h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1e1e2f;
          margin: 0;
        }

        .section-icon {
          font-size: 20px;
          color: #7b1113;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label {
          font-size: 12px;
          font-weight: 600;
          color: #5a5a7a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .form-field input,
        .form-field select {
          border: 1px solid #e6e6ef;
          border-radius: 8px;
          padding: 10px 12px;
          font-family: 'Public Sans', sans-serif;
          font-size: 13px;
          color: #1e1e2f;
          outline: none;
          background: #fff;
          transition: all 0.2s ease;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: #7b1113;
          box-shadow: 0 0 0 3px rgba(123, 17, 19, 0.08);
        }

        .form-field input:disabled {
          background: #f5f6fa;
          color: #8888aa;
          opacity: 0.7;
        }

        .lock-policy-preview {
          margin-top: 16px;
          padding: 16px;
          background: #fef3c7;
          border-radius: 8px;
          border: 1px solid #fde68a;
          display: flex;
          gap: 12px;
        }

        .preview-icon {
          color: #b45309;
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .preview-content {
          font-size: 13px;
          color: #1e1e2f;
        }

        .preview-content ul {
          margin: 6px 0 0 0;
          padding-left: 20px;
          list-style: none;
        }

        .preview-content ul li {
          margin: 4px 0;
          font-size: 12px;
        }

        .preview-content ul li:last-child {
          color: #dc2626;
        }

        .break-preview {
          background: #f8f9fa;
        }

        .break-schedule {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .break-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e6e6ef;
        }

        .break-type {
          font-weight: 600;
          font-size: 13px;
          min-width: 120px;
        }

        .break-type.lunch {
          color: #b45309;
        }

        .break-type.tea {
          color: #0369a1;
        }

        .break-time {
          font-size: 13px;
          color: #1e1e2f;
          font-family: monospace;
          font-weight: 600;
        }

        .break-status {
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f0f0f5;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #7b1113;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-family: 'Public Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-btn:hover {
          background: #5e0d0f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(123, 17, 19, 0.3);
        }

        .tc-section-header {
          margin-bottom: 20px;
        }

        .tc-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e1e2f;
          margin: 0 0 4px 0;
        }

        .tc-section-hint {
          font-size: 13px;
          color: #8888aa;
          margin: 0;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .break-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .break-status {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkTimings;