const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api';

const headers = () => {
  const token = localStorage.getItem('token');

  return {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (response) => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }

  return response;
};

const upload = async (path, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: formData,
  });

  return (await handle(response)).json();
};

const get = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: headers(),
  });

  return (await handle(response)).json();
};

export default {
  uploadLogo: (file) =>
    upload('/payments/admin/invoice-assets/logo', file),

  uploadSignature: (file) =>
    upload('/payments/admin/invoice-assets/signature', file),

  uploadThankYou: (file) =>
    upload('/payments/admin/invoice-assets/thank-you', file),

  getAssets: () =>
    get('/payments/invoice-assets/data'),
};
