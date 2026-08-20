import client from './client';

/**
 * POST /auth/login
 * @param {string} email
 * @param {string} password
 * @returns {{ message, data: { token, user } }}
 */
export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
};

/**
 * GET /auth/me
 * @returns {object} Authenticated user profile
 */
export const getMe = async () => {
  const { data } = await client.get('/auth/me');
  return data;
};

/**
 * POST /auth/logout
 */
export const logout = async () => {
  const { data } = await client.post('/auth/logout');
  return data;
};
