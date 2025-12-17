import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DeleteSupplierUseCase } from "./delete-supplier.use-case";
import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier } from "../domain/supplier.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("DeleteSupplierUseCase", () => {
  let useCase: DeleteSupplierUseCase;
  let mockRepo: ISupplierRepository;

  beforeEach(() => {
    useCase = new DeleteSupplierUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Supplier)),
      update: mock(() => Promise.resolve({} as Supplier)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should delete supplier successfully", async () => {
    const existingSupplier: Supplier = {
      id: "supplier-1",
      name: "Supplier One",
      phone: "1234567890",
      category: "groceries",
      companyName: null,
      notes: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findById = mock(() => Promise.resolve(existingSupplier));
    mockRepo.delete = mock(() => Promise.resolve());

    await useCase.execute("supplier-1", mockRepo);

    expect(mockRepo.findById).toHaveBeenCalledWith("supplier-1");
    expect(mockRepo.delete).toHaveBeenCalledWith("supplier-1");
  });

  it("should throw NotFoundError when supplier not found", async () => {
    mockRepo.findById = mock(() => Promise.resolve(null));

    await expect(useCase.execute("non-existent-id", mockRepo)).rejects.toThrow(
      NotFoundError
    );
    try {
      await useCase.execute("non-existent-id", mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Supplier not found");
    }
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
