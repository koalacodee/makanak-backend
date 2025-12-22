import { Elysia, t } from "elysia";
import { customersModule } from "../infrastructure/customers.module";
import {
  CustomerDto,
  CustomerInputDto,
  CustomerUpdateDto,
  CustomerPointsInfoDto,
  CustomersListDto,
  GetCustomerDto,
  GetCustomersListQueryDto,
} from "./customers.dto";
import { authGuard } from "@/modules/auth";

export const customersController = new Elysia({ prefix: "/customers" })
  .use(customersModule)
  .post(
    "/:phone",
    async ({ body, getCustomerUC, customerRepo }) => {
      const customer = await getCustomerUC.execute(body, customerRepo);
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
      body: GetCustomerDto,
      response: CustomerDto,
    }
  )
  .put(
    "/:phone",
    async ({ params, body, upsertCustomerUC, customerRepo }) => {
      const customer = await upsertCustomerUC.execute(
        {
          phone: params.phone,
          name: body.name,
          address: body.address,
          password: body.password,
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
    async ({ body, getCustomerPointsUC, customerRepo }) => {
      const pointsInfo = await getCustomerPointsUC.execute(
        { phone: body.phone, password: body.password },
        customerRepo
      );
      return pointsInfo;
    },
    {
      body: GetCustomerDto,
      response: CustomerPointsInfoDto,
    }
  )
  .use(authGuard(["admin"]))
  .get(
    "/",
    async ({ query, getCustomersUC, customerRepo }) => {
      const customers = await getCustomersUC.execute(query, customerRepo);
      return customers.map((customer) => ({
        phone: customer.phone,
        name: customer.name ?? undefined,
        address: customer.address ?? undefined,
        points: customer.points,
        totalSpent: customer.totalSpent
          ? parseFloat(customer.totalSpent)
          : undefined,
        totalOrders: customer.totalOrders ?? undefined,
      }));
    },
    {
      response: CustomersListDto,
      query: GetCustomersListQueryDto,
    }
  );
