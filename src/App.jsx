// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Leads from './pages/Leads/Leads';
import Clients from './pages/Clients/Clients';
import Reports from './pages/Reports/Reports';
import Followups from './pages/Followups/Followups';
import Quotations from './pages/Quotations/Quotations';
import Agreements from './pages/Agreements/Agreements';
import Settings from './pages/Settings/Settings';
import CallPanel from './pages/CallPanel/CallPanel';
import Calendar from './pages/Calendar/Calendar';
import Telecallers from './pages/Telecallers/Telecallers';
import Help from './pages/Help/Help';
import Demo from './pages/Demo/Demo';
import Payment from './pages/Payment/Payment';
import Categories from './pages/Categories/Categories';
import Login from './pages/Login/Login';
import Communication from './pages/Communication/Communication';
import './layouts/MainLayout.css';
import LeavePermissionAdmin from './pages/LeavePermissionAdmin/LeavePermissionAdmin';
import AttendanceAdmin from './pages/AttendanceAdmin/AttendanceAdmin';

// Main App Content with Auth
const AppContent = () => {
  const { isAuthenticated, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [navigationState, setNavigationState] = useState(null);

  const handleNavigate = (page, options = {}) => {
    if (page === "logout") {
      logout();
      setActivePage("dashboard");
      return;
    }
    if (options.state) {
      setNavigationState(options.state);
    } else {
      setNavigationState(null);
    }
    setActivePage(page);
  };

  const renderPage = () => {
    const pageMap = {
      dashboard:  <Dashboard />,
      leads:      <Leads onNavigate={handleNavigate} />,
      callpanel:  <CallPanel onNavigate={handleNavigate} navigationState={navigationState} />,
      clients:    <Clients />,
      followups:  <Followups />,
      quotations: <Quotations />,
      agreements: <Agreements />,
      reports:    <Reports />,
      calendar:   <Calendar />,
      attendance: <AttendanceAdmin />,    
      leavePermissions: <LeavePermissionAdmin />,
      settings:   <Settings onNavigate={handleNavigate} />,
      'settings-profile': <Settings onNavigate={handleNavigate} activeTab="profile" />,
      'settings-users': <Settings onNavigate={handleNavigate} activeTab="users" />,
      'settings-security': <Settings onNavigate={handleNavigate} activeTab="security" />,
      'settings-notifications': <Settings onNavigate={handleNavigate} activeTab="notifications" />,
      'settings-calls': <Settings onNavigate={handleNavigate} activeTab="calls" />,
      'settings-quotations': <Settings onNavigate={handleNavigate} activeTab="quotations" />,
      'settings-about': <Settings onNavigate={handleNavigate} activeTab="about" />,
      telecallers:      <Telecallers />,
      help:       <Help />,
      demo:       <Demo />,
      payment:    <Payment />,
      categories: <Categories />,
      communication: <Communication />,
    };
    return pageMap[activePage] || <Dashboard />;
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <MainLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
};

// Root App
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => {}} />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;


