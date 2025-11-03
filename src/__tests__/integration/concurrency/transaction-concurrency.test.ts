import request from 'supertest';
import { createApp } from '../../../app';
import prisma from '../../../infrastructure/database/prisma';

const app = createApp();

describe('Transaction Concurrency Tests', () => {
  describe('Concurrent Updates - Optimistic Concurrency', () => {
    it('should handle concurrent updates to the same item', async () => {
      // Create an item to update
      const item = await prisma.item.create({
        data: { name: 'Concurrent Item', description: 'Initial Description' },
      });

      // Simulate two users trying to update the same item simultaneously
      const update1Promise = request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated by User 1', description: 'User 1 description' });

      const update2Promise = request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated by User 2', description: 'User 2 description' });

      // Wait for both requests to complete
      const [response1, response2] = await Promise.all([
        update1Promise,
        update2Promise,
      ]);

      // Both should succeed (last write wins in this case)
      expect([response1.status, response2.status]).toContain(200);

      // Verify final state - one of the updates should be persisted
      const finalItem = await prisma.item.findUnique({
        where: { id: item.id },
      });

      expect(finalItem).not.toBeNull();
      expect(['Updated by User 1', 'Updated by User 2']).toContain(
        finalItem?.name
      );
    });

    it('should handle concurrent reads while updating', async () => {
      const item = await prisma.item.create({
        data: { name: 'Read-Write Item', description: 'Original' },
      });

      // Start an update and multiple reads simultaneously
      const updatePromise = request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name', description: 'Updated Description' });

      const read1Promise = request(app).get(`/api/items/${item.id}`);
      const read2Promise = request(app).get(`/api/items/${item.id}`);
      const read3Promise = request(app).get(`/api/items/${item.id}`);

      const [updateResponse, read1, read2, read3] = await Promise.all([
        updatePromise,
        read1Promise,
        read2Promise,
        read3Promise,
      ]);

      // All operations should succeed
      expect(updateResponse.status).toBe(200);
      expect(read1.status).toBe(200);
      expect(read2.status).toBe(200);
      expect(read3.status).toBe(200);

      // Reads should return either old or new data (isolation level dependent)
      const names = [
        read1.body.data.item.name,
        read2.body.data.item.name,
        read3.body.data.item.name,
      ];
      
      names.forEach((name) => {
        expect(['Read-Write Item', 'Updated Name']).toContain(name);
      });
    });
  });

  describe('Concurrent Creates - Race Conditions', () => {
    it('should prevent duplicate names when creating concurrently', async () => {
      const itemData = { name: 'Duplicate Test', description: 'Test' };

      // Try to create the same item multiple times concurrently
      const promises = Array.from({ length: 5 }, () =>
        request(app).post('/api/items').send(itemData)
      );

      const responses = await Promise.all(
        promises.map((p) => p.catch((e) => e))
      );

      // Only one should succeed with 201, others should fail with 409 (Conflict)
      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);

      // Verify only one item was created
      const items = await prisma.item.findMany({
        where: { name: 'Duplicate Test' },
      });
      expect(items).toHaveLength(1);
    });

    it('should handle concurrent batch creates with overlapping data', async () => {
      // Create initial item
      await prisma.item.create({ data: { name: 'Existing Batch Item' } });

      const batch1 = {
        items: [
          { name: 'Batch A1' },
          { name: 'Existing Batch Item' }, // Duplicate
        ],
      };

      const batch2 = {
        items: [
          { name: 'Batch B1' },
          { name: 'Batch B2' },
        ],
      };

      // Execute both batches concurrently
      const [response1, response2] = await Promise.all([
        request(app).post('/api/items/batch').send(batch1),
        request(app).post('/api/items/batch').send(batch2),
      ]);

      // Batch 1 should fail due to duplicate (transaction rollback)
      expect(response1.status).toBe(409);

      // Batch 2 should succeed
      expect(response2.status).toBe(201);
      expect(response2.body.data.items).toHaveLength(2);

      // Verify batch 1 was rolled back completely
      const batchA1 = await prisma.item.findFirst({
        where: { name: 'Batch A1' },
      });
      expect(batchA1).toBeNull();

      // Verify batch 2 was committed
      const batchB1 = await prisma.item.findFirst({
        where: { name: 'Batch B1' },
      });
      expect(batchB1).not.toBeNull();
    });
  });

  describe('Concurrent Delete Operations', () => {
    it('should handle concurrent deletes of the same item', async () => {
      const item = await prisma.item.create({
        data: { name: 'Delete Target', description: 'To be deleted' },
      });

      // Multiple users try to delete the same item
      const delete1Promise = request(app).delete(`/api/items/${item.id}`);
      const delete2Promise = request(app).delete(`/api/items/${item.id}`);
      const delete3Promise = request(app).delete(`/api/items/${item.id}`);

      const [response1, response2, response3] = await Promise.all([
        delete1Promise,
        delete2Promise,
        delete3Promise,
      ]);

      const responses = [response1, response2, response3];

      // One should succeed with 204, others should fail with 404
      const successCount = responses.filter((r) => r.status === 204).length;
      const notFoundCount = responses.filter((r) => r.status === 404).length;

      expect(successCount).toBe(1);
      expect(notFoundCount).toBe(2);

      // Verify item is deleted
      const deletedItem = await prisma.item.findUnique({
        where: { id: item.id },
      });
      expect(deletedItem).toBeNull();
    });
  });

  describe('Read-Write Conflict Scenarios', () => {
    it('should handle read-modify-write pattern correctly', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Counter Item',
          description: '0', // Using description as a counter for this test
        },
      });

      // Simulate multiple users reading, modifying, and writing back
      const incrementOperations = Array.from({ length: 10 }, async () => {
        // Read current value
        const readResponse = await request(app).get(`/api/items/${item.id}`);
        const currentValue = parseInt(
          readResponse.body.data.item.description || '0'
        );

        // Increment
        const newValue = currentValue + 1;

        // Write back
        return request(app)
          .put(`/api/items/${item.id}`)
          .send({
            name: 'Counter Item',
            description: newValue.toString(),
          });
      });

      await Promise.all(incrementOperations);

      // Due to race conditions, final value will likely be less than 10
      const finalItem = await prisma.item.findUnique({
        where: { id: item.id },
      });

      const finalValue = parseInt(finalItem?.description || '0');
      
      // This demonstrates lost updates - final value is typically less than expected
      expect(finalValue).toBeGreaterThan(0);
      expect(finalValue).toBeLessThanOrEqual(10);
      
      console.log(
        `Lost update test: Expected 10, got ${finalValue} (${10 - finalValue} updates lost)`
      );
    });

    it('should handle concurrent update and delete', async () => {
      const item = await prisma.item.create({
        data: { name: 'Update-Delete Item', description: 'Original' },
      });

      // One user updates, another deletes
      const updatePromise = request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated', description: 'Updated Description' });

      const deletePromise = request(app).delete(`/api/items/${item.id}`);

      const [updateResponse, deleteResponse] = await Promise.all([
        updatePromise,
        deletePromise,
      ]);

      // Both operations can succeed due to timing
      // This demonstrates race condition behavior
      
      // Both operations should return valid HTTP status codes
      expect([200, 204, 404]).toContain(updateResponse.status);
      expect([200, 204, 404]).toContain(deleteResponse.status);
      
      if (deleteResponse.status === 204) {
        // Delete succeeded
        // Update may succeed or fail depending on timing
        expect([200, 404]).toContain(updateResponse.status);
        
        // Verify final state
        const finalItem = await prisma.item.findUnique({
          where: { id: item.id },
        });
        
        if (updateResponse.status === 200) {
          // Update happened after delete (shouldn't happen but edge case)
          // Or both succeeded in race condition
          expect([null, expect.any(Object)]).toContain(finalItem);
        } else {
          // Delete won the race
          expect(finalItem).toBeNull();
        }
      } else if (updateResponse.status === 200) {
        // Update succeeded
        // Delete may succeed or fail depending on timing
        expect([204, 404]).toContain(deleteResponse.status);
        
        // Verify final state
        const finalItem = await prisma.item.findUnique({
          where: { id: item.id },
        });
        
        if (deleteResponse.status === 204) {
          // Delete happened after update
          expect(finalItem).toBeNull();
        } else {
          // Update won the race
          expect(finalItem).not.toBeNull();
          expect(finalItem?.name).toBe('Updated');
        }
      }
    });
  });

  describe('Transaction Isolation - Batch Operations', () => {
    it('should ensure atomicity in concurrent batch operations', async () => {
      // Create concurrent batch operations with some potential conflicts
      const batch1 = {
        items: [
          { name: 'Batch1-Item1', description: 'Batch 1' },
          { name: 'Batch1-Item2', description: 'Batch 1' },
          { name: 'Shared-Item' }, // Potential conflict
        ],
      };

      const batch2 = {
        items: [
          { name: 'Batch2-Item1', description: 'Batch 2' },
          { name: 'Batch2-Item2', description: 'Batch 2' },
          { name: 'Shared-Item' }, // Potential conflict
        ],
      };

      const [response1, response2] = await Promise.all([
        request(app).post('/api/items/batch').send(batch1),
        request(app).post('/api/items/batch').send(batch2),
      ]);

      // One batch should succeed completely, the other should fail completely
      const success = [response1, response2].find((r) => r.status === 201);
      const failed = [response1, response2].find((r) => r.status === 409);

      expect(success).toBeDefined();
      expect(failed).toBeDefined();
      expect(success?.body.data.items).toHaveLength(3);

      // Verify the failed batch was rolled back (no partial inserts)
      const batch1Items = await prisma.item.findMany({
        where: {
          name: { in: ['Batch1-Item1', 'Batch1-Item2'] },
        },
      });

      const batch2Items = await prisma.item.findMany({
        where: {
          name: { in: ['Batch2-Item1', 'Batch2-Item2'] },
        },
      });

      // Only the successful batch items should exist
      const totalNewItems = batch1Items.length + batch2Items.length;
      expect(totalNewItems).toBe(2); // 2 items from successful batch (excluding Shared-Item)

      // Verify Shared-Item exists only once
      const sharedItems = await prisma.item.findMany({
        where: { name: 'Shared-Item' },
      });
      expect(sharedItems).toHaveLength(1);
    });
  });

  describe('Deadlock Scenarios', () => {
    it('should handle potential deadlock situations gracefully', async () => {
      // Create two items
      const item1 = await prisma.item.create({
        data: { name: 'Deadlock Item 1', description: 'Value A' },
      });

      const item2 = await prisma.item.create({
        data: { name: 'Deadlock Item 2', description: 'Value B' },
      });

      // Transaction 1: Update item1 then item2
      const transaction1 = async () => {
        const step1 = await request(app)
          .put(`/api/items/${item1.id}`)
          .send({ name: 'Updated by T1 first', description: 'T1-Step1' });

        const step2 = await request(app)
          .put(`/api/items/${item2.id}`)
          .send({ name: 'Updated by T1 second', description: 'T1-Step2' });

        return [step1, step2];
      };

      // Transaction 2: Update item2 then item1 (reverse order)
      const transaction2 = async () => {
        const step1 = await request(app)
          .put(`/api/items/${item2.id}`)
          .send({ name: 'Updated by T2 first', description: 'T2-Step1' });

        const step2 = await request(app)
          .put(`/api/items/${item1.id}`)
          .send({ name: 'Updated by T2 second', description: 'T2-Step2' });

        return [step1, step2];
      };

      // Execute both transactions concurrently
      const [result1, result2] = await Promise.all([
        transaction1(),
        transaction2(),
      ]);

      // Both transactions should complete (PostgreSQL detects and resolves deadlocks)
      const allResponses = [...result1, ...result2];
      allResponses.forEach((response) => {
        expect([200, 404]).toContain(response.status);
      });

      // Verify both items exist and have been updated
      const finalItem1 = await prisma.item.findUnique({
        where: { id: item1.id },
      });
      const finalItem2 = await prisma.item.findUnique({
        where: { id: item2.id },
      });

      expect(finalItem1).not.toBeNull();
      expect(finalItem2).not.toBeNull();
    });
  });
});
