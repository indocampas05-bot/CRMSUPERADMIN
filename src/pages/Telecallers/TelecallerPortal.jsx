// src/pages/Telecallers/TelecallerPortal.jsx
import React from 'react';
import { FiX, FiGrid, FiTarget, FiPhoneCall, FiRefreshCw, FiFileText, FiCreditCard, FiBarChart2, FiCalendar, FiMapPin, FiTag, FiTrendingUp, FiUsers } from 'react-icons/fi';

const currency = (n) => '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n.toLocaleString('en-IN'));

const TelecallerPortal = ({ telecaller, onClose }) => {
  const t = telecaller;
  
  const stats = [
    { icon: <FiUsers />, label: 'Dashboard', value: 'Active session' },
    { icon: <FiTarget />, label: 'Assigned Leads', value: `${Math.round(t.target * 1.4)} leads` },
    { icon: <FiPhoneCall />, label: 'Call History', value: `${t.performance.callsToday} calls today` },
    { icon: <FiRefreshCw />, label: 'Follow-ups', value: `${t.performance.followups} pending` },
    { icon: <FiFileText />, label: 'Quotations', value: `Access: ${t.permissions.quotations}` },
    { icon: <FiCreditCard />, label: 'Payments', value: `Access: ${t.permissions.payments}` },
    { icon: <FiBarChart2 />, label: 'Reports', value: `Access: ${t.permissions.reports}` },
    { icon: <FiCalendar />, label: 'Calendar', value: 'No events today' },
  ];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f5',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1e2f', margin: 0 }}>
            {t.name}'s Portal — {t.id}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: '#f5f6fa',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#5a5a7a',
              transition: 'all 0.2s ease',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              background: '#f8f8fb',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#8888aa', fontWeight: 600, marginBottom: '4px' }}>Districts</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {t.districts.map((d) => (
                  <span key={d} style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}>{d}</span>
                ))}
              </div>
            </div>
            <div style={{
              background: '#f8f8fb',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#8888aa', fontWeight: 600, marginBottom: '4px' }}>Categories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {t.categories.map((c) => (
                  <span key={c} style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{
              background: '#f8f8fb',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#8888aa', fontWeight: 600, marginBottom: '4px' }}>Conversions</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e1e2f' }}>{t.performance.conversions}</div>
            </div>
            <div style={{
              background: '#f8f8fb',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#8888aa', fontWeight: 600, marginBottom: '4px' }}>Revenue</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#7b1113' }}>{currency(t.performance.revenue)}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            {stats.map((s) => (
              <div key={s.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8f8fb',
                borderRadius: '10px',
                padding: '12px 14px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7b1113',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  fontSize: '18px',
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#8888aa', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: '13px', color: '#1e1e2f', fontWeight: 700 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#b45309',
            textAlign: 'center',
          }}>
            Admin can view everything here, but only {t.name} can edit their own work.
          </div>
        </div>
      </div>

      {/* Add keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TelecallerPortal;