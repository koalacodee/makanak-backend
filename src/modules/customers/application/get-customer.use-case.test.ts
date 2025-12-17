import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCustomerUseCase } from "./get-customer.use-case";
import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer } from "../domain/customer.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetCustomerUseCase", () => {
  let useCase: GetCustomerUseCase;
  let mockRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new GetCustomerUseCase();
    mockRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
    };
  });

  it("should return customer when found", async () => {
    const mockCustomer: Customer = {
      phone: "1234567890",
      name: "John Doe",
      address: "123 Main St",
      points: 100,
      totalSpent: "500.00",
      totalOrders: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockCustomer);
    expect(mockRepo.findByPhone).toHaveBeenCalledWith("1234567890");
  });

  it("should return customer with null fields", async () => {
    const mockCustomer: Customer = {
      phone: "1234567890",
      name: null,
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findByPhone = mock(() => Promise.resolve(mockCustomer));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockCustomer);
    expect(mockRepo.findByPhone).toHaveBeenCalledWith("1234567890");
  });

  it("should throw NotFoundError when customer not found", async () => {
    mockRepo.findByPhone = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent-phone", mockRepo)
    ).rejects.toThrow(NotFoundError);
    try {
      await useCase.execute("non-existent-phone", mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Customer not found");
    }
    expect(mockRepo.findByPhone).toHaveBeenCalledWith("non-existent-phone");
  });
});

