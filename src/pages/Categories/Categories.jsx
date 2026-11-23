// src/pages/Categories/Categories.jsx

import React, { useState, useEffect, useMemo } from 'react';
import './Categories.css';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiFolder,
  FiUsers,
  FiTarget,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiMoreVertical,
  FiEye,
  FiEyeOff,
  FiSave,
  FiRefreshCw,
} from 'react-icons/fi';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../Telecallers/telecallersData';
import { telecallerService } from '../../services/telecallerService';
// Import your category service if you have one
// import { categoryService } from '../../services/categoryService';

const Categories = () => {
  // ===== State =====
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  // ===== Fetch Data =====
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch telecallers from backend
      const telecallerData = await telecallerService.getAll();
      setTelecallers(telecallerData);
      
      // If you have a category service, fetch categories from backend
      // const categoryData = await categoryService.getAll();
      // setCategories(categoryData);
      
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Calculate Category Stats =====
  const categoryStats = useMemo(() => {
    const stats = {};
    
    // Initialize stats for all categories
    categories.forEach(cat => {
      stats[cat] = {
        total: 0,
        active: 0,
        inactive: 0,
        leads: 0,
        conversions: 0,
        revenue: 0,
        telecallers: [],
      };
    });

    // Calculate stats from telecallers
    telecallers.forEach(tc => {
      (tc.categories || []).forEach(cat => {
        if (stats[cat]) {
          stats[cat].total++;
          stats[cat].telecallers.push(tc);
          
          if (tc.status === 'Active') {
            stats[cat].active++;
          } else {
            stats[cat].inactive++;
          }
          
          // Add performance metrics
          stats[cat].leads += tc.performance?.totalLeads || 0;
          stats[cat].conversions += tc.performance?.conversions || 0;
          stats[cat].revenue += tc.performance?.revenue || 0;
        }
      });
    });

    return stats;
  }, [categories, telecallers]);

  // ===== Filtered Categories =====
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(cat =>
      cat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // ===== CRUD Operations =====
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    // Check for duplicate
    if (categories.some(cat => cat.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    // Add category
    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
    setSuccess(`Category "${newCategoryName.trim()}" added successfully`);
    setError('');
    setShowAddModal(false);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditCategory = (oldName, newName) => {
    if (!newName.trim()) {
      setError('Category name is required');
      return;
    }

    if (oldName.toLowerCase() !== newName.trim().toLowerCase() &&
        categories.some(cat => cat.toLowerCase() === newName.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    // Update category
    const updatedCategories = categories.map(cat =>
      cat === oldName ? newName.trim() : cat
    );
    setCategories(updatedCategories);
    setEditingCategory(null);
    setSuccess(`Category "${oldName}" updated to "${newName.trim()}"`);
    setError('');

    // Update telecallers with new category name
    // This would require a backend call to update all telecallers
    // For now, we'll just update the local state
    const updatedTelecallers = telecallers.map(tc => ({
      ...tc,
      categories: (tc.categories || []).map(cat =>
        cat === oldName ? newName.trim() : cat
      )
    }));
    setTelecallers(updatedTelecallers);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteCategory = (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      return;
    }

    // Check if category is in use
    const isInUse = telecallers.some(tc =>
      (tc.categories || []).includes(categoryName)
    );

    if (isInUse) {
      setError(`Cannot delete "${categoryName}" - it is assigned to one or more telecallers`);
      return;
    }

    // Delete category
    setCategories(categories.filter(cat => cat !== categoryName));
    setSuccess(`Category "${categoryName}" deleted successfully`);

    setTimeout(() => setSuccess(''), 3000);
  };

  // ===== View Category Details =====
  const handleViewCategory = (categoryName) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  // ===== Render Functions =====
  const renderStats = (category) => {
    const stats = categoryStats[category] || { total: 0, active: 0, inactive: 0, leads: 0, conversions: 0, revenue: 0 };
    return (
      <div className="category-stats">
        <div className="stat-item">
          <FiUsers className="stat-icon" />
          <span>{stats.total} Telecallers</span>
        </div>
        <div className="stat-item">
          <FiTarget className="stat-icon" />
          <span>{stats.leads} Leads</span>
        </div>
        <div className="stat-item">
          <FiBarChart2 className="stat-icon" />
          <span>{stats.conversions} Conversions</span>
        </div>
      </div>
    );
  };

  const renderCategoryCard = (category) => {
    const stats = categoryStats[category] || { total: 0, active: 0, inactive: 0 };
    const isSelected = selectedCategory === category;
    const telecallersInCategory = telecallers.filter(tc =>
      (tc.categories || []).includes(category)
    );

    return (
      <div key={category} className={`category-card ${isSelected ? 'expanded' : ''}`}>
        <div className="category-card-header">
          <div className="category-info">
            <div className="category-icon">
              <FiFolder size={20} />
            </div>
            <div className="category-name">{category}</div>
          </div>
          <div className="category-badge">
            <span className="badge">{stats.total} Telecallers</span>
          </div>
          <div className="category-actions">
            <button
              className="icon-btn view-btn"
              onClick={() => handleViewCategory(category)}
              title="View Details"
            >
              <FiEye size={16} />
            </button>
            <button
              className="icon-btn edit-btn"
              onClick={() => setEditingCategory(category)}
              title="Edit Category"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              className="icon-btn delete-btn"
              onClick={() => handleDeleteCategory(category)}
              title="Delete Category"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>

        {isSelected && (
          <div className="category-details">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Total Telecallers</span>
                <span className="value">{stats.total}</span>
              </div>
              <div className="detail-item">
                <span className="label">Active</span>
                <span className="value active">{stats.active}</span>
              </div>
              <div className="detail-item">
                <span className="label">Inactive</span>
                <span className="value inactive">{stats.inactive}</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Leads</span>
                <span className="value">{stats.leads}</span>
              </div>
              <div className="detail-item">
                <span className="label">Conversions</span>
                <span className="value">{stats.conversions}</span>
              </div>
              <div className="detail-item">
                <span className="label">Revenue</span>
                <span className="value">₹{stats.revenue.toLocaleString()}</span>
              </div>
            </div>

            {telecallersInCategory.length > 0 && (
              <div className="telecaller-list">
                <h4>Telecallers in this Category</h4>
                <div className="telecaller-items">
                  {telecallersInCategory.map(tc => (
                    <div key={tc.id} className="telecaller-item">
                      <span className="name">{tc.fullName}</span>
                      <span className={`status ${tc.status === 'Active' ? 'active' : 'inactive'}`}>
                        {tc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ===== Edit Modal =====
  const EditModal = () => {
    const [editName, setEditName] = useState(editingCategory || '');

    const handleSave = () => {
      if (editName.trim()) {
        handleEditCategory(editingCategory, editName);
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Category</h3>
            <button className="close-btn" onClick={() => setEditingCategory(null)}>
              <FiX size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Enter category name"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="secondary-btn" onClick={() => setEditingCategory(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleSave}>
              <FiSave size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Add Modal =====
  const AddModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Category</h3>
          <button className="close-btn" onClick={() => setShowAddModal(false)}>
            <FiX size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={() => setShowAddModal(false)}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleAddCategory}>
            <FiPlus size={16} /> Add Category
          </button>
        </div>
      </div>
    </div>
  );

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="categories-loading">
        <div className="spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  // ===== Main Render =====
  return (
    <div className="categories-page">
      {/* Header */}
      <div className="categories-header">
        <div className="header-content">
          <h1 className="page-title">📂 Category Management</h1>
          <p className="page-subtitle">
            Manage categories and view telecaller distribution
          </p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadData} title="Refresh">
            <FiRefreshCw size={18} />
          </button>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            <FiPlus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0e7ff' }}>
            <FiFolder size={24} color="#4338ca" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Total Categories</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7' }}>
            <FiUsers size={24} color="#16a34a" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{telecallers.length}</span>
            <span className="stat-label">Total Telecallers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7' }}>
            <FiTarget size={24} color="#b45309" />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {telecallers.reduce((sum, tc) => sum + (tc.performance?.conversions || 0), 0)}
            </span>
            <span className="stat-label">Total Conversions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe' }}>
            <FiBarChart2 size={24} color="#0369a1" />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              ₹{telecallers.reduce((sum, tc) => sum + (tc.performance?.revenue || 0), 0).toLocaleString()}
            </span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FiX size={16} />
            </button>
          )}
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-alert">
          <FiAlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-alert">
            <FiX size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="success-alert">
          <FiCheck size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-alert">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FiFolder size={48} />
          </div>
          <h3>No Categories Found</h3>
          <p>
            {searchTerm
              ? `No categories match "${searchTerm}"`
              : 'Start by adding your first category'}
          </p>
          {!searchTerm && (
            <button className="primary-btn" onClick={() => setShowAddModal(true)}>
              <FiPlus size={16} /> Add Category
            </button>
          )}
        </div>
      ) : (
        <div className={`categories-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {filteredCategories.map(category => renderCategoryCard(category))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddModal />}
      {editingCategory && <EditModal />}
    </div>
  );
};

export default Categories;