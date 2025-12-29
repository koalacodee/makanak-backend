import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	BadRequestError,
	NotFoundError,
} from "../../../shared/presentation/errors";
import type { Customer, CustomerUpdateInput } from "../domain/customer.entity";
import type { ICustomerRepository } from "../domain/customers.iface";
import { UpdateCustomerUseCase } from "./update-customer.use-case";

describe("UpdateCustomerUseCase", () => {
	let useCase: UpdateCustomerUseCase;
	let mockRepo: ICustomerRepository;

	beforeEach(() => {
		useCase = new UpdateCustomerUseCase();
		mockRepo = {
			findByPhone: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Customer)),
			update: mock(() => Promise.resolve({} as Customer)),
			upsert: mock(() => Promise.resolve({} as Customer)),
			getPointsInfo: mock(() => Promise.resolve(null)),
			changePassword: mock(() => Promise.resolve({} as Customer)),
			findAll: mock(() => Promise.resolve([])),
		};
	});

	it("should update customer points", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			points: 200,
		};

		const updateInput: CustomerUpdateInput = {
			points: 200,
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should update customer points using delta", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			points: 150, // 100 + 50
		};

		const updateInput: CustomerUpdateInput = {
			pointsDelta: 50,
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should update customer name", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			name: "Jane Doe",
		};

		const updateInput: CustomerUpdateInput = {
			name: "Jane Doe",
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should update customer address", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			address: "456 Oak Ave",
		};

		const updateInput: CustomerUpdateInput = {
			address: "456 Oak Ave",
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should update multiple fields", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			name: "Jane Doe",
			address: "456 Oak Ave",
		};

		const updateInput: CustomerUpdateInput = {
			name: "Jane Doe",
			address: "456 Oak Ave",
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should throw BadRequestError when both points and pointsDelta are provided", async () => {
		const updateInput: CustomerUpdateInput = {
			points: 200,
			pointsDelta: 50,
		};

		await expect(
			useCase.execute("1234567890", updateInput, mockRepo),
		).rejects.toThrow(BadRequestError);

		try {
			await useCase.execute("1234567890", updateInput, mockRepo);
		} catch (error: unknown) {
			if (error instanceof BadRequestError) {
				expect(error.details).toBeDefined();
				expect(error.details[0].message).toBe(
					"Cannot specify both 'points' and 'pointsDelta'",
				);
			} else {
				throw error;
			}
		}
	});

	it("should handle negative pointsDelta", async () => {
		const existingCustomer: Customer = {
			phone: "1234567890",
			name: "John Doe",
			address: "123 Main St",
			points: 100,
			totalSpent: "500.00",
			totalOrders: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: "someHash",
		};

		const updatedCustomer: Customer = {
			...existingCustomer,
			points: 50, // 100 - 50
		};

		const updateInput: CustomerUpdateInput = {
			pointsDelta: -50,
		};

		mockRepo.update = mock(() => Promise.resolve(updatedCustomer));

		const result = await useCase.execute("1234567890", updateInput, mockRepo);

		expect(result).toEqual(updatedCustomer);
		expect(mockRepo.update).toHaveBeenCalledWith("1234567890", updateInput);
	});

	it("should propagate NotFoundError from repository", async () => {
		const updateInput: CustomerUpdateInput = {
			points: 200,
		};

		mockRepo.update = mock(() =>
			Promise.reject(
				new NotFoundError([{ path: "phone", message: "Customer not found" }]),
			),
		);

		await expect(
			useCase.execute("non-existent-phone", updateInput, mockRepo),
		).rejects.toThrow(NotFoundError);
	});
});
