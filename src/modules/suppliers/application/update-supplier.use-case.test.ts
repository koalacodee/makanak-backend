import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "../../../shared/presentation/errors";
import type { Supplier, SupplierInput } from "../domain/supplier.entity";
import type { ISupplierRepository } from "../domain/suppliers.iface";
import { UpdateSupplierUseCase } from "./update-supplier.use-case";

describe("UpdateSupplierUseCase", () => {
	let useCase: UpdateSupplierUseCase;
	let mockRepo: ISupplierRepository;

	beforeEach(() => {
		useCase = new UpdateSupplierUseCase();
		mockRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as Supplier)),
			update: mock(() => Promise.resolve({} as Supplier)),
			delete: mock(() => Promise.resolve()),
		};
	});

	it("should update supplier successfully", async () => {
		const existingSupplier: Supplier = {
			id: "supplier-1",
			name: "Supplier One",
			phone: "1234567890",
			category: "groceries",
			companyName: null,
			notes: null,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const updatedSupplier: Supplier = {
			...existingSupplier,
			name: "Updated Supplier",
			phone: "9999999999",
			status: "active",
		};

		mockRepo.findById = mock(() => Promise.resolve(existingSupplier));
		mockRepo.update = mock(() => Promise.resolve(updatedSupplier));

		const result = await useCase.execute(
			"supplier-1",
			{ name: "Updated Supplier", phone: "9999999999", status: "active" },
			mockRepo,
		);

		expect(result).toEqual(updatedSupplier);
		expect(mockRepo.findById).toHaveBeenCalledWith("supplier-1");
		expect(mockRepo.update).toHaveBeenCalledWith("supplier-1", {
			name: "Updated Supplier",
			phone: "9999999999",
			status: "active",
		});
	});

	it("should update single field", async () => {
		const existingSupplier: Supplier = {
			id: "supplier-1",
			name: "Supplier One",
			phone: "1234567890",
			category: "groceries",
			companyName: null,
			notes: null,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const updatedSupplier: Supplier = {
			...existingSupplier,
			name: "Updated Name",
		};

		mockRepo.findById = mock(() => Promise.resolve(existingSupplier));
		mockRepo.update = mock(() => Promise.resolve(updatedSupplier));

		await useCase.execute("supplier-1", { name: "Updated Name" }, mockRepo);

		expect(mockRepo.update).toHaveBeenCalledWith("supplier-1", {
			name: "Updated Name",
		});
	});

	it("should update multiple fields", async () => {
		const existingSupplier: Supplier = {
			id: "supplier-1",
			name: "Supplier One",
			phone: "1234567890",
			category: "groceries",
			companyName: null,
			notes: null,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const updatedSupplier: Supplier = {
			...existingSupplier,
			name: "Updated Name",
			phone: "9999999999",
			category: "beverages",
			companyName: "New Company",
			notes: "New notes",
			status: "active",
		};

		mockRepo.findById = mock(() => Promise.resolve(existingSupplier));
		mockRepo.update = mock(() => Promise.resolve(updatedSupplier));

		await useCase.execute(
			"supplier-1",
			{
				name: "Updated Name",
				phone: "9999999999",
				category: "beverages",
				companyName: "New Company",
				notes: "New notes",
				status: "active",
			},
			mockRepo,
		);

		expect(mockRepo.update).toHaveBeenCalledWith("supplier-1", {
			name: "Updated Name",
			phone: "9999999999",
			category: "beverages",
			companyName: "New Company",
			notes: "New notes",
			status: "active",
		});
	});

	it("should throw NotFoundError when supplier not found", async () => {
		mockRepo.findById = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute("non-existent-id", { name: "Updated Name" }, mockRepo),
		).rejects.toThrow(NotFoundError);
		try {
			await useCase.execute(
				"non-existent-id",
				{ name: "Updated Name" },
				mockRepo,
			);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe("Supplier not found");
		}
		expect(mockRepo.update).not.toHaveBeenCalled();
	});
});
