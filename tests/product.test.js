'use strict';

/**
 * Integration tests for the /api/product endpoint.
 *
 * Axios calls to the Mercado Livre API are intercepted with jest.mock so that
 * no real HTTP requests are made during testing.
 */

jest.mock('axios');
const axios = require('axios');

// The token store must be reset between tests so state does not leak.
jest.mock('../src/utils/tokenStore', () => {
  let store = { accessToken: null, refreshToken: null, expiresAt: null };
  return {
    saveTokens: jest.fn(({ access_token, refresh_token, expires_in }) => {
      store.accessToken = access_token;
      store.refreshToken = refresh_token;
      store.expiresAt = Date.now() + (expires_in - 60) * 1000;
    }),
    hasValidToken: jest.fn(() => Boolean(store.accessToken && Date.now() < store.expiresAt)),
    getAccessToken: jest.fn(() => store.accessToken),
    getRefreshToken: jest.fn(() => store.refreshToken),
    clearTokens: jest.fn(() => { store = { accessToken: null, refreshToken: null, expiresAt: null }; }),
    // Helper to seed tokens directly in tests.
    _seedToken: (token) => {
      store.accessToken = token;
      store.expiresAt = Date.now() + 3600 * 1000;
    },
  };
});

const request = require('supertest');
const app = require('../server');
const tokenStore = require('../src/utils/tokenStore');

describe('GET /api/product', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when "q" query parameter is missing', async () => {
    const res = await request(app).get('/api/product');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing/i);
  });

  test('returns 400 when item ID cannot be extracted from input', async () => {
    const res = await request(app).get('/api/product?q=not-a-valid-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/item id/i);
  });

  test('returns 401 when no access token is stored', async () => {
    // tokenStore.hasValidToken returns false by default (no token seeded).
    tokenStore.hasValidToken.mockReturnValue(false);
    tokenStore.getRefreshToken.mockReturnValue(null);

    const res = await request(app).get('/api/product?q=MLB12345678');
    expect(res.status).toBe(401);
    expect(res.body.authUrl).toBe('/auth/login');
  });

  test('returns product data when a valid token is stored', async () => {
    tokenStore.hasValidToken.mockReturnValue(true);
    tokenStore.getAccessToken.mockReturnValue('test-access-token');

    const mockProduct = {
      id: 'MLB12345678',
      title: 'Produto Teste',
      price: 99.9,
      thumbnail: 'https://example.com/img.jpg',
      permalink: 'https://www.mercadolivre.com.br/produto/MLB12345678',
    };

    axios.get.mockResolvedValue({ data: mockProduct });

    const res = await request(app).get('/api/product?q=MLB12345678');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('MLB12345678');
    expect(res.body.title).toBe('Produto Teste');

    // Ensure the Bearer token was passed.
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.mercadolibre.com/items/MLB12345678',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }),
      }),
    );
  });

  test('extracts item ID from a full product URL', async () => {
    tokenStore.hasValidToken.mockReturnValue(true);
    tokenStore.getAccessToken.mockReturnValue('tok');

    axios.get.mockResolvedValue({ data: { id: 'MLB49821529', title: 'Test', price: 10 } });

    const res = await request(app).get(
      '/api/product?q=' + encodeURIComponent('https://www.mercadolivre.com.br/produto/MLB49821529'),
    );
    expect(res.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.mercadolibre.com/items/MLB49821529',
      expect.anything(),
    );
  });

  test('returns 404 when the upstream API responds with 404', async () => {
    tokenStore.hasValidToken.mockReturnValue(true);
    tokenStore.getAccessToken.mockReturnValue('tok');

    const notFoundError = new Error('Not Found');
    notFoundError.response = { status: 404, data: { message: 'Item not found' } };
    axios.get.mockRejectedValue(notFoundError);

    const res = await request(app).get('/api/product?q=MLB00000001');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/MLB00000001/);
  });

  test('returns 401 when the upstream API responds with 403', async () => {
    tokenStore.hasValidToken.mockReturnValue(true);
    tokenStore.getAccessToken.mockReturnValue('tok');

    const forbiddenError = new Error('Forbidden');
    forbiddenError.response = { status: 403, data: { message: 'PA_UNAUTHORIZED' } };
    axios.get.mockRejectedValue(forbiddenError);

    const res = await request(app).get('/api/product?q=MLB12345678');
    expect(res.status).toBe(401);
    expect(res.body.authUrl).toBe('/auth/login');
  });
});

describe('GET /auth/status', () => {
  test('returns authenticated: false when no token stored', async () => {
    tokenStore.hasValidToken.mockReturnValue(false);
    const res = await request(app).get('/auth/status');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  test('returns authenticated: true when a valid token is stored', async () => {
    tokenStore.hasValidToken.mockReturnValue(true);
    const res = await request(app).get('/auth/status');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });
});
