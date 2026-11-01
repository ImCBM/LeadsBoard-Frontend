import client from './client';

// ═══════════════════════════════════════════════
//  Developer API Keys — /api/v1/developer/api-keys
// ═══════════════════════════════════════════════

/**
 * GET /developer/api-keys — List all API keys owned by the authenticated user.
 * @returns {{ data: Array, meta: { total, max_keys, tier } }}
 */
export const getApiKeys = async () => {
  const { data } = await client.get('/developer/api-keys');
  return data;
};

/**
 * POST /developer/api-keys — Create a new API key.
 * @param {object} payload — { name, key_type, scopes, rate_limit_per_minute, allowed_ips, metadata, expires_at }
 * @returns {{ message, data, plain_text_key, warning }}
 */
export const createApiKey = async (payload) => {
  const { data } = await client.post('/developer/api-keys', payload);
  return data;
};

/**
 * GET /developer/api-keys/{id} — Get key details and usage stats.
 * @param {number|string} id
 * @returns {{ data: object }}
 */
export const getApiKey = async (id) => {
  const { data } = await client.get(`/developer/api-keys/${id}`);
  return data;
};

/**
 * PATCH /developer/api-keys/{id} — Update key settings.
 * @param {number|string} id
 * @param {object} payload — { name, scopes, rate_limit_per_minute, allowed_ips, metadata, is_active }
 * @returns {{ message, data }}
 */
export const updateApiKey = async (id, payload) => {
  const { data } = await client.patch(`/developer/api-keys/${id}`, payload);
  return data;
};

/**
 * DELETE /developer/api-keys/{id} — Revoke and delete an API key.
 * @param {number|string} id
 * @returns {{ message }}
 */
export const deleteApiKey = async (id) => {
  const { data } = await client.delete(`/developer/api-keys/${id}`);
  return data;
};

/**
 * POST /developer/api-keys/{id}/rotate — Rotate key value (new key, same settings).
 * @param {number|string} id
 * @returns {{ message, data, plain_text_key, warning }}
 */
export const rotateApiKey = async (id) => {
  const { data } = await client.post(`/developer/api-keys/${id}/rotate`);
  return data;
};

// ═══════════════════════════════════════════════
//  API Traces — /api/v1/developer/traces
// ═══════════════════════════════════════════════

/**
 * GET /developer/traces — List traces for the developer's keys.
 * @param {object} params — { api_key_id, method, status_code, path, from, to, per_page, page }
 * @returns Paginated trace results
 */
export const getTraces = async (params = {}) => {
  const { data } = await client.get('/developer/traces', { params });
  return data;
};

/**
 * GET /developer/traces/{traceId} — Get a single trace by trace_id.
 * @param {string} traceId
 * @returns {{ data: object }}
 */
export const getTrace = async (traceId) => {
  const { data } = await client.get(`/developer/traces/${traceId}`);
  return data;
};
