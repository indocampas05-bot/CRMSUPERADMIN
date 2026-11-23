// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import logo from "../../assets/icons/logo.png";
import {
  FiGrid,
  FiUserPlus,
  FiUser,
  FiRefreshCw,
  FiFileText,
  FiFile,
  FiBarChart2,
  FiCalendar,
  FiSettings,
  FiLogOut,
  FiCreditCard,
  FiGrid as FiCategory,
  FiMapPin,
  FiMessageSquare,
  FiShield,
  FiChevronDown,
  FiChevronRight,
  FiUsers,
  FiBell,
  FiPhone,
  FiInfo,
  FiLock,
  FiBriefcase,
} from "react-icons/fi";
import { FaCalendarAlt } from "react-icons/fa";

// Admin (Employee) Menu Items with Sub-Menus
const adminMenuItems = [
  { 
    icon: <FiGrid />, 
    label: "Dashboard", 
    id: "dashboard",
  },
  { 
    icon: <FiUser />, 
    label: "Telecallers", 
    id: "telecallers",
  },
  { 
    icon: <FiUserPlus />, 
    label: "Leads", 
    id: "leads",
  },
  { 
    icon: <FiFileText />, 
    label: "Quotations", 
    id: "quotations",
  },
  { 
    icon: <FiFile />, 
    label: "Agreements", 
    id: "agreements",
  },
  { 
    icon: <FiCreditCard />, 
    label: "Payments", 
    id: "payment",
  },
  //{ 
  //  icon: <FiRefreshCw />, 
    //label: "Follow-ups", 
  //  id: "followups",
 // },
  {
  id: 'attendance',
  label: 'Attendance',
  icon: <FiCalendar />,
},
  {
  id: 'leavePermissions',
  label: 'Leave & Permissions',
  icon: <FaCalendarAlt />,
},
 // { 
   // icon: <FiCategory />, 
    //label: "Categories", 
    //id: "categories",
  //},
  { 
    icon: <FiMessageSquare />, 
    label: "Communication", 
    id: "communication",
  },
  { 
    icon: <FiBarChart2 />, 
    label: "Reports", 
    id: "reports",
  },
  //{ 
   // icon: <FiCalendar />, 
 //   label: "Calendar", 
 //   id: "calendar",
 // },
 // { 
   // icon: <FiUser />, 
  //  label: "Clients", 
  //  id: "clients",
 // },
 // { 
 //   icon: <FiSettings />, 
   // label: "Settings", 
  //  id: "settings",
  //  isParent: true,
   // subItems: [
   //   { icon: <FiBriefcase />, label: "Company Profile", id: "settings-profile" },
    //  { icon: <FiUsers />, label: "User Management", id: "settings-users" },
   //   { icon: <FiLock />, label: "Security", id: "settings-security" },
   //   { icon: <FiBell />, label: "Notifications", id: "settings-notifications" },
   //   { icon: <FiPhone />, label: "Call Settings", id: "settings-calls" },
   //   { icon: <FiFileText />, label: "Quotation Settings", id: "settings-quotations" },
   //   { icon: <FiInfo />, label: "About", id: "settings-about" },
  //  ]
 // },
];

// Super Admin Menu Items with Sub-Menus
const superAdminMenuItems = [
  { 
    icon: <FiShield />, 
    label: "Super Admin Dashboard", 
    id: "dashboard",
  },
  { 
    icon: <FiUser />, 
    label: "Manage Employees", 
    id: "telecallers",
  },
  { 
    icon: <FiUserPlus />, 
    label: "All Leads", 
    id: "leads",
  },
  { 
    icon: <FiBarChart2 />, 
    label: "Reports", 
    id: "reports",
  },
  { 
    icon: <FiSettings />, 
    label: "Settings", 
    id: "settings",
    isParent: true,
    subItems: [
      { icon: <FiBriefcase />, label: "Company Profile", id: "settings-profile" },
      { icon: <FiUsers />, label: "User Management", id: "settings-users" },
      { icon: <FiLock />, label: "Security", id: "settings-security" },
      { icon: <FiBell />, label: "Notifications", id: "settings-notifications" },
      { icon: <FiPhone />, label: "Call Settings", id: "settings-calls" },
      { icon: <FiFileText />, label: "Quotation Settings", id: "settings-quotations" },
      { icon: <FiInfo />, label: "About", id: "settings-about" },
    ]
  },
];

