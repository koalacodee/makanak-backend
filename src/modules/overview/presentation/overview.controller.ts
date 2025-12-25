import { Elysia } from "elysia";
import { overviewModule } from "../infrastructure/overview.module";
import { OverviewDto } from "./overview.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const overviewController = new Elysia({ prefix: "/overview" })
  .use(overviewModule)
  .use(authGuard(["admin"])) // Only admins can view overview
  .get(
    "/",
    async ({ getOverviewUC, overviewRepo }) => {
      const overview = await getOverviewUC.execute(overviewRepo);
      return overview;
    },
    {
      response: OverviewDto,
    }
  );
