import { Elysia, t } from "elysia";
import { customersModule } from "../infrastructure/customers.module";
import {
  CustomerDto,
  CustomerInputDto,
  CustomerUpdateDto,
  CustomerPointsInfoDto,
} from "./customers.dto";

export const customersController = new Elysia({ prefix: "/customers" })
  .use(customersModule)
  .get(
    "/:phone",
    async ({ params, getCustomerUC, customerRepo }) => {
      const customer = await getCustomerUC.execute(params.phone, customerRepo);
      return {
        phone: customer.phone,
        name: customer.name ?? undefined,
        address: customer.address ?? undefined,
        points: customer.points,
        totalSpent: customer.totalSpent
          ? parseFloat(customer.totalSpent)
          : undefined,
        totalOrders: customer.totalOrders ?? undefined,
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      response: CustomerDto,
    }
  )
  .put(
    "/:phone",
    async ({ params, body, upsertCustomerUC, customerRepo }) => {
      const customer = await upsertCustomerUC.execute(
        params.phone,
        {
          phone: params.phone,
          name: body.name,
          address: body.address,
          points: body.points,
          totalSpent: body.totalSpent,
          totalOrders: body.totalOrders,
        },
        customerRepo
      );
      return {
        phone: customer.phone,
        name: customer.name ?? undefined,
        address: customer.address ?? undefined,
        points: customer.points,
        totalSpent: customer.totalSpent
          ? parseFloat(customer.totalSpent)
          : undefined,
        totalOrders: customer.totalOrders ?? undefined,
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      body: CustomerInputDto,
      response: CustomerDto,
    }
  )
  .patch(
    "/:phone",
    async ({ params, body, updateCustomerUC, customerRepo }) => {
      const customer = await updateCustomerUC.execute(
        params.phone,
        {
          points: body.points,
          pointsDelta: body.pointsDelta,
          name: body.name,
          address: body.address,
        },
        customerRepo
      );
      return {
        phone: customer.phone,
        name: customer.name ?? undefined,
        address: customer.address ?? undefined,
        points: customer.points,
        totalSpent: customer.totalSpent
          ? parseFloat(customer.totalSpent)
          : undefined,
        totalOrders: customer.totalOrders ?? undefined,
      };
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      body: CustomerUpdateDto,
      response: CustomerDto,
    }
  )
  .get(
    "/:phone/points",
    async ({ params, getCustomerPointsUC, customerRepo }) => {
      const pointsInfo = await getCustomerPointsUC.execute(
        params.phone,
        customerRepo
      );
      return pointsInfo;
    },
    {
      params: t.Object({
        phone: t.String(),
      }),
      response: CustomerPointsInfoDto,
    }
  );
