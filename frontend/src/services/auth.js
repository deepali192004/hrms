import { apiRequest } from './api.js';

const SESSION_KEY = 'faculty-hrms-session';
const ALLOWED_ROLES = new Set(['faculty', 'hod', 'admin']);

function unwrap(payload) {
  return payload?.data ?? payload;
}

function normalizeRole(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function authenticate(username, password) {
  const payload = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  const data = unwrap(payload);
  const user = data?.user ?? payload?.user ?? {};
  const token = data?.token ?? data?.accessToken ?? data?.access_token ?? data?.jwt ?? user?.token;
  const role = normalizeRole(data?.role ?? user?.role ?? payload?.role);
  if (!token || !role) {
    throw new Error('The server responded, but its authentication response did not include a JWT and role.');
  }
  if (!ALLOWED_ROLES.has(role)) {
    throw new Error('The server authenticated this account but returned a role this frontend does not support. Contact an administrator.');
  }

  return {
    token,
    role,
    name: user?.name ?? user?.fullName ?? user?.full_name ?? user?.username ?? username,
    expiresIn: data?.expiresIn ?? data?.expires_in ?? null,
  };
}

export async function registerFaculty(username, password) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { username, password, role: 'Faculty' },
  });
}

export function isFacultyRegistrationEnabled() {
  return import.meta.env.VITE_FACULTY_REGISTRATION_ENABLED === 'true';
}

export function saveSession(session) {
  if (!session?.token || !ALLOWED_ROLES.has(normalizeRole(session.role))) {
    throw new Error('A verified token and supported role are required to save a session.');
  }
  const savedAt = Date.now();
  const expiresAt = Number.isFinite(Number(session.expiresIn)) && Number(session.expiresIn) > 0
    ? savedAt + Number(session.expiresIn) * 1000
    : null;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    token: session.token,
    role: normalizeRole(session.role),
    name: typeof session.name === 'string' ? session.name : '',
    expiresAt,
  }));
}

export function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!session?.token || !ALLOWED_ROLES.has(normalizeRole(session.role))) return null;
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }
    return { ...session, role: normalizeRole(session.role) };
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
