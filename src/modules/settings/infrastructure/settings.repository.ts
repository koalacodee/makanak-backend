import { eq } from "drizzle-orm";
import { storeSettings } from "../../../drizzle/schema/storeSettings";
import db from "../../../drizzle";
import type { ISettingsRepository } from "../domain/settings.iface";
import type {
  StoreSettings,
  StoreSettingsInput,
} from "../domain/settings.entity";

export class SettingsRepository implements ISettingsRepository {
  constructor(private database: typeof db) {}

  async find(): Promise<StoreSettings | null> {
    const result = await this.database.select().from(storeSettings).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  async create(data: StoreSettingsInput): Promise<StoreSettings> {
    const insertData = {
      pointsSystem: data.pointsSystem || null,
      deliveryFee: data.deliveryFee?.toString() || null,
      announcement: data.announcement || null,
      socialMedia: data.socialMedia || null,
      paymentInfo: data.paymentInfo || null,
      promo: data.promo || null,
      content: data.content || null,
    } as any;

    const [result] = await this.database
      .insert(storeSettings)
      .values(insertData)
      .returning();

    return this.mapToEntity(result);
  }

  async update(data: StoreSettingsInput): Promise<StoreSettings> {
    // Get existing settings or create if doesn't exist
    const existing = await this.find();

    const updateData: any = {};
    if (data.pointsSystem !== undefined)
      updateData.pointsSystem = data.pointsSystem;
    if (data.deliveryFee !== undefined)
      updateData.deliveryFee = data.deliveryFee.toString();
    if (data.announcement !== undefined)
      updateData.announcement = data.announcement;
    if (data.socialMedia !== undefined)
      updateData.socialMedia = data.socialMedia;
    if (data.paymentInfo !== undefined)
      updateData.paymentInfo = data.paymentInfo;
    if (data.promo !== undefined) updateData.promo = data.promo;
    if (data.content !== undefined) updateData.content = data.content;
    updateData.updatedAt = new Date();

    if (existing) {
      const [result] = await this.database
        .update(storeSettings)
        .set(updateData)
        .where(eq(storeSettings.id, existing.id))
        .returning();

      return this.mapToEntity(result);
    } else {
      // Create if doesn't exist
      return await this.create(data);
    }
  }

  private mapToEntity(row: typeof storeSettings.$inferSelect): StoreSettings {
    return {
      id: row.id,
      pointsSystem: row.pointsSystem || null,
      deliveryFee: row.deliveryFee || null,
      announcement: row.announcement || null,
      socialMedia: row.socialMedia || null,
      paymentInfo: row.paymentInfo || null,
      promo: row.promo || null,
      content: row.content || null,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
    };
  }
}
