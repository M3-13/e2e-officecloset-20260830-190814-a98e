const API_BASE = '/api';

const TOKEN_KEY = 'token';

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request(method, path, body, options = {}) {
  const headers = { ...(options.headers || {}) };

  const token = readToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: payload,
    });
  } catch (err) {
    const error = new Error('Netzwerkfehler – der Server ist nicht erreichbar.');
    error.status = 0;
    throw error;
  }

  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    let detail;
    if (data && typeof data === 'object' && data.detail) {
      detail = data.detail;
    } else if (typeof data === 'string' && data.length > 0) {
      detail = data;
    } else {
      detail = `Anfrage fehlgeschlagen (Status ${res.status}).`;
    }
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const client = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
};

export default client;
