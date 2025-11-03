import { Command } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';

export class DeleteItemCommand extends Command<void> {
  constructor(private readonly id: number) {
    super();
  }

  async execute(): Promise<void> {
    await prisma.item.delete({
      where: { id: this.id },
    });
  }
}
