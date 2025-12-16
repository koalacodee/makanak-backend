import { Product } from "./product.entity";

export interface IProductRepository {
  findAll(filters: {
    categoryId?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  create(data: Omit<Product, "id">): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, "id">>): Promise<Product>;
  delete(id: string): Promise<void>;
}
