import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCustomerPointsUseCase } from "./get-customer-points.use-case";
import type { ICustomerRepository } from "../domain/customers.iface";
import type { CustomerPointsInfo } from "../domain/customer.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetCustomerPointsUseCase", () => {
  let useCase: GetCustomerPointsUseCase;
  let mockRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new GetCustomerPointsUseCase();
    mockRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as any)),
      update: mock(() => Promise.resolve({} as any)),
      upsert: mock(() => Promise.resolve({} as any)),
      getPointsInfo: mock(() => Promise.resolve(null)),
    };
  });

  it("should return customer points info when found", async () => {
    const mockPointsInfo: CustomerPointsInfo = {
      phone: "1234567890",
      points: 150,
      totalSpent: 750.5,
      totalOrders: 8,
    };

    mockRepo.getPointsInfo = mock(() => Promise.resolve(mockPointsInfo));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockPointsInfo);
    expect(mockRepo.getPointsInfo).toHaveBeenCalledWith("1234567890");
  });

  it("should return points info with zero values", async () => {
    const mockPointsInfo: CustomerPointsInfo = {
      phone: "1234567890",
      points: 0,
      totalSpent: 0,
      totalOrders: 0,
    };

    mockRepo.getPointsInfo = mock(() => Promise.resolve(mockPointsInfo));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockPointsInfo);
    expect(mockRepo.getPointsInfo).toHaveBeenCalledWith("1234567890");
  });

  it("should throw NotFoundError when customer not found", async () => {
    mockRepo.getPointsInfo = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent-phone", mockRepo)
    ).rejects.toThrow(NotFoundError);

    try {
      await useCase.execute("non-existent-phone", mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Customer not found");
    }
    expect(mockRepo.getPointsInfo).toHaveBeenCalledWith("non-existent-phone");
  });

  it("should return points info with high values", async () => {
    const mockPointsInfo: CustomerPointsInfo = {
      phone: "1234567890",
      points: 10000,
      totalSpent: 50000.99,
      totalOrders: 500,
    };

    mockRepo.getPointsInfo = mock(() => Promise.resolve(mockPointsInfo));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockPointsInfo);
    expect(result.points).toBe(10000);
    expect(result.totalSpent).toBe(50000.99);
    expect(result.totalOrders).toBe(500);
  });
});

