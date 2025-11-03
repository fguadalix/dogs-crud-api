import { Query } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';
import { ItemDTO } from '../../dtos/item.dto';

export class GetItemByIdQuery extends Query<ItemDTO | null> {
  constructor(private readonly id: number) {
    super();
  }

  async execute(): Promise<ItemDTO | null> {
    const item = await prisma.item.findUnique({
      where: { id: this.id },
    });

    return item;
  }
}
