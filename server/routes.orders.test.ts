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

function createCustomerOrdersApp(storage: any) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 'u1', branchId: 'b1' };
    next();
  });
  app.get('/api/customers/:customerId/orders', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const orders = await storage.getOrdersByCustomer(req.params.customerId, user.branchId);
      res.json(
        orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          subtotal: o.subtotal,
          paid: o.paid,
          remaining: o.remaining,
        })),
      );
    } catch {
      res.status(500).json({ message: 'Failed to fetch customer orders' });
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

test('pay-later order remaining decreases with payments', async () => {
  const storage = (() => {
    const orders = [
      {
        id: 'o1',
        orderNumber: '001',
        customerId: 'c1',
        createdAt: new Date().toISOString(),
        subtotal: '100.00',
        total: '100.00',
      },
    ];
    const payments: any[] = [];
    return {
      orders,
      payments,
      async getOrdersByCustomer() {
        return orders.map((o) => {
          const paid = payments
            .filter((p) => p.orderId === o.id)
            .reduce((sum, p) => sum + Number(p.amount), 0);
          const remaining = Number(o.total) - paid;
          return {
            ...o,
            paid: paid.toFixed(2),
            remaining: remaining.toFixed(2),
          };
        });
      },
    };
  })();

  const app = createCustomerOrdersApp(storage);

  let res = await request(app).get('/api/customers/c1/orders');
  assert.equal(res.status, 200);
  assert.equal(res.body[0].paid, '0.00');
  assert.equal(res.body[0].remaining, '100.00');

  storage.payments.push({ id: 'p1', orderId: 'o1', amount: '40.00' });

  res = await request(app).get('/api/customers/c1/orders');
  assert.equal(res.status, 200);
  assert.equal(res.body[0].paid, '40.00');
  assert.equal(res.body[0].remaining, '60.00');
});

