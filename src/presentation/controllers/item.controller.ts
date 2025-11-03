import { Request, Response } from 'express';
import {
  CreateItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  CreateMultipleItemsCommand,
} from '../../application/commands/items';
import {
  GetAllItemsQuery,
  GetItemByIdQuery,
} from '../../application/queries/items';
import {
  createItemSchema,
  updateItemSchema,
  idParamSchema,
  createMultipleItemsSchema,
} from '../validators/item.validator';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export class ItemController {
  // GET /api/items
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = new GetAllItemsQuery();
    const items = await query.execute();

    res.status(200).json({
      status: 'success',
      data: { items },
    });
  });

  // GET /api/items/:id
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const query = new GetItemByIdQuery(id);
    const item = await query.execute();

    if (!item) {
      throw new AppError(404, 'Item not found');
    }

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  });

  // POST /api/items
  static create = asyncHandler(async (req: Request, res: Response) => {
    const data = createItemSchema.parse(req.body);

    const command = new CreateItemCommand(data);
    const item = await command.execute();

    res.status(201).json({
      status: 'success',
      data: { item },
    });
  });

  // PUT /api/items/:id
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateItemSchema.parse(req.body);

    const command = new UpdateItemCommand(id, data);
    const item = await command.execute();

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  });

  // DELETE /api/items/:id
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const command = new DeleteItemCommand(id);
    await command.execute();

    res.status(204).send();
  });

  // POST /api/items/batch (Transactional)
  static createMultiple = asyncHandler(async (req: Request, res: Response) => {
    const { items } = createMultipleItemsSchema.parse(req.body);

    const command = new CreateMultipleItemsCommand(items);
    const createdItems = await command.execute();

    res.status(201).json({
      status: 'success',
      data: { items: createdItems },
    });
  });
}
