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
import { HTTP_STATUS, RESPONSE_STATUS } from '../constants/http-status';

export class ItemController {
  // GET /api/items
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = new GetAllItemsQuery();
    const items = await query.execute();

    res.status(HTTP_STATUS.OK).json({
      status: RESPONSE_STATUS.SUCCESS,
      data: { items },
    });
  });

  // GET /api/items/:id
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const query = new GetItemByIdQuery(id);
    const item = await query.execute();

    if (!item) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Item not found');
    }

    res.status(HTTP_STATUS.OK).json({
      status: RESPONSE_STATUS.SUCCESS,
      data: { item },
    });
  });

  // POST /api/items
  static create = asyncHandler(async (req: Request, res: Response) => {
    const data = createItemSchema.parse(req.body);

    const command = new CreateItemCommand(data);
    const item = await command.execute();

    res.status(HTTP_STATUS.CREATED).json({
      status: RESPONSE_STATUS.SUCCESS,
      data: { item },
    });
  });

  // PUT /api/items/:id
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateItemSchema.parse(req.body);

    const command = new UpdateItemCommand(id, data);
    const item = await command.execute();

    res.status(HTTP_STATUS.OK).json({
      status: RESPONSE_STATUS.SUCCESS,
      data: { item },
    });
  });

  // DELETE /api/items/:id
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const command = new DeleteItemCommand(id);
    await command.execute();

    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  // POST /api/items/batch (Transactional)
  static createMultiple = asyncHandler(async (req: Request, res: Response) => {
    const { items } = createMultipleItemsSchema.parse(req.body);

    const command = new CreateMultipleItemsCommand(items);
    const createdItems = await command.execute();

    res.status(HTTP_STATUS.CREATED).json({
      status: RESPONSE_STATUS.SUCCESS,
      data: { items: createdItems },
    });
  });
}
