import { eq, and, gte, desc, count, inArray, sql } from "drizzle-orm";
import { products } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { IProductRepository } from "../domain/products.iface";
import type { Product } from "../domain/product.entity";

export class ProductRepository implements IProductRepository {
  constructor(private database: typeof db) {}

  async findAll(filters: {
    categoryId?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        conditions.push(gte(products.stock, 1));
      } else {
        conditions.push(eq(products.stock, 0));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.database
        .select()
        .from(products)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.id)),
      this.database
        .select({ count: count() })
        .from(products)
        .where(whereClause),
    ]);

    return {
      data: data.map(this.mapToEntity),
      total: totalResult[0]?.count || 0,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const result = await this.database
      .select()
      .from(products)
      .where(inArray(products.id, ids));

    return result.map(this.mapToEntity);
  }

  async create(data: Omit<Product, "id">): Promise<Product> {
    const id = Bun.randomUUIDv7(); // Will be replaced with Bun.randomUUIDv7() when available

    const [result] = await this.database
      .insert(products)
      .values({
        id,
        name: data.name,
        price: data.price.toString(),
        unit: data.unit,
        categoryId: data.category,
        description: data.description,
        stock: data.stock,
        originalPrice: data.originalPrice?.toString() || null,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(
    id: string,
    data: Partial<Omit<Product, "id">>
  ): Promise<Product> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.category !== undefined) updateData.categoryId = data.category;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.originalPrice !== undefined)
      updateData.originalPrice = data.originalPrice;

    const [result] = await this.database
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(products).where(eq(products.id, id));
  }

  async existsByIds(ids: string[]): Promise<boolean> {
    const result = await this.database
      .select({ count: count() })
      .from(products)
      .where(inArray(products.id, ids));

    return result[0]?.count === ids.length;
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await this.database
      .update(products)
      .set({ stock: sql`${products.stock} + ${delta}` })
      .where(eq(products.id, id));
  }

  async updateStockMany(items: { id: string; delta: number }[]): Promise<void> {
    await this.database.transaction(async (tx) => {
      await Promise.all(
        items.map(async (item) => {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.delta}` })
            .where(eq(products.id, item.id));
        })
      );
    });
  }

  private mapToEntity(row: typeof products.$inferSelect): Product {
    return {
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      unit: row.unit,
      category: row.categoryId,
      description: row.description,
      stock: row.stock,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
    };
  }
}
