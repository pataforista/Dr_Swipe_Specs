import { useEffect, useRef } from 'react';
import type { CaseResult } from '../types/game';

/**
 * Sends each finished case to `commit` exactly once per shift.
 * The ref survives StrictMode's double effect run, and the machine state is not
 * persisted, so reloading the page cannot replay a commit. A new shift is
 * recognised by its `startedAt`.
 */
export function useSessionCommit(
  startedAt: number,
  caseResults: CaseResult[],
  commit: (results: CaseResult[]) => void,
) {
  const done = useRef({ startedAt: 0, count: 0 });
  useEffect(() => {
    if (done.current.startedAt !== startedAt) done.current = { startedAt, count: 0 };
    if (startedAt === 0 || caseResults.length <= done.current.count) return;
    commit(caseResults.slice(done.current.count));
    done.current.count = caseResults.length;
  }, [startedAt, caseResults, commit]);
}
