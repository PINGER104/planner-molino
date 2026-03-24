import { describe, it, expect } from 'vitest';
import { sanitizeSearch, buildUpdateClauses } from '../lib/queryBuilder';

describe('sanitizeSearch', () => {
  it('removes SQL wildcard characters', () => {
    expect(sanitizeSearch('test%query')).toBe('testquery');
  });

  it('removes underscore wildcard', () => {
    expect(sanitizeSearch('test_query')).toBe('testquery');
  });

  it('preserves single quotes (safe in parameterized queries)', () => {
    expect(sanitizeSearch("test'query")).toBe("test'query");
  });

  it('preserves backslashes (safe in parameterized queries)', () => {
    expect(sanitizeSearch('test\\query')).toBe('test\\query');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearch('  test  ')).toBe('test');
  });

  it('handles empty string', () => {
    expect(sanitizeSearch('')).toBe('');
  });

  it('handles string with only wildcard characters', () => {
    expect(sanitizeSearch('%_')).toBe('');
  });

  it('preserves normal characters', () => {
    expect(sanitizeSearch('ACME S.r.l.')).toBe('ACME S.r.l.');
  });

  it('preserves SQL-like strings (safe via parameterization)', () => {
    expect(sanitizeSearch("'; DROP TABLE users; --")).toBe("'; DROP TABLE users; --");
  });

  it('preserves business names with quotes', () => {
    expect(sanitizeSearch("L'Oreal")).toBe("L'Oreal");
  });
});

describe('buildUpdateClauses', () => {
  const ALLOWED = ['nome', 'cognome', 'email', 'telefono'] as const;

  it('builds SET clauses from allowed columns', () => {
    const result = buildUpdateClauses(
      { nome: 'Mario', email: 'mario@test.com' },
      ALLOWED
    );
    expect(result.setClauses).toEqual(['nome = $2', 'email = $3']);
    expect(result.values).toEqual(['Mario', 'mario@test.com']);
    expect(result.nextIndex).toBe(4);
  });

  it('filters out non-whitelisted columns', () => {
    const result = buildUpdateClauses(
      { nome: 'Mario', evil_column: 'DROP TABLE', email: 'test@test.com' },
      ALLOWED
    );
    expect(result.setClauses).toEqual(['nome = $2', 'email = $3']);
    expect(result.values).toEqual(['Mario', 'test@test.com']);
    expect(result.values).not.toContain('DROP TABLE');
  });

  it('returns empty arrays when no allowed columns are present', () => {
    const result = buildUpdateClauses(
      { evil1: 'a', evil2: 'b' },
      ALLOWED
    );
    expect(result.setClauses).toEqual([]);
    expect(result.values).toEqual([]);
  });

  it('respects custom startIndex', () => {
    const result = buildUpdateClauses(
      { nome: 'Mario' },
      ALLOWED,
      5
    );
    expect(result.setClauses).toEqual(['nome = $5']);
    expect(result.nextIndex).toBe(6);
  });

  it('skips undefined values', () => {
    const result = buildUpdateClauses(
      { nome: 'Mario', cognome: undefined, email: 'test@test.com' },
      ALLOWED
    );
    expect(result.setClauses).toEqual(['nome = $2', 'email = $3']);
    expect(result.values).toEqual(['Mario', 'test@test.com']);
  });

  it('includes null values (explicit null is a valid update)', () => {
    const result = buildUpdateClauses(
      { nome: 'Mario', telefono: null },
      ALLOWED
    );
    expect(result.setClauses).toEqual(['nome = $2', 'telefono = $3']);
    expect(result.values).toEqual(['Mario', null]);
  });

  it('handles empty body', () => {
    const result = buildUpdateClauses({}, ALLOWED);
    expect(result.setClauses).toEqual([]);
    expect(result.values).toEqual([]);
  });

  it('preserves column order from whitelist', () => {
    const result = buildUpdateClauses(
      { email: 'e@t.com', nome: 'N', telefono: '123' },
      ALLOWED
    );
    // Order follows ALLOWED, not the body keys
    expect(result.setClauses).toEqual(['nome = $2', 'email = $3', 'telefono = $4']);
  });
});
