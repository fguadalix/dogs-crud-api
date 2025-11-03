import { Command } from '../../common/cqrs';
import { TransactionManager } from '../../common/transaction';
import { CreateItemDTO, ItemDTO } from '../../dtos/item.dto';

export class CreateMultipleItemsCommand extends Command<ItemDTO[]> {
  constructor(private readonly items: CreateItemDTO[]) {
    super();
  }

  async execute(): Promise<ItemDTO[]> {
    // All items will be created in a single transaction
    // If one fails, all will be rolled back
    const operations = this.items.map((itemData) => async (tx: any) => {
      return await tx.item.create({
        data: {
          name: itemData.name,
          description: itemData.description || null,
        },
      });
    });

    return await TransactionManager.execute(operations);
  }
}
