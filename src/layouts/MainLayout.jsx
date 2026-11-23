import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import "./MainLayout.css";

const MainLayout = ({ children, activePage, onNavigate, userRole }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        userRole={userRole}
      />

      <div className={`main-content ${collapsed ? "expanded" : ""}`}>
        <Navbar toggleSidebar={() => setCollapsed(!collapsed)} />
        <div className="page-content">
          {/* Pass onNavigate to child components */}
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { onNavigate });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;