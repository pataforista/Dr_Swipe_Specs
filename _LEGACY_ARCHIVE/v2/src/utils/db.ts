import Dexie, { type EntityTable } from 'dexie';
import { PerlaENARM } from '../types/clinical';

export const db = new Dexie('DrSwipeCodex') as Dexie & {
  pearls: EntityTable<
    PerlaENARM,
    'id' // primary key
  >;
};

// Schema declaration
db.version(1).stores({
  pearls: 'id, title, category, rarity' // primary key "id" (for technical reasons), plus indexed fields
});
