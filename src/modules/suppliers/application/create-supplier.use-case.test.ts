import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CreateSupplierUseCase } from "./create-supplier.use-case";
import type { ISupplierRepository } from "../domain/suppliers.iface";
import type { Supplier, SupplierInput } from "../domain/supplier.entity";
import { BadRequestError } from "../../../shared/presentation/errors";

describe("CreateSupplierUseCase", () => {
  let useCase: CreateSupplierUseCase;
  let mockRepo: ISupplierRepository;

  beforeEach(() => {
    useCase = new CreateSupplierUseCase();
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Supplier)),
      update: mock(() => Promise.resolve({} as Supplier)),
      delete: mock(() => Promise.resolve()),
    };
  });

  it("should create supplier successfully", async () => {
    const inputData: SupplierInput = {
      name: "New Supplier",
      phone: "1234567890",
      category: "groceries",
      companyName: "Company Name",
      notes: "Some notes",
      status: "active",
    };

    const mockCreatedSupplier: Supplier = {
      id: "supplier-uuid-1",
      name: "New Supplier",
      phone: "1234567890",
      category: "groceries",
      companyName: "Company Name",
      notes: "Some notes",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.create = mock(() => Promise.resolve(mockCreatedSupplier));

    const result = await useCase.execute(inputData, mockRepo);

    expect(result).toEqual(mockCreatedSupplier);
    expect(mockRepo.create).toHaveBeenCalledWith(inputData);
  });

  it("should create supplier with default status when not provided", async () => {
    const inputData: SupplierInput = {
      name: "New Supplier",
      phone: "1234567890",
      category: "groceries",
    };

    const mockCreatedSupplier: Supplier = {
      id: "supplier-uuid-1",
      name: "New Supplier",
      phone: "1234567890",
      category: "groceries",
      companyName: null,
      notes: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.create = mock(() => Promise.resolve(mockCreatedSupplier));

    const result = await useCase.execute(inputData, mockRepo);

    expect(result).toEqual(mockCreatedSupplier);
    expect(mockRepo.create).toHaveBeenCalledWith(inputData);
  });

  it("should throw BadRequestError when name is empty", async () => {
    const inputData: SupplierInput = {
      name: "",
      phone: "1234567890",
      category: "groceries",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Supplier name is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when name is whitespace only", async () => {
    const inputData: SupplierInput = {
      name: "   ",
      phone: "1234567890",
      category: "groceries",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Supplier name is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when phone is empty", async () => {
    const inputData: SupplierInput = {
      name: "Supplier Name",
      phone: "",
      category: "groceries",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Phone number is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when phone is whitespace only", async () => {
    const inputData: SupplierInput = {
      name: "Supplier Name",
      phone: "   ",
      category: "groceries",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Phone number is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when category is empty", async () => {
    const inputData: SupplierInput = {
      name: "Supplier Name",
      phone: "1234567890",
      category: "",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Category is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when category is whitespace only", async () => {
    const inputData: SupplierInput = {
      name: "Supplier Name",
      phone: "1234567890",
      category: "   ",
    };

    await expect(useCase.execute(inputData, mockRepo)).rejects.toThrow(
      BadRequestError
    );
    try {
      await useCase.execute(inputData, mockRepo);
    } catch (error: any) {
      expect(error.details).toBeDefined();
      expect(error.details[0].message).toBe("Category is required");
    }
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should create supplier with optional fields", async () => {
    const inputData: SupplierInput = {
      name: "Supplier Name",
      phone: "1234567890",
      category: "groceries",
      companyName: "Company Name",
      notes: "Some notes",
    };

    const mockCreatedSupplier: Supplier = {
      id: "supplier-uuid-1",
      name: "Supplier Name",
      phone: "1234567890",
      category: "groceries",
      companyName: "Company Name",
      notes: "Some notes",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.create = mock(() => Promise.resolve(mockCreatedSupplier));

    const result = await useCase.execute(inputData, mockRepo);

    expect(result).toEqual(mockCreatedSupplier);
    expect(mockRepo.create).toHaveBeenCalledWith(inputData);
  });
});
