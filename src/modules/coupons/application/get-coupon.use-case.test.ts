import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCouponUseCase } from "./get-coupon.use-case";
import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("GetCouponUseCase", () => {
  let useCase: GetCouponUseCase;
  let mockRepo: ICouponRepository;

  beforeEach(() => {
    useCase = new GetCouponUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return coupon when found", async () => {
    const mockCoupon: Coupon = {
      id: "coupon-1",
      name: "SUMMER2024",
      value: 10,
      remainingUses: 100,
    };

    mockRepo.findById = mock(() => Promise.resolve(mockCoupon));

    const result = await useCase.execute("coupon-1", mockRepo);

    expect(result).toEqual(mockCoupon);
    expect(mockRepo.findById).toHaveBeenCalledWith("coupon-1");
  });

  it("should throw NotFoundError when coupon not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
  });
});
