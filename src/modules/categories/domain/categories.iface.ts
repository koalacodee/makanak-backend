import { Product } from "@/modules/products/domain/product.entity";
import { Category } from "./category.entity";

export interface ICategoryRepository {
  findAll(includeHidden?: boolean): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(data: Omit<Category, "id"> | Category): Promise<Category>;
  update(id: string, data: Partial<Omit<Category, "id">>): Promise<Category>;
  delete(id: string): Promise<void>;
  findCategoryWithProductsById(
    id: string
  ): Promise<(Category & { products: Product[] }) | null>;
}
