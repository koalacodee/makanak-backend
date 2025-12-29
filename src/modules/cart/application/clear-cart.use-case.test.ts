import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Cart } from "../domain/cart.entity";
import type { ICartRepository } from "../domain/cart.iface";
import { ClearCartUseCase } from "./clear-cart.use-case";

describe("ClearCartUseCase", () => {
	let useCase: ClearCartUseCase;
	let mockRepo: ICartRepository;

	beforeEach(() => {
		useCase = new ClearCartUseCase();
		mockRepo = {
			findByCustomerPhone: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Cart)),
			addItem: mock(() => Promise.resolve({} as any)),
			updateItemQuantity: mock(() => Promise.resolve({} as any)),
			removeItem: mock(() => Promise.resolve()),
			clearCart: mock(() => Promise.resolve()),
			findItemByCartAndProduct: mock(() => Promise.resolve(null)),
			findItemById: mock(() => Promise.resolve(null)),
		};
	});

	it("should clear cart successfully", async () => {
		const mockCart: Cart = {
			id: "cart-1",
			customerPhone: "1234567890",
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));
		mockRepo.clearCart = mock(() => Promise.resolve());

		await useCase.execute("1234567890", mockRepo);

		expect(mockRepo.findByCustomerPhone).toHaveBeenCalledWith("1234567890");
		expect(mockRepo.clearCart).toHaveBeenCalledWith("cart-1");
	});

	it("should throw NotFoundError if cart not found", async () => {
		mockRepo.findByCustomerPhone = mock(() => Promise.resolve(null));

		await expect(useCase.execute("1234567890", mockRepo)).rejects.toThrow(
			NotFoundError,
		);
	});
});
