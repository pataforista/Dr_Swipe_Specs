export const SPECIALTY_GROUPS: string[];
export function groupOf(id: string): string | null;
export function buildManifest(ids: string[]): {
  version: number;
  total: number;
  specialties: Record<string, string[]>;
};
