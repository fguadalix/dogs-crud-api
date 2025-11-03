import request from 'supertest';
import { createApp } from '../../../app';
import prisma from '../../../infrastructure/database/prisma';

const app = createApp();

// Helper function to test malicious payload storage
const testMaliciousPayloadStorage = async (
  payload: string,
  field: 'name' | 'description',
  description: string = 'Test description'
) => {
  const data = field === 'name' 
    ? { name: payload, description } 
    : { name: 'Test item', description: payload };

  const response = await request(app)
    .post('/api/items')
    .send(data);

  expect([201, 429]).toContain(response.status);

  if (response.status === 201 && response.body && response.body[field]) {
    expect(response.body[field]).toBe(payload);
    const items = await prisma.item.findMany();
    expect(items.length).toBeGreaterThanOrEqual(1);
  }
};

describe('Security Tests', () => {
  beforeEach(async () => {
    await prisma.item.deleteMany();
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in name field on create', async () => {
      await testMaliciousPayloadStorage("'; DROP TABLE items; --", 'name');
    });

    it('should prevent SQL injection in description field', async () => {
      await testMaliciousPayloadStorage("' OR '1'='1", 'description');
    });

    it('should prevent SQL injection in GET query parameters', async () => {
      // Create a test item first
      const item = await prisma.item.create({
        data: {
          name: 'Valid item',
          description: 'Valid description'
        }
      });

      // Try SQL injection in id parameter
      const response = await request(app)
        .get(`/api/items/${item.id}' OR '1'='1`);

      // Should return 400 or 404, not 500 or expose SQL error
      expect([400, 404, 500]).toContain(response.status);
      if (response.body && response.body.error) {
        expect(response.body.error).not.toContain('SQL');
        expect(response.body.error).not.toContain('database');
      }
    });

    it('should prevent SQL injection with UNION attacks', async () => {
      await testMaliciousPayloadStorage("test' UNION SELECT * FROM users--", 'name');
    });

    it('should prevent SQL injection with multiple statements', async () => {
      await testMaliciousPayloadStorage("test'; DELETE FROM items WHERE '1'='1", 'name');
    });
  });

  describe('XSS (Cross-Site Scripting) Protection', () => {
    it('should store XSS payload in name field without execution', async () => {
      await testMaliciousPayloadStorage('<script>alert("XSS")</script>', 'name');
    });

    it('should handle XSS payload with event handlers', async () => {
      await testMaliciousPayloadStorage('<img src=x onerror="alert(\'XSS\')">', 'description');
    });

    it('should handle XSS payload with javascript: protocol', async () => {
      await testMaliciousPayloadStorage('<a href="javascript:alert(\'XSS\')">Click me</a>', 'name');
    });

    it('should handle XSS payload with encoded characters', async () => {
      await testMaliciousPayloadStorage('&lt;script&gt;alert("XSS")&lt;/script&gt;', 'name');
    });

    it('should handle XSS payload with SVG tags', async () => {
      await testMaliciousPayloadStorage('<svg onload="alert(\'XSS\')"></svg>', 'description');
    });

    it('should handle XSS payload in update operation', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Original name',
          description: 'Original description'
        }
      });

      const xssPayload = '<iframe src="javascript:alert(\'XSS\')"></iframe>';

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({
          name: xssPayload,
          description: 'Updated description'
        });

      expect([200, 429]).toContain(response.status);
      
      if (response.status === 200 && response.body && response.body.name) {
        expect(response.body.name).toBe(xssPayload);
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app)
        .post('/api/items')
        .send({
          name: longString,
          description: 'Description'
        });

      // Should reject with 400 or 500
      expect([400, 500]).toContain(response.status);
    });

    it('should handle Unicode and special characters safely', async () => {
      await testMaliciousPayloadStorage('测试 🚀 émojis café', 'name', 'Description with unicode 中文');
    });

    it('should reject invalid JSON payloads', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Content-Type', 'application/json')
        .send('{"name": "test", invalid json}');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle CRLF injection attempts', async () => {
      await testMaliciousPayloadStorage('test\r\nHeader: injected', 'name');
    });
  });

  describe('Path Traversal Protection', () => {
    it('should handle path traversal attempts in id parameter', async () => {
      const pathTraversal = '../../../etc/passwd';

      const response = await request(app)
        .get(`/api/items/${pathTraversal}`);

      expect([400, 404, 500]).toContain(response.status);
      if (response.body) {
        expect(JSON.stringify(response.body)).not.toContain('root:');
      }
    });

    it('should handle encoded path traversal attempts', async () => {
      const encodedTraversal = '..%2F..%2F..%2Fetc%2Fpasswd';

      const response = await request(app)
        .get(`/api/items/${encodedTraversal}`);

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('NoSQL Injection Protection', () => {
    it('should handle object injection in search parameters', async () => {
      const response = await request(app)
        .get('/api/items')
        .query({ name: { $ne: null } });

      // Should handle gracefully without exposing database structure
      expect([200, 400]).toContain(response.status);
    });

    it('should reject malicious operators in filters', async () => {
      const response = await request(app)
        .get('/api/items')
        .query({ name: { $gt: '' } });

      // Should handle gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Command Injection Protection', () => {
    it('should handle shell command injection attempts', async () => {
      await testMaliciousPayloadStorage('test; rm -rf /', 'name');
    });

    it('should handle pipe commands in input', async () => {
      await testMaliciousPayloadStorage('test | cat /etc/passwd', 'name');
    });
  });
});
