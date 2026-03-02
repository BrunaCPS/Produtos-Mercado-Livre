'use strict';

/**
 * In-memory token store for MVP.
 *
 * TODO: Replace with a persistent store (e.g. database or encrypted file) before deploying
 *       to production. Never log or expose these tokens in responses.
 */
const tokenStore = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null, // Unix timestamp (ms)
};

/**
 * Save tokens returned by the Mercado Livre OAuth token endpoint.
 *
 * @param {object} params
 * @param {string} params.access_token
 * @param {string} params.refresh_token
 * @param {number} params.expires_in - Seconds until the access token expires.
 */
function saveTokens({ access_token, refresh_token, expires_in }) {
  tokenStore.accessToken = access_token;
  tokenStore.refreshToken = refresh_token;
  // Subtract 60 s to allow proactive refresh before the token actually expires.
  tokenStore.expiresAt = Date.now() + (expires_in - 60) * 1000;
}

/**
 * Returns true when there is a stored access token that has not expired yet.
 */
function hasValidToken() {
  return Boolean(tokenStore.accessToken && Date.now() < tokenStore.expiresAt);
}

/**
 * Returns the current access token (may be expired – check hasValidToken() first).
 */
function getAccessToken() {
  return tokenStore.accessToken;
}

/**
 * Returns the current refresh token.
 */
function getRefreshToken() {
  return tokenStore.refreshToken;
}

/**
 * Clears all stored tokens (e.g. on logout).
 */
function clearTokens() {
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
  tokenStore.expiresAt = null;
}

module.exports = { saveTokens, hasValidToken, getAccessToken, getRefreshToken, clearTokens };
