// Minimal API client wrapper using fetch for server-side use
const defaultOptions = {
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
};

async function request(path, opts = {}) {
  const { baseURL = process.env.API_BASE_URL || '', headers = {}, method = 'GET', body, timeout } = {
    ...defaultOptions,
    ...opts,
  };

  const url = baseURL ? `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : path;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);

  const fetchOpts = {
    method,
    headers: { ...defaultOptions.headers, ...headers },
    signal: controller.signal,
  };
  if (body !== undefined) fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);

  try {
    const res = await fetch(url, fetchOpts);
    clearTimeout(t);
    const text = await res.text();
    let data = text;
    try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-json */ }
    if (!res.ok) {
      const err = new Error(data?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

export default { request };
