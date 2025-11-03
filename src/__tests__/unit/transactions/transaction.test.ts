import { CreateMultipleItemsCommand } from '../../../application/commands/items/create-multiple-items.command';
import prisma from '../../../infrastructure/database/prisma';

describe('Transaction Tests', () => {
  describe('CreateMultipleItemsCommand', () => {
    it('should create multiple items in a transaction', async () => {
      const items = [
        { name: 'Item 1', description: 'Description 1' },
        { name: 'Item 2', description: 'Description 2' },
        { name: 'Item 3', description: 'Description 3' },
      ];

      const command = new CreateMultipleItemsCommand(items);
      const result = await command.execute();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Item 1');
      expect(result[1].name).toBe('Item 2');
      expect(result[2].name).toBe('Item 3');
    });

    it('should rollback all items if one fails (duplicate name)', async () => {
      // Create an item first
      await prisma.item.create({
        data: { name: 'Existing Item' },
      });

      const items = [
        { name: 'New Item 1' },
        { name: 'Existing Item' }, // This will fail
        { name: 'New Item 2' },
      ];

      const command = new CreateMultipleItemsCommand(items);
      
      await expect(command.execute()).rejects.toThrow();

      // Verify that no new items were created
      const allItems = await prisma.item.findMany();
      expect(allItems).toHaveLength(1); // Only the initially created item
      expect(allItems[0].name).toBe('Existing Item');
    });

    it('should handle empty array', async () => {
      const command = new CreateMultipleItemsCommand([]);
      const result = await command.execute();

      expect(result).toEqual([]);
    });
  });
});
