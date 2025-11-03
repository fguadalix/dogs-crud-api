import { CreateItemCommand } from '../../../application/commands/items/create-item.command';
import { UpdateItemCommand } from '../../../application/commands/items/update-item.command';
import { DeleteItemCommand } from '../../../application/commands/items/delete-item.command';
import prisma from '../../../infrastructure/database/prisma';

describe('Item Commands', () => {
  describe('CreateItemCommand', () => {
    it('should create a new item', async () => {
      const command = new CreateItemCommand({
        name: 'Test Item',
        description: 'Test Description',
      });

      const result = await command.execute();

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Item');
      expect(result.description).toBe('Test Description');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should create item without description', async () => {
      const command = new CreateItemCommand({
        name: 'Test Item Without Description',
      });

      const result = await command.execute();

      expect(result.name).toBe('Test Item Without Description');
      expect(result.description).toBeNull();
    });

    it('should fail when creating duplicate item', async () => {
      const data = { name: 'Duplicate Item' };

      const command1 = new CreateItemCommand(data);
      await command1.execute();

      const command2 = new CreateItemCommand(data);
      await expect(command2.execute()).rejects.toThrow();
    });
  });

  describe('UpdateItemCommand', () => {
    it('should update an existing item', async () => {
      const createCommand = new CreateItemCommand({
        name: 'Original Item',
        description: 'Original Description',
      });
      const item = await createCommand.execute();

      const updateCommand = new UpdateItemCommand(item.id, {
        name: 'Updated Item',
        description: 'Updated Description',
      });
      const result = await updateCommand.execute();

      expect(result.id).toBe(item.id);
      expect(result.name).toBe('Updated Item');
      expect(result.description).toBe('Updated Description');
    });

    it('should update only name', async () => {
      const createCommand = new CreateItemCommand({
        name: 'Original Item',
        description: 'Original Description',
      });
      const item = await createCommand.execute();

      const updateCommand = new UpdateItemCommand(item.id, {
        name: 'New Name',
      });
      const result = await updateCommand.execute();

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Original Description');
    });

    it('should fail when updating non-existent item', async () => {
      const command = new UpdateItemCommand(999999, {
        name: 'Non-existent',
      });

      await expect(command.execute()).rejects.toThrow();
    });
  });

  describe('DeleteItemCommand', () => {
    it('should delete an existing item', async () => {
      const createCommand = new CreateItemCommand({
        name: 'Item to Delete',
      });
      const item = await createCommand.execute();

      const deleteCommand = new DeleteItemCommand(item.id);
      await deleteCommand.execute();

      const deleted = await prisma.item.findUnique({
        where: { id: item.id },
      });

      expect(deleted).toBeNull();
    });

    it('should fail when deleting non-existent item', async () => {
      const command = new DeleteItemCommand(999999);
      await expect(command.execute()).rejects.toThrow();
    });
  });
});
