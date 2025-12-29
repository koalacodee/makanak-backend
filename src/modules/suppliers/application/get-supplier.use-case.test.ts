import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Supplier } from "../domain/supplier.entity";
import type { ISupplierRepository } from "../domain/suppliers.iface";
import { GetSupplierUseCase } from "./get-supplier.use-case";

describe("GetSupplierUseCase", () => {
  let useCase: GetSupplierUseCase;
  let mockRepo: ISupplierRepository;

  beforeEach(() => {
    useCase = new GetSupplierUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Supplier)),
      update: mock(() => Promise.resolve({} as Supplier)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should return supplier when found", async () => {
    const mockSupplier: Supplier = {
      id: "supplier-1",
      name: "Supplier One",
      phone: "1234567890",
      category: "groceries",
      companyName: "Company One",
      notes: "Some notes",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findById = mock(() => Promise.resolve(mockSupplier));

    const result = await useCase.execute("supplier-1", mockRepo);

    expect(result).toEqual(mockSupplier);
    expect(mockRepo.findById).toHaveBeenCalledWith("supplier-1");
  });

  it("should throw NotFoundError when supplier not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent-id", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    try {
      await useCase.execute("non-existent-id", mockRepo);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toBe("Supplier not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
    }
  });
});
