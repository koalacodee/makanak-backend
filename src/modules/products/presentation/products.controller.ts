import { Elysia } from "elysia";
import { t } from "elysia";
import { productsModule } from "../infrastructure/products.module";
import {
  ProductDto,
  ProductInputDto,
  ProductQueryDto,
  ProductsResponseDto,
} from "./products.dto";

export const productsController = new Elysia({ prefix: "/products" })
  .use(productsModule)
  .get(
    "/",
    async ({ query, getProductsUC, productRepo, attachmentRepo }) => {
      const filters = {
        category: query.category,
        inStock: query.inStock,
        page: query.page,
        limit: query.limit,
        search: query.search,
      };
      const result = await getProductsUC.execute(
        filters,
        productRepo,
        attachmentRepo
      );
      return {
        data: result.data.map((p) => ({
          ...p,
          price: p.price,
          originalPrice: p.originalPrice ? p.originalPrice : undefined,
        })),
        pagination: result.pagination,
      };
    },
    {
      query: ProductQueryDto,
      response: ProductsResponseDto,
    }
  )
  .get(
    "/:id",
    async ({ params, getProductUC, productRepo, attachmentRepo }) => {
      const product = await getProductUC.execute(
        params.id,
        productRepo,
        attachmentRepo
      );
      return {
        ...product,
        price: product.price,
        originalPrice: product.originalPrice
          ? product.originalPrice
          : undefined,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      response: ProductDto,
    }
  )
  .post(
    "/",
    async ({ body, createProductUC, productRepo }) => {
      const product = await createProductUC.execute(
        {
          name: body.name,
          price: body.price,
          category: body.category,
          description: body.description,
          stock: body.stock,
          originalPrice: body.originalPrice,
          quantityType: body.quantityType,
          unitOfMeasurement: body.unitOfMeasurement,
        },
        productRepo,
        body.attachWithFileExtension ?? undefined
      );
      return {
        product: {
          ...product.product,
          price: product.product.price,
          originalPrice: product.product.originalPrice
            ? product.product.originalPrice
            : undefined,
        },
        uploadUrl: product.uploadUrl,
        newSignedUrl: product.newSignedUrl,
      };
    },
    {
      body: ProductInputDto,
      response: t.Object({
        product: ProductDto,
        uploadUrl: t.Optional(t.String()),
        newSignedUrl: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, updateProductUC, productRepo }) => {
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.price !== undefined) updateData.price = body.price.toString();
      if (body.category !== undefined) updateData.category = body.category;
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.stock !== undefined) updateData.stock = body.stock;
      if (body.originalPrice !== undefined)
        updateData.originalPrice = body.originalPrice.toString();
      if (body.quantityType !== undefined)
        updateData.quantityType = body.quantityType;
      if (body.unitOfMeasurement !== undefined)
        updateData.unitOfMeasurement = body.unitOfMeasurement;
      const product = await updateProductUC.execute(
        params.id,
        {
          ...updateData,
          attachWithFileExtension: body.attachWithFileExtension ?? undefined,
        },
        productRepo
      );
      return {
        product: {
          ...product.product,
          price: product.product.price,
          originalPrice: product.product.originalPrice
            ? product.product.originalPrice
            : undefined,
        },
        uploadUrl: product.uploadUrl,
        newSignedUrl: product.newSignedUrl,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Partial(ProductInputDto),
      response: t.Object({
        product: ProductDto,
        uploadUrl: t.Optional(t.String()),
        newSignedUrl: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, deleteProductUC, productRepo }) => {
      await deleteProductUC.execute(params.id, productRepo);
      return new Response(null, { status: 204 });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  );
