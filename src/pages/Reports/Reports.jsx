import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  FaUsers,
  FaPhone,
  FaRedo,
  FaTrophy,
  FaSearch,
  FaFileExcel,
  FaPrint,
  FaCheckCircle,
  FaPhoneSlash,
  FaSyncAlt,
  FaChartBar,
  FaArrowUp,
  FaBullseye,
} from "react-icons/fa";
import { reportService } from "../../services/reportService";
import "./Reports.css";

const PERIODS = [
  { value: "TODAY", label: "Today" },
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "ALL", label: "All Time" },
];

const CHART_COLORS = [
  "#7b1113",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];

const exportCsv = (rows, filename) => {
  if (!rows?.length) return;

  const keys = Object.keys(rows[0] || {});

  const csv = [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map((key) => {
          const value = String(row[key] ?? "").replaceAll('"', '""');
          return `"${value}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const ChartCard = ({
  title,
  description,
  icon,
  children,
  className = "",
}) => {
  return (
    <div className={`rp-panel rp-chart-card ${className}`}>
      <div className="rp-chart-header">
        <div className="rp-chart-heading">
          <div className="rp-chart-icon">
            {icon}
          </div>

          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rp-custom-tooltip">
      <div className="rp-tooltip-title">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          className="rp-tooltip-row"
          key={`${item.name}-${index}`}
        >
          <span>{item.name}</span>
          <b>{item.value ?? 0}</b>
        </div>
      ))}
    </div>
  );
};

const ReportView = ({ admin = true }) => {
  const [period, setPeriod] = useState("MONTH");
  const [report, setReport] = useState(null);
  const [telecallers, setTelecallers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      if (admin) {
        const [overall, rows] = await Promise.all([
          reportService.getOverallReport(period),
          reportService.getTelecallerReports(period),
        ]);

        setReport(overall);
        setTelecallers(
          Array.isArray(rows) ? rows : []
        );

        setSelectedUsername("");
        setSelectedReport(null);
      } else {
        const myReport =
          await reportService.getMyReport(period);

        setReport(myReport);
      }
    } catch (e) {
      setError(
        e.message || "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const openTelecaller = async (username) => {
    if (!username) {
      setSelectedUsername("");
      setSelectedReport(null);
      return;
    }

    setLoadingDetail(true);
    setError("");

    try {
      setSelectedUsername(username);

      const detail =
        await reportService.getTelecallerReport(
          username,
          period
        );

      setSelectedReport(detail);
    } catch (e) {
      setError(
        e.message ||
          "Unable to load telecaller report."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const activeReport =
    selectedReport || report;

  const summary =
    activeReport?.summary || {};

  const today =
    activeReport?.today || {};

  const leadStatus =
    Array.isArray(activeReport?.leadStatus)
      ? activeReport.leadStatus
      : [];

  const outcomes =
    Array.isArray(activeReport?.callOutcomes)
      ? activeReport.callOutcomes
      : [];

  /*
   * --------------------------------------------------
   * MAIN PERFORMANCE DATA
   * Used by professional bar chart
   * --------------------------------------------------
   */
  const performanceData = [
    {
      metric: "Total Leads",
      value:
        summary.totalLeads ??
        summary.assignedLeads ??
        0,
    },
    {
      metric: "Calls Made",
      value: summary.callsMade ?? 0,
    },
    {
      metric: "Connected",
      value: summary.connectedCalls ?? 0,
    },
    {
      metric: "Follow-ups",
      value: summary.followUps ?? 0,
    },
    {
      metric: "Interested",
      value: summary.interestedLeads ?? 0,
    },
    {
      metric: "Converted",
      value: summary.clientsConverted ?? 0,
    },
  ];

  /*
   * --------------------------------------------------
   * TODAY ACTIVITY DATA
   * --------------------------------------------------
   */
  const todayPerformanceData = [
    {
      metric: "Calls Made",
      value: today.callsMade ?? 0,
    },
    {
      metric: "Connected",
      value: today.connectedCalls ?? 0,
    },
    {
      metric: "Missed",
      value: today.missedCalls ?? 0,
    },
    {
      metric: "New Leads",
      value:
        today.newLeadsContacted ?? 0,
    },
    {
      metric: "Follow-ups",
      value:
        today.followUpsCompleted ?? 0,
    },
    {
      metric: "Interested",
      value: today.interestedLeads ?? 0,
    },
  ];

  /*
   * --------------------------------------------------
   * SUPER ADMIN TELECALLER COMPARISON
   * --------------------------------------------------
   */
  const telecallerPerformanceData =
    useMemo(() => {
      return telecallers.map((row) => {
        const item =
          row.report?.summary ||
          row.summary ||
          {};

        return {
          name:
            row.fullName ||
            row.username ||
            "Unknown",
          calls:
            item.callsMade ?? 0,
          connected:
            item.connectedCalls ?? 0,
          converted:
            item.clientsConverted ?? 0,
          conversionRate:
            item.conversionRate ?? 0,
        };
      });
    }, [telecallers]);

  /*
   * --------------------------------------------------
   * TELECALLER TABLE FILTER
   * --------------------------------------------------
   */
  const filteredTelecallers =
    useMemo(() => {
      const needle =
        search.trim().toLowerCase();

      if (!needle) {
        return telecallers;
      }

      return telecallers.filter((row) =>
        [
          row.fullName,
          row.username,
          row.employeeId,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(needle)
          )
      );
    }, [search, telecallers]);

  const cards = [
    {
      label: "Total Leads",
      value:
        summary.totalLeads ??
        summary.assignedLeads ??
        0,
      icon: <FaUsers />,
      color: "#7b1113",
    },
    {
      label: "Calls Made",
      value:
        summary.callsMade ?? 0,
      icon: <FaPhone />,
      color: "#2563eb",
    },
    {
      label: "Follow-ups",
      value:
        summary.followUps ?? 0,
      icon: <FaRedo />,
      color: "#d97706",
    },
    {
      label: "Connected Calls",
      value:
        summary.connectedCalls ?? 0,
      icon: <FaCheckCircle />,
      color: "#16a34a",
    },
    {
      label: "Missed Calls",
      value:
        summary.missedCalls ?? 0,
      icon: <FaPhoneSlash />,
      color: "#dc2626",
    },
    {
      label: "Interested Leads",
      value:
        summary.interestedLeads ?? 0,
      icon: <FaBullseye />,
      color: "#7c3aed",
    },
    {
      label: "Clients Converted",
      value:
        summary.clientsConverted ?? 0,
      icon: <FaTrophy />,
      color: "#0891b2",
    },
    {
      label: "Conversion Rate",
      value:
        `${summary.conversionRate ?? 0}%`,
      icon: <FaArrowUp />,
      color: "#db2777",
    },
  ];

  if (loading) {
    return (
      <div className="rp-root">
        <div className="rp-panel rp-loading-panel">
          <FaSyncAlt className="rp-loading-icon" />
          <div>
            <h3>Loading Report Data</h3>
            <p>
              Fetching the latest performance
              information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-root">

      {/* ============================================
          PAGE HEADER
      ============================================ */}
      <div className="rp-page-header">
        <div>
          <div className="rp-title-row">
            <div className="rp-main-title-icon">
              <FaChartBar />
            </div>

            <div>
              <h1 className="rp-page-title">
                {admin
                  ? "Reports & Performance Analytics"
                  : "My Performance Reports"}
              </h1>

              <p className="rp-breadcrumb">
                {admin
                  ? "Monitor, compare and analyse telecaller performance from one centralized dashboard."
                  : "Track your activity, lead performance and conversion results."}
              </p>
            </div>
          </div>
        </div>

        <div className="rp-header-actions">

          <select
            className="rp-select"
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
          >
            {PERIODS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>

          <button
            className="rp-btn rp-btn-outline"
            onClick={load}
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            className="rp-btn rp-btn-outline"
            onClick={() =>
              exportCsv(
                cards.map((card) => ({
                  Metric: card.label,
                  Value: card.value,
                })),
                "reports-summary.csv"
              )
            }
          >
            <FaFileExcel />
            Export
          </button>

          <button
            className="rp-btn rp-btn-primary"
            onClick={() => window.print()}
          >
            <FaPrint />
            Print
          </button>

        </div>
      </div>

      {error && (
        <div className="rp-error">
          {error}
        </div>
      )}

      {/* ============================================
          SUPER ADMIN TELECALLER COMPARISON CHART
      ============================================ */}
      {admin &&
        !selectedUsername &&
        telecallerPerformanceData.length > 0 && (
          <ChartCard
            className="rp-full-chart"
            icon={<FaUsers />}
            title="Telecaller Performance Comparison"
            description="Compare calling activity, successful connections and client conversions across all telecallers for the selected reporting period."
          >
            <div className="rp-chart rp-comparison-chart">
              <ResponsiveContainer
                width="100%"
                height={380}
              >
                <BarChart
                  data={telecallerPerformanceData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Legend />

                  <Bar
                    dataKey="calls"
                    name="Calls Made"
                    fill="#7b1113"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="connected"
                    name="Connected"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="converted"
                    name="Converted"
                    fill="#16a34a"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

      {/* ============================================
          TELECALLER TABLE
      ============================================ */}
      {admin && (
        <div className="rp-panel">
          <div className="rp-panel-header">

            <div>
              <h3>
                Individual Telecaller Reports
              </h3>

              <p>
                Search and select a telecaller to
                view detailed individual performance.
              </p>
            </div>

            <div className="rp-search-wrap">
              <FaSearch />

              <input
                placeholder="Search telecaller"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

          </div>

          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Telecaller</th>
                  <th>Leads</th>
                  <th>Calls</th>
                  <th>Connected</th>
                  <th>Follow-ups</th>
                  <th>Converted</th>
                  <th>Conversion</th>
                </tr>
              </thead>

              <tbody>
                {filteredTelecallers.map((row) => {
                  const item =
                    row.report?.summary ||
                    row.summary ||
                    {};

                  return (
                    <tr
                      key={
                        row.id ||
                        row.username
                      }
                      className={
                        selectedUsername ===
                        row.username
                          ? "rp-selected-row"
                          : ""
                      }
                      onClick={() =>
                        openTelecaller(
                          row.username
                        )
                      }
                    >
                      <td>
                        <b>
                          {row.fullName ||
                            row.username}
                        </b>

                        <small>
                          {row.username}
                        </small>
                      </td>

                      <td>
                        {item.assignedLeads ??
                          item.totalLeads ??
                          0}
                      </td>

                      <td>
                        {item.callsMade ?? 0}
                      </td>

                      <td>
                        {item.connectedCalls ?? 0}
                      </td>

                      <td>
                        {item.followUps ?? 0}
                      </td>

                      <td>
                        {item.clientsConverted ?? 0}
                      </td>

                      <td>
                        <span className="rp-conversion-badge">
                          {item.conversionRate ?? 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!filteredTelecallers.length && (
                  <tr>
                    <td
                      colSpan="7"
                      className="rp-empty"
                    >
                      No telecallers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loadingDetail && (
            <div className="rp-loading-inline">
              <FaSyncAlt />
              Loading individual report...
            </div>
          )}
        </div>
      )}

      {/* ============================================
          SELECTED TELECALLER
      ============================================ */}
      {selectedUsername && (
        <div className="rp-panel rp-selected-report">
          <div>
            <span>
              Viewing detailed individual report
            </span>

            <h3>
              {selectedUsername}
            </h3>
          </div>

          {admin && (
            <button
              className="rp-link-btn"
              onClick={() =>
                openTelecaller("")
              }
            >
              Back to Overall Report
            </button>
          )}
        </div>
      )}

      {/* ============================================
          KPI CARDS
      ============================================ */}
      <div className="rp-section-heading">
        <div>
          <h2>Performance Overview</h2>

          <p>
            A quick summary of the most important
            performance indicators for the selected
            period.
          </p>
        </div>
      </div>

      <div className="rp-cards-grid">
        {cards.map((card) => (
          <div
            className="stats-card"
            key={card.label}
          >
            <div
              className="stat-icon"
              style={{
                color: card.color,
              }}
            >
              {card.icon}
            </div>

            <div className="stat-info">
              <div className="stat-label">
                {card.label}
              </div>

              <div className="stat-value">
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================
          MAIN PERFORMANCE CHART
      ============================================ */}
      <ChartCard
        className="rp-full-chart"
        icon={<FaChartBar />}
        title="Overall Performance Breakdown"
        description="This chart provides a complete view of lead activity, calling performance, follow-up activity, interested prospects and final conversions."
      >
        <div className="rp-chart">
          <ResponsiveContainer
            width="100%"
            height={370}
          >
            <BarChart
              data={performanceData}
              margin={{
                top: 30,
                right: 20,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="metric"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Bar
                dataKey="value"
                name="Performance"
                radius={[8, 8, 0, 0]}
                maxBarSize={70}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                />

                {performanceData.map(
                  (entry, index) => (
                    <Cell
                      key={`${entry.metric}-${index}`}
                      fill={
                        CHART_COLORS[
                          index %
                            CHART_COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rp-chart-insight">
          <FaBullseye />

          <span>
            This visualization helps identify where
            activity is strongest and where additional
            follow-up or calling effort may be required.
          </span>
        </div>
      </ChartCard>

      {/* ============================================
          LEAD STATUS + CALL OUTCOMES
      ============================================ */}
      <div className="rp-two-col">

        <ChartCard
          icon={<FaUsers />}
          title="Lead Status Distribution"
          description="Shows how leads are currently distributed across different stages of the sales and follow-up process."
        >
          <div className="rp-chart">
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart data={leadStatus}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="status"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="count"
                  name="Lead Count"
                  fill="#7b1113"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rp-chart-insight">
            <FaUsers />

            <span>
              A higher number of leads in later
              stages usually indicates better
              progress towards conversion.
            </span>
          </div>
        </ChartCard>

        <ChartCard
          icon={<FaPhone />}
          title="Call Outcome Analysis"
          description="Shows the results of all completed calling activity, including successful connections and unsuccessful attempts."
        >
          <div className="rp-chart">
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart data={outcomes}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="outcome"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="count"
                  name="Calls"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rp-chart-insight">
            <FaPhone />

            <span>
              Use this report to understand call
              quality and identify opportunities
              to improve successful connections.
            </span>
          </div>
        </ChartCard>

      </div>

      {/* ============================================
          TODAY'S PERFORMANCE
      ============================================ */}
      <ChartCard
        className="rp-full-chart"
        icon={<FaArrowUp />}
        title="Today's Activity Performance"
        description="A detailed breakdown of today's calling, connection, follow-up and lead engagement activity."
      >
        <div className="rp-chart">
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart
              data={todayPerformanceData}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="metric"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Bar
                dataKey="value"
                name="Today's Activity"
                fill="#16a34a"
                radius={[8, 8, 0, 0]}
                maxBarSize={75}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rp-chart-insight">
          <FaCheckCircle />

          <span>
            This report gives an immediate view of
            today's productivity and helps monitor
            daily activity targets.
          </span>
        </div>
      </ChartCard>

    </div>
  );
};

export default function Reports() {
  return <ReportView admin />;
}