import React, { useState } from 'react';
import './CallPanel.css';

const CallPanel = () => {
  const [outcome, setOutcome] = useState('Interested');
  const [followUp, setFollowUp] = useState('Tomorrow');
  const [remarks, setRemarks] = useState('Customer is interested in Premium Plan. Asked for quotation.');

  return (
    <div className="call-panel">
      <div className="cp-header">
        <h3 className="cp-title">Call Panel</h3>
        <span className="cp-status"><span className="status-dot"></span> Connected</span>
      </div>

      <div className="cp-contact">
        <div className="cp-avatar">R</div>
        <div className="cp-contact-info">
          <div className="cp-name">Ramesh Kumar</div>
          <div className="cp-phone">+91 98765 43210</div>
          <div className="cp-location">Chennai, Tamil Nadu</div>
        </div>
      </div>

      <div className="cp-call-meta">
        <div className="cp-meta-item">
          <div className="meta-label">Call Duration</div>
          <div className="meta-value">05:24</div>
        </div>
        <div className="cp-meta-item">
          <div className="meta-label">Status</div>
          <div className="meta-value connected">Connected</div>
        </div>
      </div>

      <button className="end-call-btn">End Call</button>

      <div className="cp-action-row">
        <button className="cp-ctrl-btn">🔇 Mute</button>
        <button className="cp-ctrl-btn">⏸ Hold</button>
        <button className="cp-ctrl-btn">📟 Dialpad</button>
        <button className="cp-ctrl-btn">📝 Notes</button>
      </div>

      <div className="cp-tabs">
        <button className="cp-tab active">Call Disposition</button>
        <button className="cp-tab">History</button>
      </div>

      <div className="cp-form">
        <label className="cp-label">Outcome</label>
        <select className="cp-select" value={outcome} onChange={e => setOutcome(e.target.value)}>
          <option>Interested</option>
          <option>Not Interested</option>
          <option>Callback</option>
          <option>No Answer</option>
          <option>Converted</option>
        </select>

        <label className="cp-label">Follow Up</label>
        <select className="cp-select" value={followUp} onChange={e => setFollowUp(e.target.value)}>
          <option>Tomorrow</option>
          <option>Today</option>
          <option>Next Week</option>
          <option>Next Month</option>
        </select>

        <label className="cp-label">Remarks</label>
        <textarea
          className="cp-textarea"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          rows={3}
        />
      </div>

      <div className="cp-footer-btns">
        <button className="cp-save-btn">Save</button>
        <button className="cp-next-btn">Next Call</button>
      </div>
    </div>
  );
};

export default CallPanel;
