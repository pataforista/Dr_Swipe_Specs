// Shared by regen_index.js (build time) and the tests. The app never classifies
// ids itself: it reads the groups from public/cases/manifest.json.

/** Groups offered by the specialty chips. Everything else falls into `im`. */
export const SPECIALTY_GROUPS = ['im', 'ped', 'go', 'surg'];

/** Case ids look like `PROC_PED_EXANT_MEASLES_001_014`; the area is the 2nd token. */
export function groupOf(id) {
  if (/^SWIPE_/.test(id)) return null; // legacy swipe-only cards, never played as a shift
  const area = id.split('_')[1] ?? '';
  if (area === 'PED') return 'ped';
  if (area === 'GYN' || area === 'OBS' || area === 'OBG') return 'go';
  if (area === 'SURG') return 'surg';
  return 'im';
}

/** @param {string[]} ids sorted case ids (without the CASE_ prefix) */
export function buildManifest(ids) {
  const specialties = Object.fromEntries(SPECIALTY_GROUPS.map(g => [g, []]));
  for (const id of ids) {
    const g = groupOf(id);
    if (g) specialties[g].push(id);
  }
  return { version: 1, total: ids.length, specialties };
}
