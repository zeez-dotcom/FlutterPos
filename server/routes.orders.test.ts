import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { insertOrderSchema } from '@shared/schema';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
const { requireAuth } = await import('./auth');

function createApp(storage: any) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 'u1', branchId: 'b1' };
    next();
  });
  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder({ ...orderData, branchId: user.branchId });
      res.json(order);
    } catch {
      res.status(400).json({ message: 'Failed to create order' });
    }
  });
  return app;
}

test('accepts ISO string dates for pickup fields', async () => {
  let received: any = null;
  const storage = {
    createOrder: async (data: any) => {
      received = data;
      return { id: 'o1', ...data };
    },
  };
  const app = createApp(storage);
  const iso1 = new Date().toISOString();
  const iso2 = new Date(Date.now() + 3600_000).toISOString();
  const res = await request(app)
    .post('/api/orders')
    .send({
      customerName: 'Alice',
      customerPhone: '123',
      items: [],
      subtotal: '0',
      tax: '0',
      total: '0',
      paymentMethod: 'cash',
      status: 'received',
      sellerName: 'Bob',
      estimatedPickup: iso1,
      actualPickup: iso2,
    });
  assert.equal(res.status, 200);
  assert.ok(received);
  assert(received.estimatedPickup instanceof Date);
  assert(received.actualPickup instanceof Date);
  assert.equal(received.estimatedPickup.toISOString(), iso1);
  assert.equal(received.actualPickup.toISOString(), iso2);
});

