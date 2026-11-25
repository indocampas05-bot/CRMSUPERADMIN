const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com';
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // ✅ credentials: 'include' removed
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};
export const api = {
  getDashboard: () => request('/dashboard'),
  getLeads: (params = {}) => request(`/leads?${new URLSearchParams(params)}`),
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  getClients: () => request('/clients'),
  getReports: (params = {}) => request(`/reports?${new URLSearchParams(params)}`),
  getFollowUps: () => request('/followups'),
  getQuotations: () => request('/quotations'),
  createQuotation: (data) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  getAgreements: () => request('/agreements'),
  createAgreement: (data) => request('/agreements', { method: 'POST', body: JSON.stringify(data) }),
  getCalls: () => request('/calls'),
  saveCallDisposition: (data) => request('/calls/disposition', { method: 'POST', body: JSON.stringify(data) }),
  getNextCall: () => request('/calls/next'),
  calendar: {
  getEvents: (from, to) => {
    const params = new URLSearchParams();

    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const query = params.toString();

    return request(`/calendar/events${query ? `?${query}` : ''}`);
  },

  create: (data) =>
    request('/calendar/events', {
      method: 'POST',
      body: data,
    }),

  update: (id, data) =>
    request(`/calendar/events/${id}`, {
      method: 'PUT',
      body: data,
    }),

  remove: (id) =>
    request(`/calendar/events/${id}`, {
      method: 'DELETE',
    }),

  getTelecallers: () =>
    request('/calendar/telecallers'),
},
};
export default api;