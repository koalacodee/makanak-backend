import { Elysia } from "elysia";
import { t } from "elysia";
import { categoriesModule } from "../infrastructure/categories.module";
import {
  CategoryDto,
  CategoryInputDto,
  CategoryQueryDto,
} from "./categories.dto";
import { authGuard } from "../../auth/presentation/auth.guard";

export const categoriesController = new Elysia({ prefix: "/categories" })
  .use(categoriesModule)
  .get(
    "/",
    async ({ query, getCategoriesUC, categoryRepo }) => {
      const categories = await getCategoriesUC.execute(
        query.includeHidden ?? false,
        categoryRepo
      );
      return categories;
    },
    {
      query: CategoryQueryDto,
      response: t.Array(CategoryDto),
    }
  )
  .get(
    "/:id",
    async ({ params, getCategoryUC, categoryRepo }) => {
      const category = await getCategoryUC.execute(params.id, categoryRepo);
      return category;
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      response: CategoryDto,
    }
  )
  .use(authGuard(["admin", "inventory"]))
  .post(
    "/",
    async ({ body, createCategoryUC, categoryRepo }) => {
      const category = await createCategoryUC.execute(
        {
          id: body.id,
          name: body.name,
          icon: body.icon,
          color: body.color,
          image: body.image,
          isHidden: body.isHidden ?? false,
          isLocked: body.isLocked ?? false,
        },
        categoryRepo
      );
      return category;
    },
    {
      body: CategoryInputDto,
      response: CategoryDto,
    }
  )
  .put(
    "/:id",
    async ({ params, body, updateCategoryUC, categoryRepo }) => {
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.icon !== undefined) updateData.icon = body.icon;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.image !== undefined) updateData.image = body.image;
      if (body.isHidden !== undefined) updateData.isHidden = body.isHidden;
      if (body.isLocked !== undefined) updateData.isLocked = body.isLocked;

      const category = await updateCategoryUC.execute(
        params.id,
        updateData,
        categoryRepo
      );
      return category;
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: CategoryInputDto,
      response: CategoryDto,
    }
  )
  .delete(
    "/:id",
    async ({ params, deleteCategoryUC, categoryRepo }) => {
      await deleteCategoryUC.execute(params.id, categoryRepo);
      return new Response(null, { status: 204 });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  );
