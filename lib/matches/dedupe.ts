/** Collapse duplicate agent rows (same display name) to one canonical row. */

export interface AgentRowLike {
  id: string;
  name: string;
  elo_rating: number | null;
  created_at?: string | null;
  matches?: Array<{ count: number }>;
}

function matchCount(row: AgentRowLike): number {
  return row.matches?.[0]?.count ?? 0;
}

/**
 * Keep the row with the most official matches; tie-break oldest `created_at`, then lowest id.
 */
export function dedupeAgentRows<T extends AgentRowLike>(rows: T[]): T[] {
  const byName = new Map<string, T>();
  for (const row of rows) {
    const existing = byName.get(row.name);
    if (!existing) {
      byName.set(row.name, row);
      continue;
    }
    const existingMatches = matchCount(existing);
    const rowMatches = matchCount(row);
    if (rowMatches > existingMatches) {
      byName.set(row.name, row);
      continue;
    }
    if (rowMatches < existingMatches) continue;
    const existingCreated = existing.created_at ?? "";
    const rowCreated = row.created_at ?? "";
    if (rowCreated && (!existingCreated || rowCreated < existingCreated)) {
      byName.set(row.name, row);
      continue;
    }
    if (rowCreated === existingCreated && row.id < existing.id) {
      byName.set(row.name, row);
    }
  }
  return [...byName.values()];
}
