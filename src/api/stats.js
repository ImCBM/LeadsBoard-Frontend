import client from './client';

/**
 * GET /stats/summary
 * @returns {{ data: { total_leads, today, this_week, this_month, status_counts } }}
 */
export const getSummary = async () => {
  const { data } = await client.get('/stats/summary');
  return data;
};

/**
 * GET /stats/by-industry
 * @returns {Array<{ industry_classification, count }>}
 */
export const getByIndustry = async () => {
  const { data } = await client.get('/stats/by-industry');
  return data;
};

/**
 * GET /stats/by-title-tier
 * @returns {Array<{ title_tier, count }>}
 */
export const getByTitleTier = async () => {
  const { data } = await client.get('/stats/by-title-tier');
  return data;
};

/**
 * GET /stats/by-status
 * @returns {Array<{ status, count }>}
 */
export const getByStatus = async () => {
  const { data } = await client.get('/stats/by-status');
  return data;
};

/**
 * GET /stats/by-country
 * @returns {Array<{ country, count }>}
 */
export const getByCountry = async () => {
  const { data } = await client.get('/stats/by-country');
  return data;
};

/**
 * GET /stats/timeline?days=N
 * @param {number} days — Number of days to look back (default 30, max 365)
 * @returns {{ data: Array<{ date, count }>, range: { from, to, days } }}
 */
export const getTimeline = async (days = 30) => {
  const { data } = await client.get('/stats/timeline', { params: { days } });
  return data;
};
