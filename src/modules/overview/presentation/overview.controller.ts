import { Elysia } from "elysia";
import { overviewModule } from "../infrastructure/overview.module";
import { OverviewDto } from "./overview.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const overviewController = new Elysia({ prefix: "/overview" })
  .use(overviewModule)
  .use(authGuard(["admin"])) // Only admins can view overview
  .get(
    "/",
    async ({ getOverviewUC, orderRepo, customerRepo, staffRepo }) => {
      const overview = await getOverviewUC.execute(
        orderRepo,
        customerRepo,
        staffRepo
      );
      return overview;
    },
    {
      response: OverviewDto,
    }
  );
