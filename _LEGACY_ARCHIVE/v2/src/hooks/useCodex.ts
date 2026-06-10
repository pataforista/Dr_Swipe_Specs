import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../utils/db';
import { PerlaENARM } from '../types/clinical';

export const useCodex = () => {
  const unlockedPearls = useLiveQuery(() => db.pearls.toArray()) || [];

  const addPearlToCodex = async (perla: PerlaENARM) => {
    try {
      await db.pearls.put(perla);
    } catch (error) {
      console.error("Failed to save pearl to codex:", error);
    }
  };

  const isPearlUnlocked = (id: string) => {
    return unlockedPearls.some(p => p.id === id);
  };

  return { 
    unlockedPearls, 
    addPearlToCodex, 
    isPearlUnlocked,
    totalCount: unlockedPearls.length 
  };
};
