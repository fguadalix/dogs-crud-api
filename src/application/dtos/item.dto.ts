export interface ItemDTO {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemDTO {
  name: string;
  description?: string;
}

export interface UpdateItemDTO {
  name?: string;
  description?: string;
}
