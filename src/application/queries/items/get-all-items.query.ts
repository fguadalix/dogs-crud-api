import { Query } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';
import { ItemDTO } from '../../dtos/item.dto';

export class GetAllItemsQuery extends Query<ItemDTO[]> {
  async execute(): Promise<ItemDTO[]> {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }
}
