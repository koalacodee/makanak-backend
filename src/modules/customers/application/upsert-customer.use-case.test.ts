import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpsertCustomerUseCase } from "./upsert-customer.use-case";
import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer, CustomerInput } from "../domain/customer.entity";

describe("UpsertCustomerUseCase", () => {
  let useCase: UpsertCustomerUseCase;
  let mockRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new UpsertCustomerUseCase();
    mockRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
    };
  });

  it("should create new customer when not exists", async () => {
    const newCustomer: Customer = {
      phone: "1234567890",
      name: "John Doe",
      address: "123 Main St",
      points: 0,
      totalSpent: "0",
      totalOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const input: CustomerInput = {
      phone: "1234567890",
      name: "John Doe",
      address: "123 Main St",
    };

    mockRepo.upsert = mock(() => Promise.resolve(newCustomer));

    const result = await useCase.execute("1234567890", input, mockRepo);

    expect(result).toEqual(newCustomer);
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      ...input,
      phone: "1234567890",
    });
  });

  it("should update existing customer", async () => {
    const updatedCustomer: Customer = {
      phone: "1234567890",
      name: "Jane Doe",
      address: "456 Oak Ave",
      points: 50,
      totalSpent: "250.00",
      totalOrders: 3,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date(),
    };

    const input: CustomerInput = {
      phone: "1234567890",
      name: "Jane Doe",
      address: "456 Oak Ave",
      points: 50,
      totalSpent: 250,
      totalOrders: 3,
    };

    mockRepo.upsert = mock(() => Promise.resolve(updatedCustomer));

    const result = await useCase.execute("1234567890", input, mockRepo);

    expect(result).toEqual(updatedCustomer);
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      ...input,
      phone: "1234567890",
    });
  });

  it("should override phone from path parameter", async () => {
    const customer: Customer = {
      phone: "1234567890",
      name: "John Doe",
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const input: CustomerInput = {
      phone: "wrong-phone", // Should be overridden
      name: "John Doe",
    };

    mockRepo.upsert = mock(() => Promise.resolve(customer));

    const result = await useCase.execute("1234567890", input, mockRepo);

    expect(result).toEqual(customer);
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      ...input,
      phone: "1234567890", // Path param phone should be used
    });
  });

  it("should handle minimal input", async () => {
    const customer: Customer = {
      phone: "1234567890",
      name: null,
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const input: CustomerInput = {
      phone: "1234567890",
    };

    mockRepo.upsert = mock(() => Promise.resolve(customer));

    const result = await useCase.execute("1234567890", input, mockRepo);

    expect(result).toEqual(customer);
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      phone: "1234567890",
    });
  });
});

