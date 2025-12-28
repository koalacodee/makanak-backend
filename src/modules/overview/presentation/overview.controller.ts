import { Elysia } from "elysia";
import { overviewModule } from "../infrastructure/overview.module";
import {
  OverviewDto,
  SalesAnalyticsQueryDto,
  SalesAnalyticsDto,
} from "./overview.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const overviewController = new Elysia({ prefix: "/overview" })
  .use(overviewModule)
  .use(authGuard(["admin", "cs"])) // Only admins can view overview
  .get(
    "/",
    async ({ getOverviewUC, overviewRepo }) => {
      const overview = await getOverviewUC.execute(overviewRepo);
      return overview;
    },
    {
      response: OverviewDto,
    }
  )
  .get(
    "/sales-analytics",
    async ({ query, getSalesAnalyticsUC, overviewRepo }) => {
      const filters = {
        timeFilter: query.timeFilter,
        categoryId: query.categoryId,
        status: query.status,
      };
      const analytics = await getSalesAnalyticsUC.execute(
        filters,
        overviewRepo
      );
      return analytics;
    },
    {
      query: SalesAnalyticsQueryDto,
      response: SalesAnalyticsDto,
    }
  );
