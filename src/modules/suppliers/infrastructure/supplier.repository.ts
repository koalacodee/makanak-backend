import { eq, and } from "drizzle-orm";
import { suppliers } from "../../../drizzle/schema";
import db from "../../../drizzle";
import type { ISupplierRepository } from "../domain/suppliers.iface";
import type {
  Supplier,
  SupplierInput,
  SupplierStatus,
} from "../domain/supplier.entity";

export class SupplierRepository implements ISupplierRepository {
  constructor(private database: typeof db) {}

  async findAll(filters?: {
    status?: SupplierStatus;
    category?: string;
  }): Promise<Supplier[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(suppliers.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(suppliers.category, filters.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select()
      .from(suppliers)
      .where(whereClause);

    return result.map((row) => this.mapToEntity(row));
  }

  async findById(id: string): Promise<Supplier | null> {
    const result = await this.database
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async create(data: SupplierInput): Promise<Supplier> {
    const id = crypto.randomUUID();

    const [result] = await this.database
      .insert(suppliers)
      .values({
        id,
        name: data.name,
        phone: data.phone,
        category: data.category,
        companyName: data.companyName || null,
        notes: data.notes || null,
        status: data.status || "pending",
      })
      .returning();

    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<SupplierInput>): Promise<Supplier> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.companyName !== undefined)
      updateData.companyName = data.companyName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    updateData.updatedAt = new Date();

    const [result] = await this.database
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(suppliers).where(eq(suppliers.id, id));
  }

  private mapToEntity(row: typeof suppliers.$inferSelect): Supplier {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      category: row.category,
      companyName: row.companyName || null,
      notes: row.notes || null,
      status: row.status as SupplierStatus,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
    };
  }
}
