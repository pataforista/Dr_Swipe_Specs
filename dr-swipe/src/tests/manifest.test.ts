import { describe, it, expect } from 'vitest';
import { buildManifest, groupOf } from '../../manifest.js';
import { idsForSpecialty } from '../utils/dataLoader';

const ids = [
  'PROC_PED_EXANT_MEASLES_001_001',
  'PROC_OBS_GDM_DX_001_001',
  'PROC_GYN_CANCER_BREAST_001_001',
  'PROC_SURG_ATLS_TENSION_PNEUMO_001_001',
  'PROC_INT_AMI_001_001',
  'PROC_ENDO_DM2_MANAGEMENT_001_001',
  'SWIPE_LEGACY_001',
];

describe('case manifest', () => {
  it('groups ids by area and drops legacy swipe cards', () => {
    expect(groupOf('PROC_PED_X_001_001')).toBe('ped');
    expect(groupOf('PROC_OBG_HEMORRHAGE_HPP_001_001')).toBe('go');
    expect(groupOf('PROC_NEUR_STROKE_ISCHEMIC_001_001')).toBe('im');
    expect(groupOf('SWIPE_LEGACY_001')).toBeNull();
  });

  it('builds a manifest whose groups partition the playable cases', () => {
    const m = buildManifest(ids);
    expect(m.specialties.ped).toHaveLength(1);
    expect(m.specialties.go).toHaveLength(2);
    expect(m.specialties.surg).toHaveLength(1);
    expect(m.specialties.im).toHaveLength(2);
    expect(Object.values(m.specialties).flat()).not.toContain('SWIPE_LEGACY_001');
  });

  it('idsForSpecialty returns every playable id for "all" and nothing for unknown chips', () => {
    const m = buildManifest(ids);
    expect(idsForSpecialty(m, 'all')).toHaveLength(6);
    expect(idsForSpecialty(m, 'GO')).toHaveLength(2);
    expect(idsForSpecialty(m, 'dermatology')).toEqual([]);
  });
});
