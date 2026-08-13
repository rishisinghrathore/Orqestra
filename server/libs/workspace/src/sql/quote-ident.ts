export function quoteIdent(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function quoteTable(schemaName: string, tableName: string): string {
  return `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;
}
