// src/services/agreementAdminService.js
// Super Admin-only Agreement APIs.
//
// FIX: the backend has NO "/agreements/admin" routes. "/agreements/admin" was
// being matched by GET /agreements/{id} with id = "admin", which is why the
// page showed "Agreement not found" (404). AgreementService.list() already
// returns ALL agreements for ROLE_SUPER_ADMIN / ROLE_ADMIN, so the plain
// "/agreements" endpoints are used here.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://scanning-unused-dash.ngrok-free.dev/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const handle = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message ||
      error.error ||
      `API error: ${response.status} ${response.statusText}`
    );
  }

  return response;
};

export const agreementAdminService = {
  // GET /api/agreements  (optional ?status=...)
  getAll: async (status) => {
    const query =
      status && status !== 'All'
        ? `?status=${encodeURIComponent(status)}`
        : '';
    const response = await fetch(
      `${API_BASE}/agreements${query}`,
      { headers: authHeaders() }
    );
    return (await handle(response)).json();
  },

  // GET /api/agreements/{id}
  get: async (id) => {
    const response = await fetch(
      `${API_BASE}/agreements/${encodeURIComponent(id)}`,
      { headers: authHeaders() }
    );
    return (await handle(response)).json();
  },

  approve: async (id, remark = '') => {
    const response = await fetch(
      `${API_BASE}/agreements/${encodeURIComponent(id)}/approve`,
      {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ remark }),
      }
    );
    return (await handle(response)).json();
  },

  reject: async (id, reason) => {
    const response = await fetch(
      `${API_BASE}/agreements/${encodeURIComponent(id)}/reject`,
      {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason }),
      }
    );
    return (await handle(response)).json();
  },

  // GET /api/agreements/{id}/pdf
  downloadPdfBlob: async (id) => {
    const response = await fetch(
      `${API_BASE}/agreements/${encodeURIComponent(id)}/pdf`,
      { headers: authHeaders() }
    );
    await handle(response);
    return response.blob();
  },
};

export default agreementAdminService;