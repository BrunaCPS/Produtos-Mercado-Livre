'use strict';

const express = require('express');
const axios = require('axios');
const { extractItemId } = require('../utils/extractItemId');
const { getValidAccessToken } = require('./auth');

const router = express.Router();

const MELI_ITEMS_URL = 'https://api.mercadolibre.com/items';

/**
 * GET /api/product?q=<URL or item ID>
 *
 * Looks up a Mercado Livre product by URL or item ID.
 * Requires the server to hold a valid OAuth access token.
 *
 * Query parameters:
 *   q - Mercado Livre product URL (e.g. https://www.mercadolivre.com.br/…/MLB12345678)
 *       or a raw item ID (e.g. MLB12345678).
 *
 * Responses:
 *   200 - Product data from the Mercado Livre Items API.
 *   400 - Could not extract a valid item ID from the provided input.
 *   401 - Not authenticated; user must complete the OAuth flow first.
 *   502 - Upstream Mercado Livre API error.
 */
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q" (product URL or item ID).' });
  }

  const itemId = extractItemId(q);
  if (!itemId) {
    return res.status(400).json({
      error: 'Could not extract a valid Mercado Livre item ID from the provided input.',
      hint: 'Provide a product URL (e.g. https://www.mercadolivre.com.br/…/MLB12345678) or a raw item ID (e.g. MLB12345678).',
    });
  }

  let accessToken;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    return res.status(401).json({
      error: 'Not authenticated. Please connect your Mercado Livre account first.',
      authUrl: '/auth/login',
    });
  }

  try {
    const response = await axios.get(`${MELI_ITEMS_URL}/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.json(response.data);
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;

    if (status === 401 || status === 403) {
      return res.status(401).json({
        error: 'Access denied by Mercado Livre. Your session may have expired.',
        details: data,
        authUrl: '/auth/login',
      });
    }

    if (status === 404) {
      return res.status(404).json({ error: `Item ${itemId} not found.` });
    }

    return res.status(502).json({
      error: 'Upstream Mercado Livre API error.',
      details: data || err.message,
    });
  }
});

module.exports = router;
