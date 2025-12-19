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
    const insertData: typeof storeSettings.$inferInsert = {
      pointsSystem: {
        active: data.pointsSystem?.active ?? false,
        value: data.pointsSystem?.value ?? 0,
        redemptionValue: data.pointsSystem?.redemptionValue ?? 0,
      },
      deliveryFee: data.deliveryFee?.toString() || null,
      announcement: {
        active: data.announcement?.active ?? false,
        message: data.announcement?.message ?? "",
      },
      socialMedia: data.socialMedia || null,
      paymentInfo: data.paymentInfo || null,
      promo: {
        isActive: data.promo?.isActive ?? false,
        imageFilename: data.promo?.imageFilename ?? undefined,
        topBadge: data.promo?.topBadge ?? undefined,
        title: data.promo?.title ?? undefined,
        description: data.promo?.description ?? undefined,
        code: data.promo?.code ?? undefined,
        buttonText: data.promo?.buttonText ?? undefined,
      },
      content: data.content || null,
    };

    const [result] = await this.database
      .insert(storeSettings)
      .values(insertData)
      .returning();

    return this.mapToEntity(result);
  }

  async update(data: StoreSettingsInput): Promise<StoreSettings> {
    // Get existing settings or create if doesn't exist
    const existing = await this.find();

    const updateData: typeof storeSettings.$inferInsert = {};
    if (data.pointsSystem !== undefined)
      updateData.pointsSystem = {
        value: data?.pointsSystem?.value ?? existing?.pointsSystem?.value ?? 0,
        redemptionValue:
          data?.pointsSystem?.redemptionValue ??
          existing?.pointsSystem?.redemptionValue ??
          0,
        active:
          data?.pointsSystem?.active ?? existing?.pointsSystem?.active ?? false,
      };
    if (data.deliveryFee !== undefined)
      updateData.deliveryFee = data.deliveryFee.toString();
    if (data.announcement !== undefined)
      updateData.announcement = {
        active:
          data?.announcement?.active ?? existing?.announcement?.active ?? false,
        message:
          data?.announcement?.message ?? existing?.announcement?.message ?? "",
      };
    if (data.socialMedia !== undefined)
      updateData.socialMedia = data.socialMedia;
    if (data.paymentInfo !== undefined)
      updateData.paymentInfo = data.paymentInfo;
    if (data.promo !== undefined)
      updateData.promo = {
        isActive: data.promo?.isActive ?? existing?.promo?.isActive ?? false,
        imageFilename: data.promo?.imageFilename ?? undefined,
        topBadge:
          data.promo?.topBadge ?? existing?.promo?.topBadge ?? undefined,
        title: data.promo?.title ?? existing?.promo?.title ?? undefined,
        description:
          data.promo?.description ?? existing?.promo?.description ?? undefined,
        code: data.promo?.code ?? existing?.promo?.code ?? undefined,
        buttonText:
          data.promo?.buttonText ?? existing?.promo?.buttonText ?? undefined,
      };
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
      deliveryFee: row.deliveryFee ? parseFloat(row.deliveryFee) : null,
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
