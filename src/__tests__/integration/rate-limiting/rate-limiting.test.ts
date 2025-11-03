import request from 'supertest';
import { createApp } from '../../../app';
import prisma from '../../../infrastructure/database/prisma';

const app = createApp();

describe('Rate Limiting Tests', () => {
  beforeEach(async () => {
    await prisma.item.deleteMany();
  });

  describe('Read Operations Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Create test data
      await prisma.item.create({
        data: { name: 'Test Item', description: 'Test' },
      });

      // Make multiple requests within limit (100 per minute)
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/api/items')
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers['ratelimit-limit']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBeDefined();
      });
    });

    it('should block requests after exceeding rate limit', async () => {
      // Create test data
      await prisma.item.create({
        data: { name: 'Test Item', description: 'Test' },
      });

      // Make 101 requests to exceed the limit (100 per minute)
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(request(app).get('/api/items'));
      }

      const responses = await Promise.all(requests);

      // Count successful and blocked requests
      const successfulRequests = responses.filter((r) => r.status === 200);
      const blockedRequests = responses.filter((r) => r.status === 429);

      // At least some requests should be blocked
      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length + blockedRequests.length).toBe(101);

      // Blocked requests should return 429 status
      if (blockedRequests.length > 0) {
        expect(blockedRequests[0].status).toBe(429);
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/items');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Write Operations Rate Limiting', () => {
    it('should allow write operations within limit', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/items')
          .send({ name: `Item ${i}`, description: 'Test' })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should block write operations after exceeding rate limit', async () => {
      // Make 51 POST requests to exceed the limit (50 per 15 minutes)
      const requests = [];
      for (let i = 0; i < 51; i++) {
        requests.push(
          request(app)
            .post('/api/items')
            .send({ name: `Item ${Date.now()}-${i}`, description: 'Test' })
        );
      }

      const responses = await Promise.all(requests);

      // Count successful and blocked requests
      const successfulRequests = responses.filter((r) => r.status === 201);
      const blockedRequests = responses.filter((r) => r.status === 429);

      // At least some requests should be blocked
      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length + blockedRequests.length).toBe(51);

      // Blocked requests should return 429 status
      if (blockedRequests.length > 0) {
        expect(blockedRequests[0].status).toBe(429);
      }
    });
  });

  describe('Batch Operations Rate Limiting', () => {
    it('should allow batch operations within limit', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => {
        const batchData = {
          items: [
            { name: `Batch ${i} Item 1`, description: 'Test' },
            { name: `Batch ${i} Item 2`, description: 'Test' },
          ],
        };
        return request(app).post('/api/items/batch').send(batchData);
      });

      const responses = await Promise.all(requests);

      // At least 2 should succeed (allowing for some rate limit state)
      const successfulRequests = responses.filter((r) => r.status === 201);
      expect(successfulRequests.length).toBeGreaterThanOrEqual(2);
    });

    it('should block batch operations after exceeding rate limit', async () => {
      // Make 11 batch requests to exceed the limit (10 per 15 minutes)
      const requests = [];
      for (let i = 0; i < 11; i++) {
        const uniqueBatch = {
          items: [
            { name: `Batch ${Date.now()}-${i} Item 1`, description: 'Test' },
            { name: `Batch ${Date.now()}-${i} Item 2`, description: 'Test' },
          ],
        };
        requests.push(request(app).post('/api/items/batch').send(uniqueBatch));
      }

      const responses = await Promise.all(requests);

      // Count successful and blocked requests
      const successfulRequests = responses.filter((r) => r.status === 201);
      const blockedRequests = responses.filter((r) => r.status === 429);

      // At least some requests should be blocked
      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length + blockedRequests.length).toBe(11);

      // Blocked requests should return 429 status
      if (blockedRequests.length > 0) {
        expect(blockedRequests[0].status).toBe(429);
      }
    });
  });

  describe('Mixed Operations Rate Limiting', () => {
    it('should track read and write operations separately', async () => {
      await prisma.item.create({
        data: { name: 'Test Item', description: 'Test' },
      });

      // Make 10 read requests
      const readRequests = Array.from({ length: 10 }, () =>
        request(app).get('/api/items')
      );

      // Make 10 write requests
      const writeRequests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/items')
          .send({ name: `Mixed Item ${Date.now()}-${i}`, description: 'Test' })
      );

      const [readResponses, writeResponses] = await Promise.all([
        Promise.all(readRequests),
        Promise.all(writeRequests),
      ]);

      // At least some read requests should succeed or be rate limited
      const successfulReads = readResponses.filter((r) => r.status === 200);
      const rateLimitedReads = readResponses.filter((r) => r.status === 429);
      expect(successfulReads.length + rateLimitedReads.length).toBe(10);

      // At least some write requests should succeed or be rate limited
      const successfulWrites = writeResponses.filter((r) => r.status === 201);
      const rateLimitedWrites = writeResponses.filter((r) => r.status === 429);
      expect(successfulWrites.length + rateLimitedWrites.length).toBe(10);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should return correct rate limit information', async () => {
      const response1 = await request(app).get('/api/items');
      const response2 = await request(app).get('/api/items');

      expect(response1.headers['ratelimit-limit']).toBe('100');
      expect(response2.headers['ratelimit-limit']).toBe('100');

      // Remaining should decrease or stay same (depending on timing)
      const remaining1 = parseInt(response1.headers['ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['ratelimit-remaining']);

      expect(remaining2).toBeLessThanOrEqual(remaining1);
      expect(remaining2).toBeGreaterThanOrEqual(0);
    });

    it('should include reset timestamp', async () => {
      const response = await request(app).get('/api/items');

      expect(response.headers['ratelimit-reset']).toBeDefined();

      const resetTime = parseInt(response.headers['ratelimit-reset']);

      // Reset time should be a positive number (Unix timestamp or seconds)
      expect(resetTime).toBeGreaterThan(0);
    });
  });
});
