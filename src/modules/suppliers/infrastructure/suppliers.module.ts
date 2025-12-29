import { Elysia } from "elysia";
import db from "../../../drizzle";
import { CreateSupplierUseCase } from "../application/create-supplier.use-case";
import { DeleteSupplierUseCase } from "../application/delete-supplier.use-case";
import { GetSupplierUseCase } from "../application/get-supplier.use-case";
import { GetSuppliersUseCase } from "../application/get-suppliers.use-case";
import { UpdateSupplierUseCase } from "../application/update-supplier.use-case";
import { SupplierRepository } from "./supplier.repository";

export const suppliersModule = new Elysia({ name: "suppliersModule" })
	.decorate("supplierRepo", new SupplierRepository(db))
	.decorate("getSuppliersUC", new GetSuppliersUseCase())
	.decorate("getSupplierUC", new GetSupplierUseCase())
	.decorate("createSupplierUC", new CreateSupplierUseCase())
	.decorate("updateSupplierUC", new UpdateSupplierUseCase())
	.decorate("deleteSupplierUC", new DeleteSupplierUseCase());
