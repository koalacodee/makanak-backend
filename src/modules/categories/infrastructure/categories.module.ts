import { Elysia } from "elysia";
import db from "../../../drizzle";
import { CategoryRepository } from "./category.repository";
import { ProductRepository } from "../../products/infrastructure/product.repository";
import { AttachmentRepository } from "@/shared/attachments";
import { GetCategoriesUseCase } from "../application/get-categories.use-case";
import { GetCategoryUseCase } from "../application/get-category.use-case";
import { GetCategoryWithProductsUseCase } from "../application/get-category-with-products.use-case";
import { CreateCategoryUseCase } from "../application/create-category.use-case";
import { UpdateCategoryUseCase } from "../application/update-category.use-case";
import { DeleteCategoryUseCase } from "../application/delete-category.use-case";

export const categoriesModule = new Elysia({ name: "categoriesModule" })
  .decorate("categoryRepo", new CategoryRepository(db))
  .decorate("productRepo", new ProductRepository(db))
  .decorate("attachmentRepo", new AttachmentRepository(db))
  .decorate("getCategoriesUC", new GetCategoriesUseCase())
  .decorate("getCategoryUC", new GetCategoryUseCase())
  .decorate("getCategoryWithProductsUC", new GetCategoryWithProductsUseCase())
  .decorate("createCategoryUC", new CreateCategoryUseCase())
  .decorate("updateCategoryUC", new UpdateCategoryUseCase())
  .decorate("deleteCategoryUC", new DeleteCategoryUseCase());
