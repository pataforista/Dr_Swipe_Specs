import { describe, it, expect } from 'vitest';
import { ClinicalCaseSchema } from '../utils/caseSchema';

const modules = import.meta.glob('../../../cases/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const entries = Object.entries(modules).filter(([file]) => !file.endsWith('case_index.json'));

describe('clinical case files', () => {
  it('finds the case corpus', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every case passes the Zod schema', () => {
    const failures: string[] = [];
    for (const [file, data] of entries) {
      const result = ClinicalCaseSchema.safeParse(data);
      if (!result.success) {
        const first = result.error.issues[0];
        failures.push(`${file}: ${first.path.join('.')}: ${first.message}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
