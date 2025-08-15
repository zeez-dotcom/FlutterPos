import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { insertProductSchema } from '@shared/schema';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';

const { requireAuth, requireAdminOrSuperAdmin } = await import('./auth');

function createApp(storage: any, opts: { authenticated?: boolean } = {}) {
  const app = express();
  const { authenticated = true } = opts;
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => authenticated;
    if (authenticated) {
      req.user = { id: 'u1', branchId: 'b1', role: 'admin' };
    }
    next();
  });

  app.get('/api/products', async (req, res, next) => {
    const branchCode = req.query.branchCode as string | undefined;
    if (!branchCode) return next();
    try {
      const branch = await storage.getBranchByCode(branchCode);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      let items = categoryId
        ? await storage.getProductsByCategory(categoryId, branch.id)
        : await storage.getProducts(branch.id);
      if (search) {
        const term = search.toLowerCase();
        items = items.filter(
          (p: any) =>
            p.name.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term),
        );
      }
      res.json(items);
    } catch {
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  }, requireAuth, async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      const user = req.user as any;
      let items = categoryId
        ? await storage.getProductsByCategory(categoryId, user.branchId)
        : await storage.getProducts(user.branchId);
      if (search) {
        const term = search.toLowerCase();
        items = items.filter(
          (p: any) =>
            p.name.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term),
        );
      }
      res.json(items);
    } catch {
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.branchId) {
        return res.status(400).json({ message: 'User is not assigned to a branch' });
      }
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({ ...validated, branchId: user.branchId });
      res.json(product);
    } catch {
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  return app;
}

test('GET /api/products filters by search and category', async () => {
  const products = [
    { id: 'p1', name: 'Soap', description: 'Hand soap', categoryId: 'c1' },
    { id: 'p2', name: 'Shampoo', description: 'Hair cleaner', categoryId: 'c2' },
  ];
  const storage = {
    getProducts: async (_branchId: string) => products,
    getProductsByCategory: async (categoryId: string, _branchId: string) =>
      products.filter((p) => p.categoryId === categoryId),
    createProduct: async (_data: any) => ({})
  };
  const app = createApp(storage);
  const res1 = await request(app).get('/api/products').query({ search: 'soap' });
  assert.equal(res1.status, 200);
  assert.deepEqual(res1.body, [products[0]]);

  const res2 = await request(app).get('/api/products').query({ categoryId: 'c2' });
  assert.equal(res2.status, 200);
  assert.deepEqual(res2.body, [products[1]]);
});

test('POST /api/products attaches user branchId', async () => {
  let created: any = null;
  const storage = {
    createProduct: async (data: any) => {
      created = data;
      return { id: 'p1', ...data };
    },
    getProducts: async (_branchId: string) => [],
    getProductsByCategory: async (_categoryId: string, _branchId: string) => [],
  };
  const app = createApp(storage);
  const res = await request(app)
    .post('/api/products')
    .send({ name: 'Soap', price: '1.00', stock: 2 });
  assert.equal(res.status, 200);
  assert.ok(created);
  assert.equal(created.branchId, 'b1');
});

test('GET /api/products allows anonymous access with branchCode', async () => {
  const products = [{ id: 'p1', name: 'Soap', description: 'Hand soap', categoryId: 'c1' }];
  const storage = {
    getBranchByCode: async (code: string) => (code === 'BR1' ? { id: 'b1', code: 'BR1' } : undefined),
    getProducts: async (branchId: string) => (branchId === 'b1' ? products : []),
    getProductsByCategory: async (_categoryId: string, _branchId: string) => [],
    createProduct: async (_data: any) => ({}),
  };
  const app = createApp(storage, { authenticated: false });
  const res = await request(app).get('/api/products').query({ branchCode: 'BR1' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, products);
});

