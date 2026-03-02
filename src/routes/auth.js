'use strict';

const express = require('express');
const axios = require('axios');
const { saveTokens, hasValidToken, getAccessToken, getRefreshToken } = require('../utils/tokenStore');

const router = express.Router();

const MELI_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const MELI_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

/**
 * GET /auth/login
 *
 * Redirects the user to the Mercado Livre authorization page.
 */
router.get('/login', (req, res) => {
  const { MELI_CLIENT_ID, MELI_REDIRECT_URI } = process.env;

  if (!MELI_CLIENT_ID || !MELI_REDIRECT_URI) {
    return res.status(500).json({ error: 'Missing MELI_CLIENT_ID or MELI_REDIRECT_URI in environment.' });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: MELI_CLIENT_ID,
    redirect_uri: MELI_REDIRECT_URI,
  });

  return res.redirect(`${MELI_AUTH_URL}?${params.toString()}`);
});

/**
 * GET /auth/callback
 *
 * Receives the authorization code from Mercado Livre, exchanges it for tokens,
 * and redirects the user back to the frontend.
 */
router.get('/callback', async (req, res) => {
  const { code, error: authError } = req.query;

  if (authError) {
    return res.redirect(`/?error=${encodeURIComponent(authError)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided.' });
  }

  const { MELI_CLIENT_ID, MELI_CLIENT_SECRET, MELI_REDIRECT_URI } = process.env;

  try {
    const response = await axios.post(
      MELI_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MELI_CLIENT_ID,
        client_secret: MELI_CLIENT_SECRET,
        code,
        redirect_uri: MELI_REDIRECT_URI,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    saveTokens(response.data);
    return res.redirect('/?auth=success');
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    return res.redirect(`/?error=${encodeURIComponent(message)}`);
  }
});

/**
 * GET /auth/status
 *
 * Returns whether the server currently holds a valid access token.
 * Does NOT expose the token itself.
 */
router.get('/status', (req, res) => {
  res.json({ authenticated: hasValidToken() });
});

/**
 * POST /auth/logout
 *
 * Clears the stored tokens.
 */
router.post('/logout', (req, res) => {
  const { clearTokens } = require('../utils/tokenStore');
  clearTokens();
  res.json({ ok: true });
});

/**
 * Refreshes the access token using the stored refresh token.
 * Returns the new access token on success, or throws on failure.
 *
 * @returns {Promise<string>} The new access token.
 */
async function refreshAccessToken() {
  const { MELI_CLIENT_ID, MELI_CLIENT_SECRET } = process.env;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available. Please authenticate first.');
  }

  const response = await axios.post(
    MELI_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: MELI_CLIENT_ID,
      client_secret: MELI_CLIENT_SECRET,
      refresh_token: refreshToken,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  saveTokens(response.data);
  return response.data.access_token;
}

/**
 * Returns a valid access token, refreshing it automatically if it has expired.
 * Throws if no tokens are available.
 *
 * @returns {Promise<string>} A valid access token.
 */
async function getValidAccessToken() {
  if (hasValidToken()) {
    return getAccessToken();
  }
  return refreshAccessToken();
}

module.exports = { router, getValidAccessToken };
