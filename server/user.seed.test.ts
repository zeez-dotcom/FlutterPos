import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';

const { DatabaseStorage } = await import('./storage');
const { db } = await import('./db');
import { users, categories, clothingItems, laundryServices } from '@shared/schema';

// test will stub db methods to capture seed inserts

test('new users are seeded with Arabic names', async () => {
  const insertedCategories: any[] = [];
  const insertedClothing: any[] = [];
  const insertedLaundry: any[] = [];
  const insertedUsers: any[] = [];

  const originalInsert = db.insert;
  const originalTransaction = db.transaction;
  const originalSelect = db.select;

  try {
    (db as any).insert = (table: any) => ({
      values: (val: any) => {
        if (table === users) {
          const row = { ...val, id: 'u1' };
          insertedUsers.push(row);
          return { returning: () => [row] };
        }
        throw new Error('unexpected table');
      },
    });

    (db as any).select = () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => [{ user: insertedUsers[0], branch: null }],
        }),
      }),
    });

    (db as any).transaction = async (cb: any) => {
      const tx = {
        insert: (table: any) => ({
          values: (vals: any) => {
            if (table === categories) {
              const withIds = vals.map((v: any, i: number) => ({ ...v, id: `c${insertedCategories.length + i}` }));
              insertedCategories.push(...withIds);
            } else if (table === clothingItems) {
              const withIds = vals.map((v: any, i: number) => ({ ...v, id: `ci${insertedClothing.length + i}` }));
              insertedClothing.push(...withIds);
            } else if (table === laundryServices) {
              const withIds = vals.map((v: any, i: number) => ({ ...v, id: `ls${insertedLaundry.length + i}` }));
              insertedLaundry.push(...withIds);
            }
            return { onConflictDoNothing: async () => {} };
          },
        }),
        select: () => ({
          from: (table: any) => ({
            where: () => {
              if (table === categories) return insertedCategories;
              return [];
            },
          }),
        }),
      };
      await cb(tx);
    };

    const storage = new DatabaseStorage();
    await storage.createUser({ username: 'newuser', passwordHash: 'pw' });

    assert.ok(
      insertedCategories.some(
        (c) => c.name === 'Normal Iron' && c.nameAr === 'كي عادي'
      )
    );
    assert.ok(
      insertedClothing.some((i) => i.name === 'Thobe' && i.nameAr === 'ثوب')
    );
    assert.ok(
      insertedLaundry.some((s) => s.name === 'Thobe' && s.nameAr === 'ثوب')
    );
  } finally {
    (db as any).insert = originalInsert;
    (db as any).transaction = originalTransaction;
    (db as any).select = originalSelect;
  }
});