const Sidebar = ({ activePage, onNavigate, collapsed, userRole }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  // Determine which menu to show based on role
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ROLE_SUPER_ADMIN';
  const menuItems = isSuperAdmin ? superAdminMenuItems : adminMenuItems;

  // Find the settings menu item
  const settingsItem = menuItems.find(item => item.isParent);

  // Check if any settings sub-item is active
  const isSettingsSubActive = () => {
    if (!settingsItem) return false;
    return settingsItem.subItems?.some(sub => activePage === sub.id);
  };

  // Auto-expand settings if a sub-item is active
  useEffect(() => {
    if (settingsItem) {
      const isSubActive = settingsItem.subItems?.some(sub => activePage === sub.id);
      
      // If a sub-item is active, expand the settings menu
      if (isSubActive) {
        setExpandedMenus(prev => ({
          ...prev,
          [settingsItem.id]: true
        }));
      } 
      // If we're on the settings parent page, also expand
      else if (activePage === 'settings') {
        setExpandedMenus(prev => ({
          ...prev,
          [settingsItem.id]: true
        }));
      }
      // Otherwise, we don't auto-close - let user control via clicks
    }
  }, [activePage, settingsItem]);

  // Toggle sub-menu expansion
  const toggleSubMenu = (menuId) => {
    if (collapsed) return;
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Check if a sub-item is active
  const isSubItemActive = (subItemId) => {
    return activePage === subItemId;
  };

  // Check if any sub-item of a menu is active
  const isMenuActive = (menu) => {
    if (activePage === menu.id) return true;
    if (menu.subItems) {
      return menu.subItems.some(sub => activePage === sub.id);
    }
    return false;
  };

  // Check if menu has sub-items
  const hasSubItems = (item) => {
    return item.subItems && item.subItems.length > 0;
  };

  // Handle navigation
  const handleNavigate = (id, e) => {
    if (id === "logout") {
      onNavigate(id);
      return;
    }
    onNavigate(id);
  };

  // Handle parent menu click (toggle or navigate)
  const handleParentClick = (item) => {
    if (hasSubItems(item)) {
      // Toggle the sub-menu
      toggleSubMenu(item.id);
    } else {
      handleNavigate(item.id);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <img
          src={logo}
          alt="INDOCRM Logo"
          className="logo-image"
        />
        {!collapsed && (
          <span className="logo-text">INDOCRM</span>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = isMenuActive(item);
          const isExpanded = expandedMenus[item.id];
          const hasChildren = hasSubItems(item);

          // When collapsed, only show icons
          if (collapsed) {
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigate(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
              </button>
            );
          }

          return (
            <div key={item.id} className="nav-item-wrapper">
              {/* Parent Menu Item */}
              <button
                className={`nav-item ${isActive ? "active" : ""} ${hasChildren ? "has-submenu" : ""}`}
                onClick={() => handleParentClick(item)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {hasChildren && (
                  <span className="nav-chevron">
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                )}
              </button>

              {/* Sub Menu Items */}
              {hasChildren && isExpanded && (
                <div className="sub-menu-container">
                  {item.subItems.map((subItem) => {
                    const isSubActive = isSubItemActive(subItem.id);
                    return (
                      <button
                        key={subItem.id}
                        className={`nav-item sub-nav-item ${isSubActive ? "active" : ""}`}
                        onClick={() => handleNavigate(subItem.id)}
                      >
                        <span className="nav-icon sub-icon">{subItem.icon}</span>
                        <span className="nav-label">{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`nav-item ${activePage === "logout" ? "active" : ""}`}
          onClick={() => handleNavigate("logout")}
        >
          <span className="nav-icon"><FiLogOut /></span>
          {!collapsed && (
            <span className="nav-label">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;