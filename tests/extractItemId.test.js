'use strict';

const { extractItemId } = require('../src/utils/extractItemId');

describe('extractItemId', () => {
  // ── Raw item IDs ────────────────────────────────────────────────────────────

  test('returns a raw Brazil item ID unchanged', () => {
    expect(extractItemId('MLB12345678')).toBe('MLB12345678');
  });

  test('returns a raw Argentina item ID unchanged', () => {
    expect(extractItemId('MLA98765432')).toBe('MLA98765432');
  });

  test('is case-insensitive for raw IDs', () => {
    expect(extractItemId('mlb12345678')).toBe('MLB12345678');
  });

  // ── Product URLs ────────────────────────────────────────────────────────────

  test('extracts item ID from a standard mercadolivre.com.br URL', () => {
    expect(extractItemId('https://www.mercadolivre.com.br/produto/MLB49821529')).toBe('MLB49821529');
  });

  test('extracts item ID from a slug-style URL', () => {
    expect(
      extractItemId(
        'https://produto.mercadolivre.com.br/MLB-1234567-titulo-do-produto'
      )
    ).toBe('MLB1234567');
  });

  test('extracts item ID from a short mercadolivre.com URL', () => {
    expect(extractItemId('https://mercadolivre.com/p/MLB12345678')).toBe('MLB12345678');
  });

  test('extracts item ID even when surrounded by extra text', () => {
    expect(extractItemId('confira o item MLB99999999 disponível')).toBe('MLB99999999');
  });

  // ── No match ─────────────────────────────────────────────────────────────────

  test('returns null for an empty string', () => {
    expect(extractItemId('')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractItemId(null)).toBeNull();
  });

  test('returns null for a URL with no item ID', () => {
    expect(extractItemId('https://www.mercadolivre.com.br/')).toBeNull();
  });

  test('returns null for a plain text with no recognizable ID', () => {
    expect(extractItemId('hello world')).toBeNull();
  });
});
