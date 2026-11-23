// src/services/agreementService.js

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://scanning-unused-dash.ngrok-free.dev/api';

const REQUEST_TIMEOUT = 30000;

/**
 * Build authentication headers.
 */
const auth = (json = true) => {
  const token = localStorage.getItem('token');

  return {
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
    ...(json
      ? {
          'Content-Type': 'application/json',
        }
      : {}),
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
};

/**
 * Common API request helper.
 */
async function request(path, options = {}) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const isForm = options.body instanceof FormData;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...auth(!isForm),
        ...(options.headers || {}),
      },
    });

    const text = await response.text().catch(() => '');

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text
        ? {
            message: text,
          }
        : null;
    }

    // ------------------------------------------------------------
    // SESSION EXPIRED
    // ------------------------------------------------------------
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';

      throw new Error('Session expired. Please login again.');
    }

    // ------------------------------------------------------------
    // FORBIDDEN
    // ------------------------------------------------------------
    if (response.status === 403) {
      throw new Error(
        data?.message ||
          data?.error ||
          'You do not have permission to perform this action.'
      );
    }

    // ------------------------------------------------------------
    // OTHER API ERRORS
    // ------------------------------------------------------------
    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build query string.
 */
const query = (params = {}) => {
  const value = new URLSearchParams(
    Object.entries(params)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )
      .map(([key, value]) => [
        key,
        String(value),
      ])
  ).toString();

  return value ? `?${value}` : '';
};

/**
 * Convert Spring Page response to content array.
 *
 * Spring Boot:
 * {
 *   content: [],
 *   totalElements: 10,
 *   totalPages: 1,
 *   ...
 * }
 *
 * Also supports APIs that directly return an array.
 */
const pageContent = (value) =>
  Array.isArray(value)
    ? value
    : value?.content || [];


/**
 * ============================================================
 * AGREEMENT SERVICE
 * ============================================================
 */
export const agreementService = {
  // ============================================================
  // AGREEMENTS
  // ============================================================

  /**
   * Get agreements.
   *
   * Example:
   * agreementService.list()
   * agreementService.list({ status: 'DRAFT' })
   */
  list: (params = {}) =>
    request(
      `/agreements${query(params)}`
    ),

  /**
   * Get a single agreement.
   */
  get: (id) =>
    request(
      `/agreements/${encodeURIComponent(id)}`
    ),

  /**
   * Create agreement.
   */
  create: (data) =>
    request(
      '/agreements',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  /**
   * Update agreement.
   */
  update: (id, data) =>
    request(
      `/agreements/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  /**
   * Preview agreement.
   */
  previewAgreement: (data) =>
    request(
      '/agreements/preview',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  /**
   * Submit agreement.
   */
  submit: (id) =>
    request(
      `/agreements/${encodeURIComponent(id)}/submit`,
      {
        method: 'POST',
      }
    ),

  /**
   * Approve agreement.
   */
  approve: (id, remark = '') =>
    request(
      `/agreements/${encodeURIComponent(id)}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({
          remark,
        }),
      }
    ),

  /**
   * Reject agreement.
   */
  reject: (id, reason = '') =>
    request(
      `/agreements/${encodeURIComponent(id)}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason,
        }),
      }
    ),

  /**
   * Send agreement.
   */
  send: (id, channel = 'WhatsApp') =>
    request(
      `/agreements/${encodeURIComponent(id)}/send`,
      {
        method: 'POST',
        body: JSON.stringify({
          channel,
        }),
      }
    ),

  /**
   * Delete agreement.
   */
  remove: (id) =>
    request(
      `/agreements/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    ),


  // ============================================================
  // AGREEMENT TEMPLATES
  // ============================================================

  /**
   * Get all agreement templates.
   */
  templates: () =>
    request('/agreement-templates'),

  /**
   * Get templates by type.
   */
  templatesByType: (type) =>
    request(
      `/agreement-templates${query({ type })}`
    ),


  // ============================================================
  // AGREEMENT PLANS
  // ============================================================

  /**
   * Get agreement plans.
   *
   * Example:
   * agreementService.plans('ERP')
   */
  plans: (type) =>
    request(
      `/agreement-plans${query({ type })}`
    ),


  // ============================================================
  // TELECALLER LEADS
  // ============================================================
  //
  // IMPORTANT:
  //
  // DO NOT use:
  //
  //     /leads
  //
  // because that becomes:
  //
  //     /api/leads
  //
  // For the Telecaller Agreement page we must use:
  //
  //     /telecaller/leads
  //
  // which becomes:
  //
  //     /api/telecaller/leads
  //
  // The backend Telecaller controller is mapped to:
  //
  //     /api/telecaller
  //
  // and its leads endpoint is:
  //
  //     GET /api/telecaller/leads
  //
  // ============================================================

  leads: () =>
    request(
      '/telecaller/leads?size=1000&sort=createdAt,desc'
    ).then(pageContent),


  // ============================================================
  // AGREEMENT PDF
  // ============================================================

  /**
   * Get agreement PDF as Blob URL.
   *
   * Usage:
   *
   * const url =
   *   await agreementService.pdfBlobUrl(id);
   *
   * window.open(url);
   */
  pdfBlobUrl: async (id) => {
    const response = await fetch(
      `${API_BASE}/agreements/${encodeURIComponent(id)}/pdf`,
      {
        headers: auth(false),
      }
    );

    // ----------------------------------------------------------
    // SESSION EXPIRED
    // ----------------------------------------------------------
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';

      throw new Error(
        'Session expired. Please login again.'
      );
    }

    // ----------------------------------------------------------
    // FORBIDDEN
    // ----------------------------------------------------------
    if (response.status === 403) {
      const text = await response
        .text()
        .catch(() => '');

      throw new Error(
        text ||
          'You do not have permission to view this PDF.'
      );
    }

    // ----------------------------------------------------------
    // OTHER ERRORS
    // ----------------------------------------------------------
    if (!response.ok) {
      const text = await response
        .text()
        .catch(() => '');

      throw new Error(
        text ||
          `Unable to load PDF: ${response.status}`
      );
    }

    // ----------------------------------------------------------
    // CREATE BLOB URL
    // ----------------------------------------------------------
    const blob = await response.blob();

    return URL.createObjectURL(blob);
  },
};


/**
 * Default export.
 */
export default agreementService;
