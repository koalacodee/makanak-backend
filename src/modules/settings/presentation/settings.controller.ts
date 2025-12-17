import { Elysia } from "elysia";
import { settingsModule } from "../infrastructure/settings.module";
import { StoreSettingsDto } from "./settings.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const settingsController = new Elysia({ prefix: "/settings" })
  .use(settingsModule)
  .get(
    "/",
    async ({ getSettingsUC, settingsRepo }) => {
      const settings = await getSettingsUC.execute(settingsRepo);

      // Return default structure if no settings exist
      if (!settings) {
        return {
          pointsSystem: {},
          deliveryFee: 0,
          announcement: {},
          socialMedia: {},
          paymentInfo: {},
          promo: {},
          content: {},
        };
      }

      return {
        pointsSystem: settings.pointsSystem || {},
        deliveryFee: settings.deliveryFee
          ? parseFloat(settings.deliveryFee)
          : 0,
        announcement: settings.announcement || {},
        socialMedia: settings.socialMedia || {},
        paymentInfo: settings.paymentInfo || {},
        promo: settings.promo || {},
        content: settings.content || {},
      };
    },
    {
      response: StoreSettingsDto,
    }
  )
  .use(authGuard(["admin"]))
  .put(
    "/",
    async ({ body, updateSettingsUC, settingsRepo }) => {
      const updateData: any = {};
      if (body.pointsSystem !== undefined)
        updateData.pointsSystem = body.pointsSystem;
      if (body.deliveryFee !== undefined)
        updateData.deliveryFee = body.deliveryFee;
      if (body.announcement !== undefined)
        updateData.announcement = body.announcement;
      if (body.socialMedia !== undefined)
        updateData.socialMedia = body.socialMedia;
      if (body.paymentInfo !== undefined)
        updateData.paymentInfo = body.paymentInfo;
      if (body.promo !== undefined) updateData.promo = body.promo;
      if (body.content !== undefined) updateData.content = body.content;

      const settings = await updateSettingsUC.execute(updateData, settingsRepo);

      return {
        pointsSystem: settings.pointsSystem || {},
        deliveryFee: settings.deliveryFee
          ? parseFloat(settings.deliveryFee)
          : 0,
        announcement: settings.announcement || {},
        socialMedia: settings.socialMedia || {},
        paymentInfo: settings.paymentInfo || {},
        promo: settings.promo || {},
        content: settings.content || {},
      };
    },
    {
      body: StoreSettingsDto,
      response: StoreSettingsDto,
    }
  );
