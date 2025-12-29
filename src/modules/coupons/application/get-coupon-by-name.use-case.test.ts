import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCouponByNameUseCase } from "./get-coupon-by-name.use-case";
import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetCouponByNameUseCase", () => {
  let useCase: GetCouponByNameUseCase;
  let mockRepo: ICouponRepository;

  beforeEach(() => {
    useCase = new GetCouponByNameUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return coupon when found by name", async () => {
    const mockCoupon: Coupon = {
      id: "coupon-1",
      name: "SUMMER2024",
      value: 10,
      remainingUses: 100,
    };

    mockRepo.findByName = mock(() => Promise.resolve(mockCoupon));

    const result = await useCase.execute("SUMMER2024", mockRepo);

    expect(result).toEqual(mockCoupon);
    expect(mockRepo.findByName).toHaveBeenCalledWith("SUMMER2024");
  });

  it("should throw NotFoundError when coupon not found by name", async () => {
    mockRepo.findByName = mock(() => Promise.resolve(null));

    await expect(useCase.execute("NONEXISTENT", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    expect(mockRepo.findByName).toHaveBeenCalledWith("NONEXISTENT");
  });

  it("should handle case-sensitive coupon names", async () => {
    const mockCoupon: Coupon = {
      id: "coupon-2",
      name: "Summer2024",
      value: 15,
      remainingUses: 50,
    };

    mockRepo.findByName = mock(() => Promise.resolve(mockCoupon));

    const result = await useCase.execute("Summer2024", mockRepo);

    expect(result.name).toBe("Summer2024");
    expect(mockRepo.findByName).toHaveBeenCalledWith("Summer2024");
  });
});
