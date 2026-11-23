import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  FiUsers, FiPhoneCall, FiRefreshCw, FiTrendingUp,
  FiFileText, FiDollarSign, FiCheckCircle, FiActivity,
  FiUserCheck, FiClock, FiBarChart2
} from "react-icons/fi";
import { dashboardService } from "../../services/dashboardService";
import "./Dashboard.css";

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setData(await dashboardService.getDashboard());
    } catch (e) {
      setError(e.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  const summary = data?.summary || {};
  const today = data?.today || {};
  const telecallers = data?.telecallerPerformance || [];

  const cards = useMemo(() => [
    { label: "Total Leads", value: summary.totalLeads ?? 0, icon: <FiUsers />, page: "leads", color: "#2563eb", bg: "#eff6ff" },
    { label: "Total Calls", value: summary.callsMade ?? 0, icon: <FiPhoneCall />, page: "callpanel", color: "#7b1113", bg: "#fdf2f2" },
    { label: "Connected Calls", value: summary.connectedCalls ?? 0, icon: <FiCheckCircle />, page: "reports", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Follow-ups", value: summary.followUps ?? 0, icon: <FiRefreshCw />, page: "followups", color: "#d97706", bg: "#fffbeb" },
    { label: "Converted Clients", value: summary.clientsConverted ?? 0, icon: <FiTrendingUp />, page: "clients", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Payments Collected", value: money(summary.paymentsCollected), icon: <FiDollarSign />, page: "payments", color: "#059669", bg: "#ecfdf5" },
    { label: "Quotations", value: summary.quotations ?? 0, icon: <FiFileText />, page: "quotations", color: "#db2777", bg: "#fdf2f8" },
    { label: "Conversion Rate", value: `${summary.conversionRate ?? 0}%`, icon: <FiActivity />, page: "reports", color: "#0891b2", bg: "#ecfeff" },
  ], [summary]);

  if (loading) {
    return <div className="role-dashboard db-loading">Loading live dashboard data...</div>;
  }

  return (
    <div className="role-dashboard">
      <div className="db-header">
        <div>
          <h1 className="db-title">Super Admin Dashboard</h1>
          <p className="db-subtitle">
            Live CRM overview, centralized telecaller monitoring, and overall business performance.
          </p>
          <div className="db-live"><span className="db-live-dot" />Auto-refreshing every 30 seconds</div>
        </div>
        <div className="db-actions">
          <button className="db-btn" onClick={() => onNavigate?.("telecallers")}>
            <FiUserCheck /> Telecallers
          </button>
          <button className="db-btn db-btn-primary" onClick={() => onNavigate?.("reports")}>
            <FiBarChart2 /> Full Reports
          </button>
          <button
            className="db-btn"
            disabled={refreshing}
            onClick={() => { setRefreshing(true); loadDashboard(true); }}
          >
            <FiRefreshCw /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="db-error">{error}</div>}

      <div className="db-summary-grid">
        {cards.map(card => (
          <div className="db-stat-card" key={card.label} onClick={() => onNavigate?.(card.page)}>
            <div className="db-stat-top">
              <span className="db-stat-icon" style={{ color: card.color, background: card.bg }}>{card.icon}</span>
            </div>
            <div className="db-stat-value">{card.value}</div>
            <div className="db-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="db-layout">
        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">7-Day Calling Performance</h3>
            <p className="db-card-desc">Total and connected calls across the CRM.</p>
          </div>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.performanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" name="Calls Made" stroke="#7b1113" strokeWidth={3} />
                <Line type="monotone" dataKey="connected" name="Connected" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">Today's CRM Activity</h3>
            <p className="db-card-desc">Real-time activity recorded today.</p>
          </div>
          <div className="db-today-list">
            {[
              ["Calls Made", today.callsMade],
              ["Connected Calls", today.connectedCalls],
              ["Missed Calls", today.missedCalls],
              ["New Leads", today.newLeads],
              ["Follow-ups", today.followUps],
              ["Converted", today.clientsConverted],
              ["Payments", money(today.paymentsCollected)],
            ].map(([label, value]) => (
              <div className="db-today-row" key={label}><span>{label}</span><b>{value ?? 0}</b></div>
            ))}
          </div>
        </div>
      </div>

      <div className="db-layout">
        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">Lead Status Distribution</h3>
            <p className="db-card-desc">Shows how the entire CRM pipeline is currently distributed.</p>
          </div>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.leadStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Leads" fill="#7b1113" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">Recent Call Activity</h3>
            <p className="db-card-desc">Latest calls recorded by the CRM team.</p>
          </div>
          <div className="db-call-list">
            {(data?.recentCalls || []).slice(0, 7).map(call => (
              <div className="db-call-item" key={call.id}>
                <div>
                  <div className="db-call-name">{call.leadName}</div>
                  <div className="db-call-meta">
                    {call.agentName || call.agentUsername || "Telecaller"} · {call.outcome || call.status || "Recorded"}
                  </div>
                </div>
                <span className="db-call-status">{call.status || "Recorded"}</span>
              </div>
            ))}
            {!data?.recentCalls?.length && <div className="db-empty">No call activity found.</div>}
          </div>
        </div>
      </div>

      <div className="db-card db-section">
        <div className="db-card-head">
          <h3 className="db-card-title">Telecaller Performance Monitor</h3>
          <p className="db-card-desc">Compare live workload, calling activity, conversion, and payment collection from one place.</p>
        </div>
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Telecaller</th><th>Leads</th><th>Calls</th><th>Today</th>
                <th>Connected</th><th>Converted</th><th>Conversion</th><th>Payments</th>
              </tr>
            </thead>
            <tbody>
              {telecallers.map(row => (
                <tr key={row.id || row.username}>
                  <td className="db-name">{row.fullName}<small>{row.username}</small></td>
                  <td>{row.totalLeads ?? 0}</td>
                  <td>{row.callsMade ?? 0}</td>
                  <td>{row.todayCalls ?? 0}</td>
                  <td>{row.connectedCalls ?? 0}</td>
                  <td>{row.clientsConverted ?? 0}</td>
                  <td className="db-rate">{row.conversionRate ?? 0}%</td>
                  <td>{money(row.paymentsCollected)}</td>
                </tr>
              ))}
              {!telecallers.length && (
                <tr><td colSpan="8" className="db-empty">No telecaller performance data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
