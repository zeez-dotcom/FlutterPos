import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

// Ensure DATABASE_URL is set to allow importing auth module without DB
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';

const { requireAdminOrSuperAdmin } = await import('./auth');

function createApp(user?: { role: string }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.isAuthenticated = () => Boolean(user);
    if (user) {
      req.user = user;
    }
    next();
  });
  // Routes under test
  app.post('/api/clothing-items', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  app.put('/api/clothing-items/:id', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  app.post('/api/laundry-services', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  app.put('/api/laundry-services/:id', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  app.delete('/api/clothing-items/:id', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  app.delete('/api/laundry-services/:id', requireAdminOrSuperAdmin, (_req, res) => res.json({ ok: true }));
  return app;
}

test('non-admin requests receive 403', async () => {
  const app = createApp();
  await request(app).post('/api/clothing-items').send({}).expect(403);
  await request(app).put('/api/clothing-items/1').send({}).expect(403);
  await request(app).post('/api/laundry-services').send({}).expect(403);
  await request(app).put('/api/laundry-services/1').send({}).expect(403);
  await request(app).delete('/api/clothing-items/1').expect(403);
  await request(app).delete('/api/laundry-services/1').expect(403);
});

test('admin requests can modify items', async () => {
  const app = createApp({ role: 'admin' });
  const res1 = await request(app).post('/api/clothing-items').send({});
  assert.equal(res1.status, 200);
  const res2 = await request(app).put('/api/clothing-items/1').send({});
  assert.equal(res2.status, 200);
  const res3 = await request(app).post('/api/laundry-services').send({});
  assert.equal(res3.status, 200);
  const res4 = await request(app).put('/api/laundry-services/1').send({});
  assert.equal(res4.status, 200);
  const res5 = await request(app).delete('/api/clothing-items/1');
  assert.equal(res5.status, 200);
  const res6 = await request(app).delete('/api/laundry-services/1');
  assert.equal(res6.status, 200);
});
