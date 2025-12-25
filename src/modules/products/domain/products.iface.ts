import { Product } from "./product.entity";

export interface IProductRepository {
  findAll(filters: {
    categoryId?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  create(data: Omit<Product, "id">): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, "id">>): Promise<Product>;
  delete(id: string): Promise<void>;
  existsByIds(ids: string[]): Promise<boolean>;
  updateStock(id: string, delta: number): Promise<void>;
  updateStockMany(items: { id: string; delta: number }[]): Promise<void>;
}
