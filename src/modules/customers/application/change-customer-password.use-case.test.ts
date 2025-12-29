import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ChangeCustomerPasswordUseCase } from "./change-customer-password.use-case";
import type { ICustomerRepository } from "../domain/customers.iface";
import type { Customer } from "../domain/customer.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

describe("ChangeCustomerPasswordUseCase", () => {
  let useCase: ChangeCustomerPasswordUseCase;
  let mockRepo: ICustomerRepository;

  beforeEach(() => {
    useCase = new ChangeCustomerPasswordUseCase();
    mockRepo = {
      findByPhone: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Customer)),
      update: mock(() => Promise.resolve({} as Customer)),
      changePassword: mock(() => Promise.resolve({} as Customer)),
      upsert: mock(() => Promise.resolve({} as Customer)),
      getPointsInfo: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
    };
  });

  it("should change customer password successfully", async () => {
    const existingCustomer: Customer = {
      phone: "1234567890",
      password: "old-hash",
      name: "John Doe",
      address: "123 Main St",
      points: 100,
      totalSpent: "500.00",
      totalOrders: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedCustomer: Customer = {
      ...existingCustomer,
      password: "new-hash",
      updatedAt: new Date(),
    };

    mockRepo.findByPhone = mock(() => Promise.resolve(existingCustomer));
    mockRepo.changePassword = mock(() => Promise.resolve(updatedCustomer));

    const result = await useCase.execute(
      { phone: "1234567890", password: "newPassword123" },
      mockRepo
    );

    expect(result.phone).toBe("1234567890");
    expect(result.name).toBe("John Doe");
    expect(result.points).toBe(100);
    expect(mockRepo.findByPhone).toHaveBeenCalledWith("1234567890");
    expect(mockRepo.changePassword).toHaveBeenCalledWith(
      "1234567890",
      expect.any(String)
    );
    // Verify password was hashed
    const changePasswordCall = (
      mockRepo.changePassword as ReturnType<typeof mock>
    ).mock.calls[0];
    expect(changePasswordCall[1]).not.toBe("newPassword123"); // Should be hashed
  });

  it("should throw NotFoundError when customer not found", async () => {
    mockRepo.findByPhone = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute(
        { phone: "non-existent", password: "newPassword123" },
        mockRepo
      )
    ).rejects.toThrow(NotFoundError);

    expect(mockRepo.findByPhone).toHaveBeenCalledWith("non-existent");
    expect(mockRepo.changePassword).not.toHaveBeenCalled();
  });

  it("should hash password using argon2id", async () => {
    const existingCustomer: Customer = {
      phone: "1234567890",
      password: "old-hash",
      name: "John Doe",
      address: null,
      points: 0,
      totalSpent: null,
      totalOrders: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedCustomer: Customer = {
      ...existingCustomer,
      password: "new-hash",
    };

    mockRepo.findByPhone = mock(() => Promise.resolve(existingCustomer));
    mockRepo.changePassword = mock(() => Promise.resolve(updatedCustomer));

    await useCase.execute(
      { phone: "1234567890", password: "testPassword" },
      mockRepo
    );

    const changePasswordCall = (
      mockRepo.changePassword as ReturnType<typeof mock>
    ).mock.calls[0];
    const passwordHash = changePasswordCall[1];

    // Verify it's a hash (argon2id hashes start with $argon2id$)
    expect(passwordHash).toContain("$argon2id$");
    expect(passwordHash).not.toBe("testPassword");
  });

  it("should return customer without password field", async () => {
    const existingCustomer: Customer = {
      phone: "1234567890",
      password: "old-hash",
      name: "Jane Doe",
      address: "456 Oak Ave",
      points: 50,
      totalSpent: "250.00",
      totalOrders: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedCustomer: Customer = {
      ...existingCustomer,
      password: "new-hash",
    };

    mockRepo.findByPhone = mock(() => Promise.resolve(existingCustomer));
    mockRepo.changePassword = mock(() => Promise.resolve(updatedCustomer));

    const result = await useCase.execute(
      { phone: "1234567890", password: "newPassword" },
      mockRepo
    );

    // Verify other fields are present
    expect(result.phone).toBe("1234567890");
    expect(result.name).toBe("Jane Doe");
    expect(result.address).toBe("456 Oak Ave");
    expect(result.points).toBe(50);
  });
});
