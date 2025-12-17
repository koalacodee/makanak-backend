import { describe, it, expect, beforeEach, mock } from "bun:test";
import { RemoveCartItemUseCase } from "./remove-cart-item.use-case";
import type { ICartRepository } from "../domain/cart.iface";
import type { CartItemEntity } from "../domain/cart.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("RemoveCartItemUseCase", () => {
  let useCase: RemoveCartItemUseCase;
  let mockRepo: ICartRepository;

  beforeEach(() => {
    useCase = new RemoveCartItemUseCase();
    mockRepo = {
      findByCustomerPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as any)),
      addItem: mock(() => Promise.resolve({} as CartItemEntity)),
      updateItemQuantity: mock(() => Promise.resolve({} as CartItemEntity)),
      removeItem: mock(() => Promise.resolve()),
      clearCart: mock(() => Promise.resolve()),
      findItemByCartAndProduct: mock(() => Promise.resolve(null)),
      findItemById: mock(() => Promise.resolve(null)),
    };
  });

  it("should remove cart item successfully", async () => {
    const mockCartItem: CartItemEntity = {
      id: "item-1",
      productId: "product-1",
      quantity: 2,
      product: {
        id: "product-1",
        name: "Product 1",
        price: 10,
        unit: "kg",
        categoryId: "cat-1",
        image: "https://example.com/img1.jpg",
        description: "Description 1",
        stock: 10,
        originalPrice: null,
      },
    };

    mockRepo.findItemById = mock(() => Promise.resolve(mockCartItem));
    mockRepo.removeItem = mock(() => Promise.resolve());

    await useCase.execute("item-1", mockRepo);

    expect(mockRepo.removeItem).toHaveBeenCalledWith("item-1");
  });

  it("should throw NotFoundError if cart item not found", async () => {
    mockRepo.findItemById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("item-1", mockRepo)).rejects.toThrow(
      NotFoundError
    );
  });
});
