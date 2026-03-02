'use strict';

/**
 * Extracts the Mercado Livre item ID (e.g. MLB12345678) from a URL or raw ID string.
 *
 * Supported formats:
 *  - Raw item ID:  MLB12345678
 *  - Product URL:  https://www.mercadolivre.com.br/produto/MLB12345678
 *  - Product URL:  https://produto.mercadolivre.com.br/MLB-1234567-title-slug
 *  - Short URL:    https://mercadolivre.com/p/MLB12345678
 *
 * @param {string} input - Product URL or raw item ID.
 * @returns {string|null} The item ID in uppercase (e.g. "MLB12345678"), or null if not found.
 */
function extractItemId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Match item IDs of the form: <country-code-letters><digits>
  // Mercado Livre uses codes like MLB (Brazil), MLA (Argentina), etc.
  // First try standard form: MLB12345678 (letters immediately followed by digits).
  const match = trimmed.match(/\b([A-Z]{2,3}\d{5,12})\b/i);
  if (match) {
    return match[1].toUpperCase();
  }

  // Also handle slug-style URLs where the country code and digits are separated by
  // a hyphen, e.g. /MLB-1234567-titulo-do-produto.
  const slugMatch = trimmed.match(/\b([A-Z]{2,3})-(\d{5,12})\b/i);
  if (slugMatch) {
    return (slugMatch[1] + slugMatch[2]).toUpperCase();
  }

  return null;
}

module.exports = { extractItemId };
