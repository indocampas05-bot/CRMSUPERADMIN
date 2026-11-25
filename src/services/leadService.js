// E:\crm-app(telecallers)\crm-app(telecallers)\crm-app\src\services\leadService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com';
const getToken = () => localStorage.getItem('token');
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  // /auth/login and /auth/register must never be treated as "session expired":
  // a wrong password also answers 401, and the old code then wiped storage and
  // reloaded /login without ever showing the real message ("login aagala").
  const isAuthEndpoint = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (token && !isAuthEndpoint) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  // 401 = not logged in / token expired -> back to login.
  // 403 = logged in but not allowed -> show the error, do NOT log the user out.
  if (response.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || error.error ||
      (response.status === 403 ? 'You do not have permission to do this.' : `API error: ${response.status}`)
    );
  }
  return response.json();
};
export const leadService = {
  getLeads: (page = 0, size = 10, search = '', category = '', status = '', assignedTo = '') => {
    const params = new URLSearchParams({
      page,
      size,
    });
    if (search) params.append('search', search);
    if (category && category !== 'All Categories') params.append('category', category);
    if (status && status !== 'All Status') params.append('status', status);
    if (assignedTo && assignedTo !== 'All Agents' && assignedTo !== '') params.append('assignedTo', assignedTo);
    return apiCall(`/leads?${params.toString()}`);
  },
  getStats: (assignedTo = '') => {
    const params = new URLSearchParams();
    if (assignedTo) params.append('assignedTo', assignedTo);
    const qs = params.toString();
    return apiCall(`/leads/stats${qs ? `?${qs}` : ''}`);
  },
  getCampaignStats: () => apiCall('/leads/campaigns/stats'),
  getCategoryStats: () => apiCall('/leads/categories/stats'),
  getLeadsByDistrict: (district) => apiCall(`/leads/district/${encodeURIComponent(district)}`),
  getLead: (id) => apiCall(`/leads/${id}`),
  createLead: (leadData) => apiCall('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData),
  }),
  updateLead: (id, leadData) => apiCall(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(leadData),
  }),
  deleteLead: (id) => apiCall(`/leads/${id}`, {
    method: 'DELETE',
  }),
  deleteMultipleLeads: (ids) => apiCall('/leads/batch', {
    method: 'DELETE',
    body: JSON.stringify(ids),
  }),
  // Super admin: every follow-up (lead with a next follow-up date) of one telecaller.
  getTelecallerFollowUps: (username) =>
    apiCall(`/leads/followups/telecaller/${encodeURIComponent(username)}`),
};
export const authService = {
  login: (username, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  validateToken: () => {
    const token = getToken();
    if (!token) return Promise.reject('No token');
    return apiCall('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
export default leadService;