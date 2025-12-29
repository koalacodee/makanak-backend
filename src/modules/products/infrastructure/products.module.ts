import { Elysia } from "elysia";
import { AttachmentRepository } from "@/shared/attachments";
import db from "../../../drizzle";
import { CreateProductUseCase } from "../application/create-product.use-case";
import { DeleteProductUseCase } from "../application/delete-product.use-case";
import { GetProductUseCase } from "../application/get-product.use-case";
import { GetProductsUseCase } from "../application/get-products.use-case";
import { UpdateProductUseCase } from "../application/update-product.use-case";
import { ProductRepository } from "./product.repository";

export const productsModule = new Elysia({ name: "productsModule" })
	.decorate("productRepo", new ProductRepository(db))
	.decorate("attachmentRepo", new AttachmentRepository(db))
	.decorate("getProductsUC", new GetProductsUseCase())
	.decorate("getProductUC", new GetProductUseCase())
	.decorate("createProductUC", new CreateProductUseCase())
	.decorate("updateProductUC", new UpdateProductUseCase())
	.decorate("deleteProductUC", new DeleteProductUseCase());
