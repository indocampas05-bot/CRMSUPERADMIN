// src/services/superAdminService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com';
const SUPER_ADMIN_API = `${API_BASE}/super-admin`;
const getToken = () => localStorage.getItem('token');
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // ✅ credentials: 'include' removed
  const response = await fetch(`${SUPER_ADMIN_API}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
};
export const superAdminService = {
  getDistricts: () => request('/districts'),
  getEmployees: () => request('/employees'),
  getDistrict: (name) => request(`/districts/${encodeURIComponent(name)}`),
  getTelecallerDistrictAssignments: () => request('/telecaller-district-assignments'),
  setTelecallerDistricts: (username, districts) => request(`/telecallers/${encodeURIComponent(username)}/districts`, { method: 'PUT', body: JSON.stringify({ districts }) }),
  assignDistrict: (districtName, employeeUsername) =>
    request('/districts/assign', {
      method: 'POST',
      body: JSON.stringify({ districtName, employeeUsername }),
    }),
  unassignDistrict: (name) =>
    request(`/districts/unassign/${encodeURIComponent(name)}`, { method: 'POST' }),
  createDistrict: (name) =>
    request('/districts', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  // Employees
  getEmployees: () => request('/employees'),
  getEmployee: (username) => request(`/employees/${encodeURIComponent(username)}`),
  createEmployee: (data) =>
    request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  // Import Leads (multipart)
  importLeads: async (file, uploadedBy, district) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);
    if (district) formData.append('district', district);
    const token = getToken();
    const response = await fetch(`${SUPER_ADMIN_API}/import-leads`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Import failed');
    }
    return response.json();
  },
  // Upload History
  getUploadHistory: () => request('/upload-history'),
  getUploadHistoryById: (id) => request(`/upload-history/${id}`),
  // Stats
  getDistrictStats: () => request('/district-stats'),
  getDashboardStats: () => request('/dashboard-stats'),
};