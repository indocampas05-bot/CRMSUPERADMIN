// src/pages/Telecallers/TelecallerPerformanceDetails.jsx
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FiDownload,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPercent,
  FiTrendingUp,
  FiAward,
  FiBarChart2,
  FiUsers,
  FiBookOpen,
  FiMonitor,
  FiCalendar as FiCalendarIcon,
  FiStar,
  FiThumbsUp,
  FiDollarSign,
  FiVideo,
} from 'react-icons/fi';

const TelecallerPerformanceDetails = ({ telecallers }) => {
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  const allDistricts = useMemo(() => {
    const districts = new Set();
    telecallers.forEach(t => t.districts.forEach(d => districts.add(d)));
    return ['All', ...Array.from(districts).sort()];
  }, [telecallers]);

  // Performance data with all metrics
  const performanceData = useMemo(() => {
    return telecallers.map(t => {
      // Use existing performance data or generate mock data
      const perf = t.performance || {};
      
      // Calculate derived metrics
      const totalCalls = perf.callsToday || 0;
      const connectedCalls = perf.connectedCalls || Math.floor(totalCalls * 0.65);
      const notConnected = totalCalls - connectedCalls;
      const conversionRate = totalCalls > 0 ? ((perf.conversions || 0) / totalCalls * 100).toFixed(1) : 0;
      const interestedRate = totalCalls > 0 ? ((perf.interestedLeads || 0) / totalCalls * 100).toFixed(1) : 0;
      
      return {
        id: t.id,
        name: t.name,
        districts: t.districts,
        // Schools & Education
        schoolsCreated: perf.schoolsCreated || Math.floor(Math.random() * 30) + 5,
        // Call Metrics
        callsMade: totalCalls,
        invalidNumbers: perf.invalidNumbers || Math.floor(Math.random() * 10) + 1,
        callsNotConnected: notConnected,
        callsConnected: connectedCalls,
        // Lead Status
        alreadyUsingSoftware: perf.alreadyUsingSoftware || Math.floor(Math.random() * 15) + 3,
        profileShared: perf.profileShared || Math.floor(Math.random() * 20) + 5,
        schoolClosed: perf.schoolClosed || Math.floor(Math.random() * 5) + 1,
        noRequirement: perf.noRequirement || Math.floor(Math.random() * 15) + 5,
        // Follow-ups & Conversions
        followupsCompleted: perf.followupsCompleted || Math.floor(Math.random() * 25) + 5,
        interestedLeads: perf.interestedLeads || Math.floor(Math.random() * 25) + 5,
        conversions: perf.conversions || Math.floor(Math.random() * 10) + 1,
        // Demos
        demoScheduled: perf.demoScheduled || Math.floor(Math.random() * 12) + 2,
        demoConducted: perf.demoConducted || Math.floor(Math.random() * 8) + 1,
        // Derived Metrics
        conversionRate: conversionRate,
        interestedRate: interestedRate,
        totalLeads: perf.totalLeads || Math.floor(Math.random() * 50) + 20,
      };
    });
  }, [telecallers]);

  // Filter and sort
  const filteredData = useMemo(() => {
    let data = performanceData;
    
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      data = data.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.districts.some(d => d.toLowerCase().includes(q))
      );
    }
    
    // District filter
    if (selectedDistrict !== 'All') {
      data = data.filter(t => t.districts.includes(selectedDistrict));
    }
    
    // Sort
    data.sort((a, b) => {
      let aVal = a[sortField] || 0;
      let bVal = b[sortField] || 0;
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return data;
  }, [performanceData, search, selectedDistrict, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredData.map(t => ({
      'Telecaller Name': t.name,
      'Employee ID': t.id,
      'Assigned District': t.districts.join(', '),
      'Schools Created': t.schoolsCreated,
      'Calls Made': t.callsMade,
      'Invalid/Non-Existing Numbers': t.invalidNumbers,
      'Calls Not Connected': t.callsNotConnected,
      'Calls Connected': t.callsConnected,
      'Already Using Software': t.alreadyUsingSoftware,
      'Profile Shared': t.profileShared,
      'School Closed': t.schoolClosed,
      'No Requirement': t.noRequirement,
      'Follow-ups Completed': t.followupsCompleted,
      'Interested Leads': t.interestedLeads,
      'Conversions (Payments Received)': t.conversions,
      'Demo Scheduled': t.demoScheduled,
      'Demo Conducted': t.demoConducted,
      'Conversion Rate (%)': t.conversionRate,
      'Interested Rate (%)': t.interestedRate,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Telecaller Performance');
    
    // Auto column widths
    const colWidths = [
      { wch: 25 }, // Telecaller Name
      { wch: 15 }, // Employee ID
      { wch: 30 }, // Assigned District
      { wch: 18 }, // Schools Created
      { wch: 15 }, // Calls Made
      { wch: 25 }, // Invalid/Non-Existing Numbers
      { wch: 20 }, // Calls Not Connected
      { wch: 18 }, // Calls Connected
      { wch: 22 }, // Already Using Software
      { wch: 18 }, // Profile Shared
      { wch: 18 }, // School Closed
      { wch: 18 }, // No Requirement
      { wch: 22 }, // Follow-ups Completed
      { wch: 18 }, // Interested Leads
      { wch: 30 }, // Conversions (Payments Received)
      { wch: 18 }, // Demo Scheduled
      { wch: 18 }, // Demo Conducted
      { wch: 20 }, // Conversion Rate
      { wch: 20 }, // Interested Rate
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Telecaller_Performance_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return null;
    
    return {
      totalCalls: filteredData.reduce((sum, t) => sum + t.callsMade, 0),
      totalConversions: filteredData.reduce((sum, t) => sum + t.conversions, 0),
      totalInterested: filteredData.reduce((sum, t) => sum + t.interestedLeads, 0),
      totalFollowups: filteredData.reduce((sum, t) => sum + t.followupsCompleted, 0),
      avgConversionRate: (filteredData.reduce((sum, t) => sum + parseFloat(t.conversionRate), 0) / total).toFixed(1),
      totalSchools: filteredData.reduce((sum, t) => sum + t.schoolsCreated, 0),
      totalDemos: filteredData.reduce((sum, t) => sum + t.demoConducted, 0),
    };
  }, [filteredData]);

  return (
    <div className="tc-performance-details">
      <div className="perf-header">
        <div>
          <h2 className="perf-title">📊 Telecaller Performance Details</h2>
          <p className="perf-subtitle">Detailed performance metrics for all telecallers</p>
        </div>
        <button className="export-btn" onClick={handleExport}>
          <FiDownload /> Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="perf-summary-grid">
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FiPhone />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.totalCalls.toLocaleString()}</div>
              <div className="perf-summary-label">Total Calls</div>
            </div>
          </div>
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <FiCheckCircle />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.totalConversions}</div>
              <div className="perf-summary-label">Total Conversions</div>
            </div>
          </div>
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <FiThumbsUp />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.totalInterested}</div>
              <div className="perf-summary-label">Interested Leads</div>
            </div>
          </div>
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <FiPercent />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.avgConversionRate}%</div>
              <div className="perf-summary-label">Avg Conversion Rate</div>
            </div>
          </div>
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#fae8ff', color: '#7c3aed' }}>
              <FiBookOpen />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.totalSchools}</div>
              <div className="perf-summary-label">Total Schools Created</div>
            </div>
          </div>
          <div className="perf-summary-card">
            <div className="perf-summary-icon" style={{ background: '#fce4ec', color: '#d32f2f' }}>
              <FiVideo />
            </div>
            <div>
              <div className="perf-summary-value">{summaryStats.totalDemos}</div>
              <div className="perf-summary-label">Demos Conducted</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="perf-toolbar">
        <div className="perf-search-box">
          <FiSearch />
          <input
            placeholder="Search by name, ID or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="perf-filter-select"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          {allDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="perf-filter-clear" onClick={() => {
          setSearch('');
          setSelectedDistrict('All');
        }}>
          Clear Filters
        </button>
      </div>

      {/* Performance Table */}
      <div className="perf-table-container">
        <table className="perf-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Telecaller Name
                {sortField === 'name' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('schoolsCreated')} className="sortable">
                Schools Created
                {sortField === 'schoolsCreated' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('callsMade')} className="sortable">
                Calls Made
                {sortField === 'callsMade' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Invalid Numbers</th>
              <th>Calls Not Connected</th>
              <th onClick={() => handleSort('callsConnected')} className="sortable">
                Calls Connected
                {sortField === 'callsConnected' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Already Using Software</th>
              <th>Profile Shared</th>
              <th>School Closed</th>
              <th>No Requirement</th>
              <th onClick={() => handleSort('followupsCompleted')} className="sortable">
                Follow-ups Completed
                {sortField === 'followupsCompleted' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('interestedLeads')} className="sortable">
                Interested Leads
                {sortField === 'interestedLeads' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('conversions')} className="sortable">
                Conversions
                {sortField === 'conversions' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Demo Scheduled</th>
              <th>Demo Conducted</th>
              <th>Conversion Rate</th>
              <th>Interested Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((t) => (
              <tr key={t.id}>
                <td className="cell-name">
                  <div className="cell-name-content">
                    <span>{t.name}</span>
                    <span className="cell-id">{t.id}</span>
                  </div>
                  <div className="cell-districts">
                    {t.districts.map(d => (
                      <span key={d} className="cell-district-chip">{d}</span>
                    ))}
                  </div>
                </td>
                <td>{t.schoolsCreated}</td>
                <td>{t.callsMade}</td>
                <td className="cell-warning">{t.invalidNumbers}</td>
                <td className="cell-warning">{t.callsNotConnected}</td>
                <td className="cell-success">{t.callsConnected}</td>
                <td>{t.alreadyUsingSoftware}</td>
                <td>{t.profileShared}</td>
                <td className="cell-warning">{t.schoolClosed}</td>
                <td>{t.noRequirement}</td>
                <td>{t.followupsCompleted}</td>
                <td className="cell-interest">{t.interestedLeads}</td>
                <td className="cell-conversion">{t.conversions}</td>
                <td>{t.demoScheduled}</td>
                <td>{t.demoConducted}</td>
                <td>
                  <span className={`rate-badge ${t.conversionRate >= 10 ? 'rate-high' : t.conversionRate >= 5 ? 'rate-medium' : 'rate-low'}`}>
                    {t.conversionRate}%
                  </span>
                </td>
                <td>
                  <span className={`rate-badge ${t.interestedRate >= 20 ? 'rate-high' : t.interestedRate >= 10 ? 'rate-medium' : 'rate-low'}`}>
                    {t.interestedRate}%
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="17" className="perf-empty">
                  No telecallers match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="perf-footer">
        <span>Showing {filteredData.length} of {performanceData.length} telecallers</span>
        <div className="perf-footer-actions">
          <button className="perf-export-csv" onClick={handleExport}>
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelecallerPerformanceDetails;