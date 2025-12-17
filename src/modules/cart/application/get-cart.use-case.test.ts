import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetCartUseCase } from "./get-cart.use-case";
import type { ICartRepository } from "../domain/cart.iface";
import type { Cart } from "../domain/cart.entity";

describe("GetCartUseCase", () => {
  let useCase: GetCartUseCase;
  let mockRepo: ICartRepository;

  beforeEach(() => {
    useCase = new GetCartUseCase();
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

  it("should return existing cart if found", async () => {
    const mockCart: Cart = {
      id: "cart-1",
      customerPhone: "1234567890",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findByCustomerPhone = mock(() => Promise.resolve(mockCart));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockCart);
    expect(mockRepo.findByCustomerPhone).toHaveBeenCalledWith("1234567890");
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should create new cart if not found", async () => {
    const mockCart: Cart = {
      id: "cart-1",
      customerPhone: "1234567890",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findByCustomerPhone = mock(() => Promise.resolve(null));
    mockRepo.create = mock(() => Promise.resolve(mockCart));

    const result = await useCase.execute("1234567890", mockRepo);

    expect(result).toEqual(mockCart);
    expect(mockRepo.findByCustomerPhone).toHaveBeenCalledWith("1234567890");
    expect(mockRepo.create).toHaveBeenCalledWith("1234567890");
  });
});
