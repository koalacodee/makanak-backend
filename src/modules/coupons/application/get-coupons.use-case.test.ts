import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Coupon } from "../domain/coupon.entity";
import type { ICouponRepository } from "../domain/coupon.iface";
import { GetCouponsUseCase } from "./get-coupons.use-case";

describe("GetCouponsUseCase", () => {
	let useCase: GetCouponsUseCase;
	let mockRepo: ICouponRepository;

	beforeEach(() => {
		useCase = new GetCouponsUseCase();
		mockRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			findByName: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Coupon)),
			update: mock(() => Promise.resolve({} as Coupon)),
			delete: mock(() => Promise.resolve()),
		};
	});

	it("should return all coupons", async () => {
		const mockCoupons: Coupon[] = [
			{
				id: "coupon-1",
				name: "SUMMER2024",
				value: 10,
				remainingUses: 100,
			},
			{
				id: "coupon-2",
				name: "WINTER2024",
				value: 20,
				remainingUses: 50,
			},
		];

		mockRepo.findAll = mock(() => Promise.resolve(mockCoupons));

		const result = await useCase.execute(mockRepo);

		expect(result).toEqual(mockCoupons);
		expect(result).toHaveLength(2);
		expect(mockRepo.findAll).toHaveBeenCalled();
	});

	it("should return empty array when no coupons exist", async () => {
		mockRepo.findAll = mock(() => Promise.resolve([]));

		const result = await useCase.execute(mockRepo);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
		expect(mockRepo.findAll).toHaveBeenCalled();
	});

	it("should return coupons with different values", async () => {
		const mockCoupons: Coupon[] = [
			{
				id: "coupon-1",
				name: "SMALL",
				value: 5,
				remainingUses: 200,
			},
			{
				id: "coupon-2",
				name: "MEDIUM",
				value: 15,
				remainingUses: 100,
			},
			{
				id: "coupon-3",
				name: "LARGE",
				value: 50,
				remainingUses: 10,
			},
		];

		mockRepo.findAll = mock(() => Promise.resolve(mockCoupons));

		const result = await useCase.execute(mockRepo);

		expect(result).toHaveLength(3);
		expect(result[0].value).toBe(5);
		expect(result[1].value).toBe(15);
		expect(result[2].value).toBe(50);
	});
});
