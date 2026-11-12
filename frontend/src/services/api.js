const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_DEVELOPMENT_API = 'http://localhost:5000';

export class ApiClientError extends Error {
  constructor(message, { status = 0, code = 'api_error' } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname?.replace(/^\[|\]$/g, ''));
}

function configuredBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  const configured = configuredBaseUrl();
  if (configured) return configured;
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return LOCAL_DEVELOPMENT_API;
  }
  return '';
}

export function getApiConnectionMessage() {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return `HRMS API base: ${baseUrl}`;
  return 'The HRMS API is not configured for this remote environment. Set VITE_API_BASE_URL to a publicly reachable HTTPS backend URL. For local development, set it to http://localhost:5000. Localhost in remote Preview does not connect to your computer.';
}

function validateBaseUrl(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new ApiClientError('VITE_API_BASE_URL must be an absolute HTTP(S) URL.', { code: 'invalid_api_base' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ApiClientError('VITE_API_BASE_URL must use HTTP or HTTPS.', { code: 'invalid_api_base' });
  }

  if (typeof window !== 'undefined') {
    const localPage = isLocalHost(window.location.hostname);
    const localApi = isLocalHost(parsed.hostname);
    if (!localPage && localApi) {
      throw new ApiClientError('This remote Preview cannot use localhost to reach your computer. Configure VITE_API_BASE_URL with a publicly reachable HTTPS backend URL.', { code: 'remote_localhost_unreachable' });
    }
    if (window.location.protocol === 'https:' && parsed.protocol !== 'https:' && !localApi) {
      throw new ApiClientError('A remotely hosted HTTPS HRMS page requires an HTTPS backend URL; plain HTTP requests are blocked by browsers.', { code: 'https_backend_required' });
    }
  }

  return parsed.toString().replace(/\/$/, '');
}

function responseMessage(payload, status) {
  const message = payload && typeof payload === 'object'
    ? payload.message || payload.error || payload.detail
    : typeof payload === 'string' && payload.length < 300
      ? payload
      : '';
  return message || `The HRMS server returned HTTP ${status}.`;
}

export async function apiRequest(path, {
  method = 'GET',
  body,
  token,
  requiresAuth = false,
  signal,
} = {}) {
  if (typeof path !== 'string' || !path.startsWith('/api/')) {
    throw new ApiClientError('Only confirmed /api/ HRMS routes can be requested.', { code: 'invalid_api_path' });
  }
  if (requiresAuth && !token) {
    throw new ApiClientError('Sign in again to access this HRMS data.', { status: 401, code: 'missing_session' });
  }

  const rawBaseUrl = getApiBaseUrl();
  if (!rawBaseUrl) {
    throw new ApiClientError(getApiConnectionMessage(), { code: 'api_base_not_configured' });
  }
  const baseUrl = validateBaseUrl(rawBaseUrl);
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (requiresAuth) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: 'no-store',
    });
  } catch {
    throw new ApiClientError(`Cannot reach the HRMS backend at ${baseUrl}. Check that it is running, reachable, and allows requests from this application's origin.`, { code: 'backend_unreachable' });
  }

  let payload = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  }

  if (response.status === 401 && requiresAuth) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('hrms:session-expired'));
    throw new ApiClientError('Your session is invalid or expired. Sign in again.', { status: 401, code: 'session_expired' });
  }

  if (!response.ok || (payload && typeof payload === 'object' && payload.success === false)) {
    throw new ApiClientError(responseMessage(payload, response.status), { status: response.status, code: 'backend_rejected_request' });
  }

  return payload && typeof payload === 'object' && Object.hasOwn(payload, 'data')
    ? payload.data
    : payload;
}

export function getApiList(payload, propertyNames = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  for (const property of propertyNames) {
    if (Array.isArray(payload[property])) return payload[property];
  }
  return null;
}
