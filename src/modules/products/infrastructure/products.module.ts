import { Elysia } from "elysia";
import db from "../../../drizzle";
import { ProductRepository } from "./product.repository";
import { GetProductsUseCase } from "../application/get-products.use-case";
import { GetProductUseCase } from "../application/get-product.use-case";
import { CreateProductUseCase } from "../application/create-product.use-case";
import { UpdateProductUseCase } from "../application/update-product.use-case";
import { DeleteProductUseCase } from "../application/delete-product.use-case";

export const productsModule = new Elysia({ name: "productsModule" })
  .decorate("productRepo", new ProductRepository(db))
  .decorate("getProductsUC", new GetProductsUseCase())
  .decorate("getProductUC", new GetProductUseCase())
  .decorate("createProductUC", new CreateProductUseCase())
  .decorate("updateProductUC", new UpdateProductUseCase())
  .decorate("deleteProductUC", new DeleteProductUseCase());
