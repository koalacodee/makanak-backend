import { eq, and } from "drizzle-orm";
import { categories } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { ICategoryRepository } from "../domain/categories.iface";
import type { Category } from "../domain/category.entity";

export class CategoryRepository implements ICategoryRepository {
  constructor(private database: typeof db) {}

  async findAll(includeHidden: boolean = false): Promise<Category[]> {
    const conditions = [];
    if (!includeHidden) {
      conditions.push(eq(categories.isHidden, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select()
      .from(categories)
      .where(whereClause);

    return result.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.database
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async create(data: Omit<Category, "id"> | Category): Promise<Category> {
    // Use provided ID if available, otherwise generate one
    const id = "id" in data && data.id ? data.id : crypto.randomUUID();

    const [result] = await this.database
      .insert(categories)
      .values({
        id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        image: data.image,
        isHidden: data.isHidden ?? false,
        isLocked: data.isLocked ?? false,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(
    id: string,
    data: Partial<Omit<Category, "id">>
  ): Promise<Category> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;

    const [result] = await this.database
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(categories).where(eq(categories.id, id));
  }

  private mapToEntity(row: typeof categories.$inferSelect): Category {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      image: row.image,
      isHidden: row.isHidden,
      isLocked: row.isLocked,
    };
  }
}
