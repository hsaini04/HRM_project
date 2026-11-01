// Central API client. Every request carries the active demo role so the server can apply
// role-appropriate permissions (demo only — not authentication).

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

let demoHeaders = {};
export function setDemoHeaders({ role, employeeId } = {}) {
  demoHeaders = {};
  if (role) demoHeaders['X-Demo-Role'] = role;
  if (employeeId) demoHeaders['X-Demo-Employee'] = employeeId;
}

// Fired after every successful write so shared widgets (e.g. the alerts bell) can refresh.
export const DATA_CHANGED_EVENT = 'skillbridge:data-changed';

export class ApiError extends Error {
  constructor(message, { status = 0, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function request(method, path, { params, body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...demoHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the SkillBridge API. Is the server running on port 5050?', { status: 0 });
  }

  if (response.status === 204) {
    if (method !== 'GET') window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
    return null;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed (${response.status})`, {
      status: response.status,
      details: payload?.error?.details,
    });
  }
  if (method !== 'GET') window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
  return payload;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};
