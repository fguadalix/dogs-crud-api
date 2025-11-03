import { Command } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';
import { UpdateItemDTO, ItemDTO } from '../../dtos/item.dto';

export class UpdateItemCommand extends Command<ItemDTO> {
  constructor(
    private readonly id: number,
    private readonly data: UpdateItemDTO
  ) {
    super();
  }

  async execute(): Promise<ItemDTO> {
    const item = await prisma.item.update({
      where: { id: this.id },
      data: this.data,
    });

    return item;
  }
}
