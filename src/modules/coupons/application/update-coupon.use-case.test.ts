import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateCouponUseCase } from "./update-coupon.use-case";
import type { ICouponRepository } from "../domain/coupon.iface";
import type { Coupon, CouponInput } from "../domain/coupon.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("UpdateCouponUseCase", () => {
  let useCase: UpdateCouponUseCase;
  let mockRepo: ICouponRepository;

  beforeEach(() => {
    useCase = new UpdateCouponUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Coupon)),
      update: mock(() => Promise.resolve({} as Coupon)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should update coupon successfully", async () => {
    const existingCoupon: Coupon = {
      id: "coupon-1",
      name: "SUMMER2024",
      value: 10,
      remainingUses: 100,
    };

    const updateData: Partial<CouponInput> = {
      value: 15,
    };

    const updatedCoupon: Coupon = {
      ...existingCoupon,
      ...updateData,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingCoupon));
    mockRepo.update = mock(() => Promise.resolve(updatedCoupon));

    const result = await useCase.execute("coupon-1", updateData, mockRepo);

    expect(result.value).toBe(15);
    expect(mockRepo.findById).toHaveBeenCalledWith("coupon-1");
    expect(mockRepo.update).toHaveBeenCalledWith("coupon-1", updateData);
  });

  it("should throw NotFoundError when coupon not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", { value: 20 }, mockRepo)
    ).rejects.toThrow(NotFoundError);
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should update multiple fields", async () => {
    const existingCoupon: Coupon = {
      id: "coupon-1",
      name: "SUMMER2024",
      value: 10,
      remainingUses: 100,
    };

    const updateData: Partial<CouponInput> = {
      value: 20,
      remainingUses: 50,
    };

    const updatedCoupon: Coupon = {
      ...existingCoupon,
      ...updateData,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingCoupon));
    mockRepo.update = mock(() => Promise.resolve(updatedCoupon));

    const result = await useCase.execute("coupon-1", updateData, mockRepo);

    expect(result.value).toBe(20);
    expect(result.remainingUses).toBe(50);
    expect(mockRepo.update).toHaveBeenCalledWith("coupon-1", updateData);
  });

  it("should update only remainingUses", async () => {
    const existingCoupon: Coupon = {
      id: "coupon-1",
      name: "SUMMER2024",
      value: 10,
      remainingUses: 100,
    };

    const updateData: Partial<CouponInput> = {
      remainingUses: 75,
    };

    const updatedCoupon: Coupon = {
      ...existingCoupon,
      remainingUses: 75,
    };

    mockRepo.findById = mock(() => Promise.resolve(existingCoupon));
    mockRepo.update = mock(() => Promise.resolve(updatedCoupon));

    const result = await useCase.execute("coupon-1", updateData, mockRepo);

    expect(result.remainingUses).toBe(75);
    expect(result.value).toBe(10); // unchanged
    expect(mockRepo.update).toHaveBeenCalledWith("coupon-1", updateData);
  });
});
