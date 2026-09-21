import client from './client';

/**
 * GET /tags — List tags with lead counts.
 * By default filters for public tags.
 * @param {object} params — { type: 'public' | 'system', search: string }
 */
export const getTags = async (params = { type: 'public' }) => {
  const { data } = await client.get('/tags', { params });
  return data;
};

/**
 * GET /tags/{id} — Get a single tag with lead count.
 * @param {number|string} id
 */
export const getTag = async (id) => {
  const { data } = await client.get(`/tags/${id}`);
  return data;
};

/**
 * POST /tags — Create a new tag.
 * Defaults to 'public' type.
 * @param {object} tagData — { name: string, type?: 'public', color?: string, description?: string }
 */
export const createTag = async (tagData) => {
  const payload = {
    type: 'public',
    ...tagData,
  };
  const { data } = await client.post('/tags', payload);
  return data;
};

/**
 * DELETE /tags/{id} — Delete a tag.
 * @param {number|string} id
 */
export const deleteTag = async (id) => {
  const { data } = await client.delete(`/tags/${id}`);
  return data;
};
