/**
 * Centralized SQL utilities.
 * Replaces copy-pasted sanitizeSearch across controllers and
 * provides safe UPDATE clause building with column whitelisting.
 */

/**
 * Strips SQL wildcard and quote characters from user search input.
 * Used for ILIKE queries where we inject the value into a parameterized query.
 */
export function sanitizeSearch(input: string): string {
  // Only strip ILIKE wildcard characters (% and _).
  // Single quotes and backslashes are safe in parameterized queries.
  return input.replace(/[%_]/g, '').trim();
}

/**
 * Builds SET clauses for an UPDATE query using only whitelisted columns.
 * Column names come from a compile-time constant array, never from user input.
 * Values are parameterized ($N placeholders).
 *
 * @param body - The parsed request body (already Zod-validated)
 * @param allowedColumns - Compile-time whitelist of column names
 * @param startIndex - Starting parameter index (default 2, since $1 is usually the id)
 * @returns { setClauses, values, nextIndex } ready for parameterized SQL
 *
 * @example
 * const { setClauses, values } = buildUpdateClauses(req.body, CLIENTI_ALLOWED);
 * // setClauses = ['ragione_sociale = $2', 'telefono = $3']
 * // values = ['ACME', '+39...']
 */
export function buildUpdateClauses(
  body: Record<string, unknown>,
  allowedColumns: readonly string[],
  startIndex = 2
): { setClauses: string[]; values: unknown[]; nextIndex: number } {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = startIndex;

  for (const col of allowedColumns) {
    if (col in body && body[col] !== undefined) {
      setClauses.push(`${col} = $${paramIndex}`);
      values.push(body[col]);
      paramIndex++;
    }
  }

  return { setClauses, values, nextIndex: paramIndex };
}
