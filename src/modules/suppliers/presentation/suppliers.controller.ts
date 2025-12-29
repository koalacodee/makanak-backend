import { Elysia, t } from "elysia";
import { authGuard } from "../../auth/presentation/auth.guard";
import { suppliersModule } from "../infrastructure/suppliers.module";
import {
  SupplierDto,
  type SupplierInput,
  SupplierInputDto,
  SupplierQueryDto,
} from "./suppliers.dto";

export const suppliersController = new Elysia({ prefix: "/suppliers" })
  .use(suppliersModule)
  .use(authGuard(["admin", "inventory"]))
  .get(
    "/",
    async ({ query, getSuppliersUC, supplierRepo }) => {
      const suppliers = await getSuppliersUC.execute(
        {
          status: query.status,
          category: query.category,
        },
        supplierRepo
      );
      return suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        companyName: supplier.companyName ?? undefined,
        notes: supplier.notes ?? undefined,
        status: supplier.status,
      }));
    },
    {
      query: SupplierQueryDto,
      response: t.Array(SupplierDto),
    }
  )
  .get(
    "/:id",
    async ({ params, getSupplierUC, supplierRepo }) => {
      const supplier = await getSupplierUC.execute(params.id, supplierRepo);
      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        companyName: supplier.companyName ?? undefined,
        notes: supplier.notes ?? undefined,
        status: supplier.status,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      response: SupplierDto,
    }
  )
  .post(
    "/",
    async ({ body, createSupplierUC, supplierRepo }) => {
      const supplier = await createSupplierUC.execute(
        {
          name: body.name,
          phone: body.phone,
          category: body.category,
          companyName: body.companyName,
          notes: body.notes,
          status: body.status,
        },
        supplierRepo
      );
      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        companyName: supplier.companyName ?? undefined,
        notes: supplier.notes ?? undefined,
        status: supplier.status,
      };
    },
    {
      body: SupplierInputDto,
      response: SupplierDto,
    }
  )
  .put(
    "/:id",
    async ({ params, body, updateSupplierUC, supplierRepo }) => {
      const updateData: Partial<Omit<SupplierInput, "id">> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.companyName !== undefined)
        updateData.companyName = body.companyName;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.status !== undefined) updateData.status = body.status;

      const supplier = await updateSupplierUC.execute(
        params.id,
        updateData,
        supplierRepo
      );
      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        companyName: supplier.companyName ?? undefined,
        notes: supplier.notes ?? undefined,
        status: supplier.status,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: SupplierInputDto,
      response: SupplierDto,
    }
  )
  .delete(
    "/:id",
    async ({ params, deleteSupplierUC, supplierRepo }) => {
      await deleteSupplierUC.execute(params.id, supplierRepo);
      return new Response(null, { status: 204 });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  );
