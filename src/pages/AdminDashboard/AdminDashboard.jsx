// src/pages/AdminDashboard/AdminDashboard.jsx
// Admin dashboard - every number comes from the backend (GET /api/dashboard/admin).
// No mock / INITIAL_* data is used any more.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import StatsCard from '../../components/Cards/StatsCard';
import './AdminDashboard.css';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  FiUsers, FiUserCheck, FiUserX, FiTarget, FiPlusCircle, FiClock, FiPhoneCall,
  FiFileText, FiFile, FiCreditCard, FiTrendingUp, FiPercent, FiUpload, FiUserPlus,
  FiFilePlus, FiSend, FiArrowRight, FiRefreshCw,
} from 'react-icons/fi';
import { dashboardService } from '../../services/dashboardService';

const STATUS_COLORS = {
  New: '#2563eb',
  'In Progress': '#0891b2',
  Interested: '#16a34a',
  'Not Interested': '#dc2626',
  'Call Back': '#d97706',
  Converted: '#15803d',
  'Demo Scheduled': '#7c3aed',
};
const FALLBACK_COLORS = ['#7b1113', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#6b7280'];

const currency = (n) => {
  const v = Number(n || 0);
  return '₹' + (v >= 10000000 ? (v / 10000000).toFixed(2) + 'Cr' : v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v.toLocaleString('en-IN'));
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// monthlySales: [{year, month(1-12), sales}] -> chart rows for the selected period
function buildSales(monthlySales = [], period) {
  const map = new Map();
  monthlySales.forEach(({ year, month, sales }) => {
    let key; let label; let order;
    if (period === 'Yearly') { key = `${year}`; label = `${year}`; order = year * 100; }
    else if (period === 'Quarterly') { const q = Math.ceil(month / 3); key = `${year}-Q${q}`; label = `Q${q} ${String(year).slice(2)}`; order = year * 100 + q; }
    else { key = `${year}-${month}`; label = `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`; order = year * 100 + month; }
    const cur = map.get(key) || { month: label, sales: 0, order };
    cur.sales += Number(sales || 0);
    map.set(key, cur);
  });
  const rows = [...map.values()].sort((a, b) => a.order - b.order);
  return period === 'Monthly' ? rows.slice(-12) : rows;
}

const tooltipStyle = {
  fontFamily: 'Public Sans', fontSize: 12, borderRadius: 8,
  border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

const AdminDashboard = ({ onNavigate }) => {
  const [salesPeriod, setSalesPeriod] = useState('Monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setData(await dashboardService.getAdminDashboard());
    } catch (e) {
      setError(e.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const {
    overviewStats, leadStatusData, monthlySalesData, dailyCallsData,
    telecallerPerformanceData, districtPerformanceData, categoryPerformanceData,
  } = useMemo(() => {
    const s = data?.summary || {};
    const t = data?.today || {};
    const stats = [
      { label: 'Total Telecallers', value: s.totalTelecallers ?? 0, icon: <FiUsers size={22} />, color: '#7b1113' },
      { label: 'Active Telecallers', value: s.activeTelecallers ?? 0, icon: <FiUserCheck size={22} />, color: '#16a34a' },
      { label: 'Inactive Telecallers', value: s.inactiveTelecallers ?? 0, icon: <FiUserX size={22} />, color: '#dc2626' },
      { label: 'Total Leads', value: s.totalLeads ?? 0, icon: <FiTarget size={22} />, color: '#2563eb' },
      { label: 'New Leads Today', value: t.newLeads ?? 0, icon: <FiPlusCircle size={22} />, color: '#0891b2' },
      { label: 'Pending Follow-ups', value: s.followUps ?? 0, icon: <FiClock size={22} />, color: '#d97706' },
      { label: 'Calls Made Today', value: t.callsMade ?? 0, icon: <FiPhoneCall size={22} />, color: '#7c3aed' },
      { label: 'Quotations Created', value: s.quotations ?? 0, icon: <FiFileText size={22} />, color: '#0d9488' },
      { label: 'Agreements Signed', value: s.agreementsSigned ?? 0, icon: <FiFile size={22} />, color: '#4338ca' },
      { label: 'Payments Received', value: currency(s.paymentsCollected), icon: <FiCreditCard size={22} />, color: '#16a34a' },
      { label: 'Revenue', value: currency(s.revenue), icon: <FiTrendingUp size={22} />, color: '#7b1113' },
      { label: 'Conversion Rate', value: `${s.conversionRate ?? 0}%`, icon: <FiPercent size={22} />, color: '#dc2626' },
    ];

    const leadStatus = (data?.leadStatus || []).map((x, i) => ({
      name: x.status, value: x.count, color: STATUS_COLORS[x.status] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));

    const tcPerf = [...(data?.telecallerPerformance || [])]
      .map((r) => ({ name: r.fullName || r.username, calls: r.callsMade ?? 0, converted: r.clientsConverted ?? 0 }))
      .filter((r) => r.calls > 0 || r.converted > 0)
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 6);

    return {
      overviewStats: stats,
      leadStatusData: leadStatus,
      monthlySalesData: buildSales(data?.monthlySales, salesPeriod),
      dailyCallsData: data?.dailyCalls || [],
      telecallerPerformanceData: tcPerf,
      districtPerformanceData: data?.districtPerformance || [],
      categoryPerformanceData: data?.categoryPerformance || [],
    };
  }, [data, salesPeriod]);

  const quickActions = [
    { 
      label: 'Upload Leads', 
      icon: <FiUpload size={18} />, 
      color: '#7b1113',
      bgColor: '#fef2f2',
      page: 'leads',
    },
    { 
      label: 'Add Telecaller', 
      icon: <FiUserPlus size={18} />, 
      color: '#2563eb',
      bgColor: '#eff6ff',
      page: 'telecallers',
    },
    { 
      label: 'Create Quotation', 
      icon: <FiFileText size={18} />, 
      color: '#16a34a',
      bgColor: '#f0fdf4',
      page: 'quotations',
    },
    { 
      label: 'Create Agreement', 
      icon: <FiFilePlus size={18} />, 
      color: '#d97706',
      bgColor: '#fffbeb',
      page: 'agreements',
    },
    { 
      label: 'Send Broadcast', 
      icon: <FiSend size={18} />, 
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      page: 'communication',
    },
  ];

  const handleQuickAction = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Make stats cards clickable - FIXED with exact label matching
  const handleStatsCardClick = (label) => {
    console.log('Clicked card:', label); // Debug log
    
    const pageMap = {
      'Total Telecallers': 'telecallers',
      'Active Telecallers': 'telecallers',
      'Inactive Telecallers': 'telecallers',
      'Total Leads': 'leads',
      'New Leads Today': 'leads',
      'Pending Follow-ups': 'followups',
      'Calls Made Today': 'followups',
      'Quotations Created': 'quotations',
      'Agreements Signed': 'agreements',
      'Payments Received': 'payment',
      'Revenue': 'payment',
      'Conversion Rate': 'leads',
    };
    
    const page = pageMap[label];
    console.log('Navigating to page:', page); // Debug log
    
    if (page && onNavigate) {
      onNavigate(page);
    } else if (!page) {
      console.warn('No page mapping found for label:', label);
    } else if (!onNavigate) {
      console.warn('onNavigate function not provided');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="ad-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Live overview of telecallers, leads and business performance</p>
        </div>
        <button type="button" onClick={() => load(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}><FiRefreshCw /> Refresh</button>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {loading && !data && <div style={{ padding: 12, color: '#6b7280' }}>Loading live dashboard data...</div>}

      {/* Stats Grid - clickable */}
      <div className="ad-stats-grid">
        {overviewStats.map((s) => (
          <div 
            key={s.label} 
            className="ad-stats-card-wrapper"
            onClick={() => handleStatsCardClick(s.label)}
            style={{ cursor: 'pointer' }}
          >
            <StatsCard icon={s.icon} label={s.label} value={s.value} color={s.color} />
          </div>
        ))}
      </div>


      <div className="ad-three-column-row">
        {/* Monthly Sales Card */}
        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">Monthly Sales</span>
            <select
              className="period-select"
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Yearly</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8888aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} tickFormatter={currency} width={50} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="sales" fill="#7b1113" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Card */}
        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">Lead Status</span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
                  {leadStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={7}
                  formatter={(value, entry) => (
                    <span style={{ fontSize: 10.5, color: '#4a4a6a' }}>
                      {value} <strong style={{ color: '#1a1a2e' }}>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="ad-card ad-quick-actions-card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="ad-quick-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="ad-quick-action-btn"
                style={{ 
                  backgroundColor: action.bgColor,
                  borderColor: action.color,
                  color: action.color
                }}
                onClick={() => handleQuickAction(action.page)}
              >
                <span className="ad-quick-action-icon">{action.icon}</span>
                <span className="ad-quick-action-label">{action.label}</span>
                <FiArrowRight size={14} className="ad-quick-action-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ad-charts-row">
        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">Daily Calls (This Week)</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCallsData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8888aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="calls" stroke="#7b1113" strokeWidth={2.5} dot={{ fill: '#7b1113', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">Telecaller Performance</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telecallerPerformanceData} layout="vertical" margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8888aa' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#4a4a6a' }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="calls" name="Calls" fill="#2563eb" radius={[0, 6, 6, 0]} />
                <Bar dataKey="converted" name="Converted" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">District Performance</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtPerformanceData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="district" tick={{ fontSize: 10.5, fill: '#8888aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="leads" name="Leads" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="converted" name="Converted" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="ad-tables-row">
        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">District-wise Performance</span>
          </div>
          <table className="ad-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Leads</th>
                <th>Converted</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {districtPerformanceData.map((d) => (
                <tr key={d.district}>
                  <td>{d.district}</td>
                  <td>{Number(d.leads || 0).toLocaleString('en-IN')}</td>
                  <td>{d.converted}</td>
                  <td>{currency(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ad-card">
          <div className="card-header">
            <span className="card-title">Category-wise Performance</span>
          </div>
          <table className="ad-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Leads</th>
                <th>Converted</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformanceData.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{Number(c.leads || 0).toLocaleString('en-IN')}</td>
                  <td>{c.converted}</td>
                  <td>{Number(c.rate ?? 0).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;