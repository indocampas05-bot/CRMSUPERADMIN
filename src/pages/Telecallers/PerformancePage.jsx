// src/pages/Telecallers/PerformancePage.jsx
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FiDownload,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiPercent,
  FiTrendingUp,
  FiBarChart2,
  FiBookOpen,
  FiThumbsUp,
  FiVideo,
  FiArrowLeft,
  FiX,
  FiUsers,
  FiClock,
  FiCalendar,
} from 'react-icons/fi';
import './PerformancePage.css';

const PerformancePage = ({ telecallers, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Get unique districts
  const allDistricts = useMemo(() => {
    const districts = new Set();
    telecallers.forEach(t => t.districts.forEach(d => districts.add(d)));
    return ['All', ...Array.from(districts).sort()];
  }, [telecallers]);

  // Performance data with all metrics
  const performanceData = useMemo(() => {
    return telecallers.map(t => {
      const perf = t.performance || {};
      
      const totalCalls = perf.callsToday || 0;
      const connectedCalls = perf.connectedCalls || Math.floor(totalCalls * 0.65);
      const notConnected = totalCalls - connectedCalls;
      const conversionRate = totalCalls > 0 ? ((perf.conversions || 0) / totalCalls * 100).toFixed(1) : 0;
      const interestedRate = totalCalls > 0 ? ((perf.interestedLeads || 0) / totalCalls * 100).toFixed(1) : 0;
      
      return {
        id: t.id,
        name: t.name,
        districts: t.districts,
        schoolsCreated: perf.schoolsCreated || 0,
        callsMade: totalCalls,
        invalidNumbers: perf.invalidNumbers || 0,
        callsNotConnected: notConnected,
        callsConnected: connectedCalls,
        alreadyUsingSoftware: perf.alreadyUsingSoftware || 0,
        profileShared: perf.profileShared || 0,
        schoolClosed: perf.schoolClosed || 0,
        noRequirement: perf.noRequirement || 0,
        followupsCompleted: perf.followupsCompleted || 0,
        interestedLeads: perf.interestedLeads || 0,
        conversions: perf.conversions || 0,
        demoScheduled: perf.demoScheduled || 0,
        demoConducted: perf.demoConducted || 0,
        conversionRate: conversionRate,
        interestedRate: interestedRate,
        totalLeads: perf.totalLeads || 0,
        revenue: perf.revenue || 0,
        attendance: perf.attendance || 0,
      };
    });
  }, [telecallers]);

  // Filter and sort
  const filteredData = useMemo(() => {
    let data = performanceData;
    
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      data = data.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.districts.some(d => d.toLowerCase().includes(q))
      );
    }
    
    if (selectedDistrict !== 'All') {
      data = data.filter(t => t.districts.includes(selectedDistrict));
    }
    
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
      'Revenue (₹)': t.revenue,
      'Attendance (%)': t.attendance,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Telecaller Performance');
    
    const colWidths = [
      { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 15 },
      { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 },
      { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
      { wch: 18 },
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
      totalRevenue: filteredData.reduce((sum, t) => sum + t.revenue, 0),
    };
  }, [filteredData]);

  return (
    <div className="performance-page">
      {/* Header */}
      <div className="perf-page-header">
        <div className="perf-page-header-left">
          <button className="perf-page-back" onClick={onClose}>
            <FiArrowLeft /> Back
          </button>
          <div>
            <h1 className="perf-page-title">📊 Telecaller Performance Dashboard</h1>
            <p className="perf-page-subtitle">Detailed performance metrics for all telecallers</p>
          </div>
        </div>
        <div className="perf-page-header-right">
          <button className="perf-page-export" onClick={handleExport}>
            <FiDownload /> Export Excel
          </button>
          <button className="perf-page-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="perf-page-summary">
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FiPhone />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.totalCalls.toLocaleString()}</div>
              <div className="perf-summary-label">Total Calls</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <FiCheckCircle />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.totalConversions}</div>
              <div className="perf-summary-label">Conversions</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <FiThumbsUp />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.totalInterested}</div>
              <div className="perf-summary-label">Interested</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <FiPercent />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.avgConversionRate}%</div>
              <div className="perf-summary-label">Avg Conversion Rate</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#fae8ff', color: '#7c3aed' }}>
              <FiBookOpen />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.totalSchools}</div>
              <div className="perf-summary-label">Schools Created</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#fce4ec', color: '#d32f2f' }}>
              <FiVideo />
            </div>
            <div>
              <div className="perf-summary-number">{summaryStats.totalDemos}</div>
              <div className="perf-summary-label">Demos Conducted</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              <FiTrendingUp />
            </div>
            <div>
              <div className="perf-summary-number">₹{(summaryStats.totalRevenue/100000).toFixed(1)}L</div>
              <div className="perf-summary-label">Total Revenue</div>
            </div>
          </div>
          <div className="perf-summary-item">
            <div className="perf-summary-icon" style={{ background: '#fff3e0', color: '#e65100' }}>
              <FiUsers />
            </div>
            <div>
              <div className="perf-summary-number">{filteredData.length}</div>
              <div className="perf-summary-label">Telecallers</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="perf-page-toolbar">
        <div className="perf-page-search">
          <FiSearch />
          <input
            placeholder="Search by name, ID or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="perf-page-filter"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          {allDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="perf-page-clear" onClick={() => {
          setSearch('');
          setSelectedDistrict('All');
        }}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="perf-page-table-wrap">
        <table className="perf-page-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Telecaller
                {sortField === 'name' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('schoolsCreated')} className="sortable">
                Schools
                {sortField === 'schoolsCreated' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('callsMade')} className="sortable">
                Calls Made
                {sortField === 'callsMade' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Invalid</th>
              <th>Not Connected</th>
              <th onClick={() => handleSort('callsConnected')} className="sortable">
                Connected
                {sortField === 'callsConnected' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Using Software</th>
              <th>Profile Shared</th>
              <th>Closed</th>
              <th>No Need</th>
              <th onClick={() => handleSort('followupsCompleted')} className="sortable">
                Follow-ups
                {sortField === 'followupsCompleted' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('interestedLeads')} className="sortable">
                Interested
                {sortField === 'interestedLeads' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th onClick={() => handleSort('conversions')} className="sortable">
                Conversions
                {sortField === 'conversions' && (sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
              </th>
              <th>Demo Scheduled</th>
              <th>Demo Conducted</th>
              <th>Conversion Rate</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="perf-cell-name">
                    <div className="perf-cell-name-text">{t.name}</div>
                    <div className="perf-cell-id">{t.id}</div>
                    <div className="perf-cell-districts">
                      {t.districts.map(d => (
                        <span key={d} className="perf-district-chip">{d}</span>
                      ))}
                    </div>
                  </div>
                </td>
                <td>{t.schoolsCreated}</td>
                <td>{t.callsMade}</td>
                <td className="perf-cell-warning">{t.invalidNumbers}</td>
                <td className="perf-cell-warning">{t.callsNotConnected}</td>
                <td className="perf-cell-success">{t.callsConnected}</td>
                <td>{t.alreadyUsingSoftware}</td>
                <td>{t.profileShared}</td>
                <td className="perf-cell-warning">{t.schoolClosed}</td>
                <td>{t.noRequirement}</td>
                <td>{t.followupsCompleted}</td>
                <td className="perf-cell-interest">{t.interestedLeads}</td>
                <td className="perf-cell-conversion">{t.conversions}</td>
                <td>{t.demoScheduled}</td>
                <td>{t.demoConducted}</td>
                <td>
                  <span className={`perf-rate-badge ${t.conversionRate >= 10 ? 'perf-rate-high' : t.conversionRate >= 5 ? 'perf-rate-medium' : 'perf-rate-low'}`}>
                    {t.conversionRate}%
                  </span>
                </td>
                <td className="perf-cell-revenue">₹{(t.revenue/1000).toFixed(1)}K</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="17" className="perf-page-empty">
                  No telecallers match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="perf-page-footer">
        <span>Showing {filteredData.length} of {performanceData.length} telecallers</span>
        <button className="perf-page-export-btn" onClick={handleExport}>
          <FiDownload /> Export to Excel
        </button>
      </div>
    </div>
  );
};

export default PerformancePage;