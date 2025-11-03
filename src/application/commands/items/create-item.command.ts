import { Command } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';
import { CreateItemDTO, ItemDTO } from '../../dtos/item.dto';

export class CreateItemCommand extends Command<ItemDTO> {
  constructor(private readonly data: CreateItemDTO) {
    super();
  }

  async execute(): Promise<ItemDTO> {
    const item = await prisma.item.create({
      data: {
        name: this.data.name,
        description: this.data.description || null,
      },
    });

    return item;
  }
}
