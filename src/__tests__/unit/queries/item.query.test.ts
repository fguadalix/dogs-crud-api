import { GetAllItemsQuery } from '../../../application/queries/items/get-all-items.query';
import { GetItemByIdQuery } from '../../../application/queries/items/get-item-by-id.query';
import { CreateItemCommand } from '../../../application/commands/items/create-item.command';

describe('Item Queries', () => {
  describe('GetAllItemsQuery', () => {
    it('should return empty array when no items exist', async () => {
      const query = new GetAllItemsQuery();
      const result = await query.execute();

      expect(result).toEqual([]);
    });

    it('should return all items', async () => {
      // Create test items
      const command1 = new CreateItemCommand({ name: 'Item 1' });
      const command2 = new CreateItemCommand({ name: 'Item 2' });
      await command1.execute();
      await command2.execute();

      const query = new GetAllItemsQuery();
      const result = await query.execute();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });

    it('should return items ordered by creation date (newest first)', async () => {
      const command1 = new CreateItemCommand({ name: 'First Item' });
      const item1 = await command1.execute();
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const command2 = new CreateItemCommand({ name: 'Second Item' });
      const item2 = await command2.execute();

      const query = new GetAllItemsQuery();
      const result = await query.execute();

      expect(result[0].id).toBe(item2.id);
      expect(result[1].id).toBe(item1.id);
    });
  });

  describe('GetItemByIdQuery', () => {
    it('should return item when it exists', async () => {
      const createCommand = new CreateItemCommand({
        name: 'Test Item',
        description: 'Test Description',
      });
      const item = await createCommand.execute();

      const query = new GetItemByIdQuery(item.id);
      const result = await query.execute();

      expect(result).not.toBeNull();
      expect(result?.id).toBe(item.id);
      expect(result?.name).toBe('Test Item');
    });

    it('should return null when item does not exist', async () => {
      const query = new GetItemByIdQuery(999999);
      const result = await query.execute();

      expect(result).toBeNull();
    });
  });
});
