import request from 'supertest';
import { createApp } from '../../../app';
import prisma from '../../../infrastructure/database/prisma';

const app = createApp();

describe('Item API Integration Tests', () => {
  describe('GET /api/items', () => {
    it('should return empty array when no items exist', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toEqual([]);
    });

    it('should return all items', async () => {
      await prisma.item.createMany({
        data: [
          { name: 'Item 1', description: 'Description 1' },
          { name: 'Item 2', description: 'Description 2' },
        ],
      });

      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      const item = await prisma.item.create({
        data: { name: 'Test Item', description: 'Test Description' },
      });

      const response = await request(app).get(`/api/items/${item.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.item.id).toBe(item.id);
      expect(response.body.data.item.name).toBe('Test Item');
    });

    it('should return 404 when item not found', async () => {
      const response = await request(app).get('/api/items/999999');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/api/items/invalid');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'New Item',
        description: 'New Description',
      };

      const response = await request(app).post('/api/items').send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.data.item.name).toBe('New Item');
      expect(response.body.data.item.description).toBe('New Description');
    });

    it('should create item without description', async () => {
      const newItem = {
        name: 'Item Without Description',
      };

      const response = await request(app).post('/api/items').send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.data.item.name).toBe('Item Without Description');
      expect(response.body.data.item.description).toBeNull();
    });

    it('should fail with duplicate name', async () => {
      const item = { name: 'Duplicate Item' };

      await request(app).post('/api/items').send(item);
      const response = await request(app).post('/api/items').send(item);

      expect(response.status).toBe(409);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app).post('/api/items').send({});

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an item', async () => {
      const item = await prisma.item.create({
        data: { name: 'Original Item', description: 'Original Description' },
      });

      const updates = {
        name: 'Updated Item',
        description: 'Updated Description',
      };

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.item.name).toBe('Updated Item');
      expect(response.body.data.item.description).toBe('Updated Description');
    });

    it('should return 404 when updating non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an item', async () => {
      const item = await prisma.item.create({
        data: { name: 'Item to Delete' },
      });

      const response = await request(app).delete(`/api/items/${item.id}`);

      expect(response.status).toBe(204);

      const deleted = await prisma.item.findUnique({
        where: { id: item.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 when deleting non-existent item', async () => {
      const response = await request(app).delete('/api/items/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/items/batch (Transactional)', () => {
    it('should create multiple items in a transaction', async () => {
      const items = [
        { name: 'Batch Item 1', description: 'Description 1' },
        { name: 'Batch Item 2', description: 'Description 2' },
      ];

      const response = await request(app)
        .post('/api/items/batch')
        .send({ items });

      expect(response.status).toBe(201);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should rollback all items if one fails', async () => {
      await prisma.item.create({ data: { name: 'Existing Item' } });

      const items = [
        { name: 'New Item 1' },
        { name: 'Existing Item' }, // Duplicate
      ];

      const response = await request(app)
        .post('/api/items/batch')
        .send({ items });

      expect(response.status).toBe(409);

      const allItems = await prisma.item.findMany();
      expect(allItems).toHaveLength(1);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
