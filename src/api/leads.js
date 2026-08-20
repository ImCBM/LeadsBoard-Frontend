import client from './client';

/**
 * GET /leads — List paginated leads with filters.
 * @param {object} params — search, industry, title_tier, status, country,
 *   ingestion_channel, date_from, date_to, per_page, sort_by, sort_dir, page
 */
export const getLeads = async (params = {}) => {
  const { data } = await client.get('/leads', { params });
  return data;
};

/**
 * GET /leads/{id}
 */
export const getLead = async (id) => {
  const { data } = await client.get(`/leads/${id}`);
  return data;
};

/**
 * POST /leads — Create a new lead via the authenticated API.
 */
export const createLead = async (leadData) => {
  const { data } = await client.post('/leads', leadData);
  return data;
};

/**
 * PUT /leads/{id} — Update a lead (status, notes, etc.)
 */
export const updateLead = async (id, leadData) => {
  const { data } = await client.put(`/leads/${id}`, leadData);
  return data;
};

/**
 * DELETE /leads/{id}
 */
export const deleteLead = async (id) => {
  const { data } = await client.delete(`/leads/${id}`);
  return data;
};

/**
 * GET /leads/export/csv — Stream CSV download with current filters.
 */
export const exportCsv = async (params = {}) => {
  const response = await client.get('/leads/export/csv', {
    params,
    responseType: 'blob',
  });

  // Extract filename from Content-Disposition header or fall back
  const disposition = response.headers['content-disposition'];
  let filename = 'leads_export.csv';
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match) filename = match[1];
  }

  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * GET /leads/filters — Distinct filter options for dropdowns.
 * @returns {{ industries, title_tiers, statuses, countries, channels }}
 */
export const getFilters = async () => {
  const { data } = await client.get('/leads/filters');
  return data;
};
