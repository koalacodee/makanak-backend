import { Elysia, t } from 'elysia'
import { authGuard } from '../../auth/presentation/auth.guard'
import type { Category } from '../domain/category.entity'
import { categoriesModule } from '../infrastructure/categories.module'
import {
  CategoryDto,
  CategoryInputDto,
  CategoryQueryDto,
  CategoryWithProductsDto,
} from './categories.dto'

export const categoriesController = new Elysia({ prefix: '/categories' })
  .use(categoriesModule)
  .get(
    '/',
    async ({ query, getCategoriesUC, categoryRepo, attachmentRepo }) => {
      const categories = await getCategoriesUC.execute(
        query.includeHidden ?? false,
        categoryRepo,
        attachmentRepo,
      )
      return categories
    },
    {
      query: CategoryQueryDto,
      response: t.Array(CategoryDto),
    },
  )
  .get(
    '/:id',
    async ({ params, getCategoryUC, categoryRepo }) => {
      const category = await getCategoryUC.execute(params.id, categoryRepo)
      return category
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: CategoryDto,
    },
  )
  .get(
    '/:id/products',
    async ({
      params,
      getCategoryWithProductsUC,
      categoryRepo,
      attachmentRepo,
    }) => {
      const categoryWithProducts = await getCategoryWithProductsUC.execute(
        params.id,
        categoryRepo,
        attachmentRepo,
      )
      return {
        ...categoryWithProducts,
        products: categoryWithProducts.products.map((product) => ({
          ...product,
          originalPrice: product.originalPrice
            ? product.originalPrice
            : undefined,
        })),
      }
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: CategoryWithProductsDto,
    },
  )
  .use(authGuard(['admin', 'inventory', 'cs']))
  .post(
    '/',
    async ({ body, createCategoryUC, categoryRepo }) => {
      const result = await createCategoryUC.execute(
        {
          name: body.name,
          icon: body.icon,
          color: body.color,
          isHidden: body.isHidden ?? false,
          isLocked: body.isLocked ?? false,
        },
        categoryRepo,
        body.attachWithFileExtension ?? undefined,
      )
      return result
    },
    {
      body: CategoryInputDto,
      response: t.Object({
        category: CategoryDto,
        uploadUrl: t.Optional(t.String()),
        newSignedUrl: t.Optional(t.String()),
      }),
    },
  )
  .put(
    '/:id',
    async ({ params, body, updateCategoryUC, categoryRepo }) => {
      const updateData: Partial<Omit<Category, 'id'>> = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.icon !== undefined) updateData.icon = body.icon
      if (body.color !== undefined) updateData.color = body.color
      if (body.isHidden !== undefined) updateData.isHidden = body.isHidden
      if (body.isLocked !== undefined) updateData.isLocked = body.isLocked

      const result = await updateCategoryUC.execute(
        params.id,
        {
          ...updateData,
          attachWithFileExtension: body.attachWithFileExtension ?? undefined,
        },
        categoryRepo,
      )
      return result
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: CategoryInputDto,
      response: t.Object({
        category: CategoryDto,
        uploadUrl: t.Optional(t.String()),
        newSignedUrl: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params, deleteCategoryUC, categoryRepo }) => {
      await deleteCategoryUC.execute(params.id, categoryRepo)
      return new Response(null, { status: 204 })
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )
