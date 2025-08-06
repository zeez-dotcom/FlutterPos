import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';

const { DatabaseStorage } = await import('./storage');
const { db } = await import('./db');
const { users, clothingItems, laundryServices, itemServicePrices } = await import('../shared/schema');

const baseUser = {
  id: '1',
  username: 'test',
  firstName: 'Old',
  lastName: 'User',
  email: 'test@example.com',
  role: 'user',
  branchId: null,
  passwordHash: 'existing-hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('upsertUser updates existing row when username exists', async () => {
  const storage = new DatabaseStorage();
  const originalInsert = db.insert;
  const originalSelect = db.select;
  let existing: any = null;
  let conflictTarget: any = null;

  (db as any).insert = () => ({
    values: (data: any) => ({
      onConflictDoUpdate: (conflict: any) => {
        conflictTarget = conflict.target;
        if (existing && existing.username === data.username) {
          const hasUsername = Array.isArray(conflict.target)
            ? conflict.target.includes(users.username)
            : conflict.target === users.username;
          if (!hasUsername) {
            throw new Error('unique constraint');
          }
          existing = { ...existing, ...conflict.set };
        } else {
          existing = { ...data };
        }
        return { returning: () => [existing] };
      },
    }),
  });

  (db as any).select = () => ({
    from: () => ({
      leftJoin: () => ({
        where: () => [{ user: existing, branch: null }],
      }),
    }),
  });

  const first = { id: '1', username: 'user', passwordHash: 'hash', role: 'user' };
  await storage.upsertUser(first);

  const second = { id: '2', username: 'user', passwordHash: 'hash2', role: 'user', firstName: 'New' };
  const updated = await storage.upsertUser(second);

  assert.strictEqual(updated.firstName, 'New');
  const hasUsername = Array.isArray(conflictTarget)
    ? conflictTarget.includes(users.username)
    : conflictTarget === users.username;
  assert.strictEqual(hasUsername, true);

  (db as any).insert = originalInsert;
  (db as any).select = originalSelect;
});

test('updateUser without password leaves existing hash untouched', async () => {
  const user = { ...baseUser };
  const originalUpdate = db.update;
  const originalSelect = db.select;
  let setData: any = null;

  (db as any).update = () => ({
    set: (data: any) => {
      setData = data;
      Object.assign(user, data);
      return {
        where: () => ({
          returning: () => [{ id: user.id }],
        }),
      };
    },
  });

  (db as any).select = () => ({
    from: () => ({
      leftJoin: () => ({
        where: () => [{ user, branch: null }],
      }),
    }),
  });

  const storage = new DatabaseStorage();
  const updated = await storage.updateUser(user.id, { firstName: 'New' });

  (db as any).update = originalUpdate;
  (db as any).select = originalSelect;

  assert.strictEqual(setData.passwordHash, undefined);
  assert.strictEqual(updated?.passwordHash, baseUser.passwordHash);
});

test('updateUser with empty password string leaves existing hash untouched', async () => {
  const user = { ...baseUser };
  const originalUpdate = db.update;
  const originalSelect = db.select;
  let setData: any = null;

  (db as any).update = () => ({
    set: (data: any) => {
      setData = data;
      Object.assign(user, data);
      return {
        where: () => ({
          returning: () => [{ id: user.id }],
        }),
      };
    },
  });

  (db as any).select = () => ({
    from: () => ({
      leftJoin: () => ({
        where: () => [{ user, branch: null }],
      }),
    }),
  });

  const storage = new DatabaseStorage();
  const updated = await storage.updateUser(user.id, { firstName: 'New', passwordHash: '' });

  (db as any).update = originalUpdate;
  (db as any).select = originalSelect;

  assert.strictEqual(setData.passwordHash, undefined);
  assert.strictEqual(updated?.passwordHash, baseUser.passwordHash);
});

test('updateUserBranch updates branch only', async () => {
  const user = { ...baseUser };
  const originalUpdate = db.update;
  const originalSelect = db.select;
  let setData: any = null;

  (db as any).update = () => ({
    set: (data: any) => {
      setData = data;
      Object.assign(user, data);
      return {
        where: () => ({
          returning: () => [{ id: user.id }],
        }),
      };
    },
  });

  (db as any).select = () => ({
    from: () => ({
      leftJoin: () => ({
        where: () => [{ user, branch: null }],
      }),
    }),
  });

  const storage = new DatabaseStorage();
  const updated = await storage.updateUserBranch(user.id, 'b1');

  (db as any).update = originalUpdate;
  (db as any).select = originalSelect;

  assert.strictEqual(setData.branchId, 'b1');
  assert.strictEqual(updated?.branchId, 'b1');
});

test('deleteClothingItem returns boolean based on deletion result', async () => {
  const storage = new DatabaseStorage();
  const originalDelete = db.delete;
  (db as any).delete = () => ({ where: () => ({ rowCount: 1 }) });
  assert.strictEqual(await storage.deleteClothingItem('1'), true);
  (db as any).delete = () => ({ where: () => ({ rowCount: 0 }) });
  assert.strictEqual(await storage.deleteClothingItem('1'), false);
  (db as any).delete = originalDelete;
});

test('deleteLaundryService returns boolean based on deletion result', async () => {
  const storage = new DatabaseStorage();
  const originalDelete = db.delete;
  (db as any).delete = () => ({ where: () => ({ rowCount: 1 }) });
  assert.strictEqual(await storage.deleteLaundryService('1'), true);
  (db as any).delete = () => ({ where: () => ({ rowCount: 0 }) });
  assert.strictEqual(await storage.deleteLaundryService('1'), false);
  (db as any).delete = originalDelete;
});

test('createClothingItem seeds default prices for existing services', async () => {
  const storage = new DatabaseStorage();
  const originalTransaction = db.transaction;
  const inserted: any[] = [];

  (db as any).transaction = async (fn: any) => {
    await fn({
      insert: (table: any) => ({
        values: (data: any) => {
          if (table === clothingItems) {
            return { returning: () => [{ id: 'item1', ...data }] };
          }
          if (table === itemServicePrices) {
            inserted.push(data);
            return { onConflictDoNothing: () => ({}) };
          }
          return { returning: () => [] };
        },
      }),
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === laundryServices) {
              return [
                { id: 's1', price: '5.00', userId: 'u1', name: 'Wash', nameAr: null, description: null, categoryId: 'c1' },
                { id: 's2', price: '3.00', userId: 'u1', name: 'Iron', nameAr: null, description: null, categoryId: 'c2' },
              ];
            }
            return [];
          },
        }),
      }),
    });
  };

  await storage.createClothingItem({ name: 'Shirt', categoryId: 'cItem', userId: 'u1', nameAr: undefined, description: undefined, imageUrl: undefined });

  (db as any).transaction = originalTransaction;

  assert.deepEqual(inserted[0], [
    { clothingItemId: 'item1', serviceId: 's1', price: '0.00' },
    { clothingItemId: 'item1', serviceId: 's2', price: '0.00' },
  ]);
});
