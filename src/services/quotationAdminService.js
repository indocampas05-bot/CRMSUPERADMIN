// src/services/quotationAdminService.js
// Super Admin visibility + approve/reject actions over every telecaller's
// quotations. Mirrors the request/error-handling conventions already used
// in leadService.js / superAdminService.js.
const API_BASE = import.meta.env.VITE_API_BASE || 'https://scanning-unused-dash.ngrok-free.dev/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `API error: ${response.status}`);
  }
  return response;
};

export const quotationAdminService = {
  // status: omit or 'All' for everything, otherwise one of
  // Draft | Pending Approval | Approved | Rejected | Sent
  getAll: async (status) => {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/quotations/admin${query}`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  getSummary: async () => {
    const res = await fetch(`${API_BASE}/quotations/admin/summary`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE}/quotations/admin/${encodeURIComponent(id)}`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  // status must be 'Approved' or 'Rejected'; rejectionReason is required when rejecting.
  review: async (id, status, rejectionReason) => {
    const res = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, rejectionReason }),
    });
    return (await handle(res)).json();
  },
  // ── Letterhead / logo / footer used on every generated quotation PDF ──
  getBranding: async () => {
    const res = await fetch(`${API_BASE}/quotation-branding`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  uploadBranding: async (type, file) => {            // type: 'logo' | 'letterpad'
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/quotation-branding/${type}`, { method: 'POST', headers: authHeaders(), body: fd });
    return (await handle(res)).json();
  },
  deleteBranding: async (type) => {
    const res = await fetch(`${API_BASE}/quotation-branding/${type}`, { method: 'DELETE', headers: authHeaders() });
    return (await handle(res)).json();
  },
  saveBrandingSettings: async (settings) => {         // { showBrandText, phone, website, address }
    const res = await fetch(`${API_BASE}/quotation-branding/settings`, {
      method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(settings),
    });
    return (await handle(res)).json();
  },
  downloadPdfBlob: async (id) => {
    const res = await fetch(`${API_BASE}/quotations/admin/${encodeURIComponent(id)}/pdf`, { headers: authHeaders() });
    await handle(res);
    return res.blob();
  },
};
export default quotationAdminService;