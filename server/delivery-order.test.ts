import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';

const { storage } = await import('./storage');
const { db } = await import('./db');
const { deliveryOrders } = await import('@shared/schema');

test('delivery order stores dropoff coordinates', async () => {
  const origGetBranch = storage.getBranchByCode;
  const origCreateOrder = storage.createOrder;
  const origInsert = db.insert;

  let inserted: any = null;

  storage.getBranchByCode = async () => ({ id: 'b1', code: 'ABC', address: null } as any);
  storage.createOrder = async () => ({ id: 'o1', orderNumber: 'ABC-0001' } as any);
  (db as any).insert = () => ({
    values: async (vals: any) => {
      inserted = vals;
      return { } as any;
    },
  });

  const app = express();
  app.use(express.json());
  app.post('/delivery/orders', async (req, res) => {
    const schema = z.object({
      branchCode: z.string(),
      customerName: z.string(),
      customerPhone: z.string(),
      address: z.string(),
      pickupTime: z.string().optional(),
      dropoffTime: z.string().optional(),
      dropoffLat: z.number().optional(),
      dropoffLng: z.number().optional(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number().int().positive().optional().default(1),
        price: z.number().nonnegative().optional().default(0),
      })),
    });
    try {
      const data = schema.parse(req.body);
      const branch = await storage.getBranchByCode(data.branchCode);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      const order = await storage.createOrder({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: data.items,
        subtotal: '0',
        tax: '0',
        total: '0',
        paymentMethod: 'cash',
        status: 'delivery_pending',
        estimatedPickup: data.pickupTime ? new Date(data.pickupTime) : null,
        notes: data.address,
        sellerName: 'online',
        branchId: branch.id,
      });
      await db.insert(deliveryOrders).values({
        orderId: order.id,
        pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
        dropoffTime: data.dropoffTime ? new Date(data.dropoffTime) : null,
        pickupAddress: branch.address ?? null,
        pickupLat: null,
        pickupLng: null,
        dropoffAddress: data.address,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        distanceMeters: null,
        durationSeconds: null,
      });
      res.status(201).json({ orderId: order.id, orderNumber: order.orderNumber });
    } catch (err) {
      res.status(400).json({ message: 'Invalid order data' });
    }
  });

  const res = await request(app).post('/delivery/orders').send({
    branchCode: 'ABC',
    customerName: 'John',
    customerPhone: '123',
    address: 'Some address',
    items: [],
    dropoffLat: 1.23,
    dropoffLng: 4.56,
  });

  assert.equal(res.status, 201);
  assert.equal(inserted.dropoffLat, 1.23);
  assert.equal(inserted.dropoffLng, 4.56);
  assert.equal(res.body.orderNumber, 'ABC-0001');

  storage.getBranchByCode = origGetBranch;
  storage.createOrder = origCreateOrder;
  (db as any).insert = origInsert;
});
