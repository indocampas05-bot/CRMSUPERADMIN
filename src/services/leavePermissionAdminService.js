const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://scanning-unused-dash.ngrok-free.dev/api';
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  console.log('Leave Permission API Request:', {
    url: `${API_BASE}${endpoint}`,
    method: options.method || 'GET',
    hasToken: !!token,
    tokenPreview: token
      ? `${token.substring(0, 20)}...`
      : 'NO TOKEN',
  });
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  console.log('Leave Permission API Response:', {
    status: response.status,
    statusText: response.statusText,
    url: `${API_BASE}${endpoint}`,
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error(
      'Session expired. Please login again.'
    );
  }
  if (response.status === 403) {
    throw new Error(
      'Access denied. Your account does not have permission to perform this action.'
    );
  }
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({}));
    throw new Error(
      data.message ||
      data.error ||
      `API error: ${response.status}`
    );
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};
const leavePermissionAdminService = {
  create: (data) =>
    request('/leave-permissions/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(
      `/leave-permissions/admin/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),
  getRequests: (status = 'All') => {
    const query =
      status && status !== 'All'
        ? `?status=${encodeURIComponent(status)}`
        : '';
    return request(
      `/leave-permissions/admin${query}`
    );
  },
  getSummary: () =>
    request(
      '/leave-permissions/admin/summary'
    ),
  updateStatus: (
    id,
    status,
    rejectionReason = ''
  ) =>
    request(
      `/leave-permissions/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          rejectionReason,
        }),
      }
    ),
};
export default leavePermissionAdminService;