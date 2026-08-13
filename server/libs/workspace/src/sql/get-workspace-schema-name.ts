/**
 * Deterministic Postgres schema name for a Better Auth organization / workspace.
 * Org ids are already URL-safe alphanumeric (nanoid-style).
 */
export const getWorkspaceSchemaName = (organizationId: string): string => {
  const suffix = organizationId.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!suffix) {
    throw new Error(
      'Cannot derive workspace schema name from empty organization id',
    );
  }
  return `workspace_${suffix}`;
};
