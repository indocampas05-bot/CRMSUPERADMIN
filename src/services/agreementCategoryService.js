// src/services/agreementCategoryService.js
// Super Admin: list / read / save / reset the editable agreement for each category.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com';

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('token');
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
    throw new Error(error.message || error.error || `API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const agreementCategoryService = {
  list: async () =>
    handle(await fetch(`${API_BASE}/agreement-categories`, { headers: authHeaders() })),

  get: async (key) =>
    handle(await fetch(`${API_BASE}/agreement-categories/${encodeURIComponent(key)}`, { headers: authHeaders() })),

  save: async (key, contentHtml) =>
    handle(
      await fetch(`${API_BASE}/agreement-categories/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ contentHtml }),
      })
    ),

  reset: async (key) =>
    handle(
      await fetch(`${API_BASE}/agreement-categories/${encodeURIComponent(key)}/reset`, {
        method: 'POST',
        headers: authHeaders(),
      })
    ),
};

export default agreementCategoryService;
