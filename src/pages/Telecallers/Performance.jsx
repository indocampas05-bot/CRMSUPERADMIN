// src/pages/Telecallers/Performance.jsx
import React from 'react';

const currency = (n) => '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n.toLocaleString('en-IN'));

const Performance = ({ telecallers }) => {
  return (
    <div className="tc-section">
      <p className="tc-section-hint">Live snapshot of every telecaller's calls, follow-ups, conversions, revenue, target achievement and attendance.</p>

      <div className="tc-table-card">
        <table className="tc-table">
          <thead>
            <tr>
              <th>Telecaller</th>
              <th>Calls Today</th>
              <th>Follow-ups</th>
              <th>Conversions</th>
              <th>Revenue</th>
              <th>Target</th>
              <th>Target Achieved</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {telecallers.map((t) => {
              const achieved = t.target ? Math.min(100, Math.round((t.performance.conversions / t.target) * 100)) : 0;
              return (
                <tr key={t.id}>
                  <td className="cell-name">{t.name}</td>
                  <td>{t.performance.callsToday}</td>
                  <td>{t.performance.followups}</td>
                  <td>{t.performance.conversions}</td>
                  <td>{currency(t.performance.revenue)}</td>
                  <td>{t.target}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${achieved}%` }} /></div>
                      <span>{achieved}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${t.performance.attendance >= 90 ? 'status-active' : t.performance.attendance >= 75 ? 'status-warning' : 'status-inactive'}`}>
                      {t.performance.attendance}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Performance;
