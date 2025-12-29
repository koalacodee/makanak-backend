import { beforeEach, describe, expect, it, mock } from "bun:test";
import { BadRequestError } from "../../../shared/presentation/errors";
import type { IUserRepository } from "../../auth/domain/auth.iface";
import type { User } from "../../auth/domain/user.entity";
import type { StaffMember } from "../domain/staff.entity";
import type { IStaffRepository } from "../domain/staff.iface";
import { CreateStaffMemberUseCase } from "./create-staff-member.use-case";

describe("CreateStaffMemberUseCase", () => {
	let useCase: CreateStaffMemberUseCase;
	let mockStaffRepo: IStaffRepository;
	let mockUserRepo: IUserRepository;

	beforeEach(() => {
		useCase = new CreateStaffMemberUseCase();
		mockStaffRepo = {
			findAll: mock(() => Promise.resolve([])),
			findById: mock(() => Promise.resolve(null)),
			findByUserId: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as StaffMember)),
			update: mock(() => Promise.resolve({} as StaffMember)),
			delete: mock(() => Promise.resolve()),
		};
		mockUserRepo = {
			findByUsername: mock(() => Promise.resolve(null)),
			findById: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve({} as User)),
			update: mock(() => Promise.resolve({} as User)),
			delete: mock(() => Promise.resolve()),
			updateLastLogin: mock(() => Promise.resolve()),
		};
	});

	it("should create staff member successfully", async () => {
		const inputData = {
			name: "John Doe",
			username: "johndoe",
			password: "password123",
			role: "admin" as const,
			phone: "1234567890",
			specialization: undefined,
		};

		const mockCreatedUser: User = {
			id: "user-1",
			username: "johndoe",
			passwordHash: "hashed-password",
			role: "admin",
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: null,
		};

		const mockCreatedStaff: StaffMember = {
			id: "staff-1",
			userId: "user-1",
			name: "John Doe",
			username: "johndoe",
			role: "admin",
			phone: "1234567890",
			activeOrders: 0,
			specialization: null,
			isOnline: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));
		mockUserRepo.create = mock(() => Promise.resolve(mockCreatedUser));
		mockStaffRepo.create = mock(() => Promise.resolve(mockCreatedStaff));

		const result = await useCase.execute(
			inputData,
			mockStaffRepo,
			mockUserRepo,
		);

		expect(result).toEqual(mockCreatedStaff);
		expect(mockUserRepo.findByUsername).toHaveBeenCalledWith("johndoe");
		expect(mockUserRepo.create).toHaveBeenCalled();
		expect(mockStaffRepo.create).toHaveBeenCalledWith({
			userId: expect.any(String),
			name: "John Doe",
			phone: "1234567890",
			specialization: undefined,
			activeOrders: 0,
			isOnline: false,
		});
	});

	it("should throw BadRequestError when username already exists", async () => {
		const inputData = {
			name: "John Doe",
			username: "existinguser",
			password: "password123",
			role: "admin" as const,
		};

		const existingUser: User = {
			id: "user-1",
			username: "existinguser",
			passwordHash: "hashed",
			role: "admin",
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: null,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(existingUser));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe("Username already exists");
		}
		expect(mockStaffRepo.create).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError when name is empty", async () => {
		const inputData = {
			name: "",
			username: "johndoe",
			password: "password123",
			role: "admin" as const,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe("Name is required");
		}
	});

	it("should throw BadRequestError when name is whitespace only", async () => {
		const inputData = {
			name: "   ",
			username: "johndoe",
			password: "password123",
			role: "admin" as const,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe("Name is required");
		}
	});

	it("should throw BadRequestError when username is empty", async () => {
		const inputData = {
			name: "John Doe",
			username: "",
			password: "password123",
			role: "admin" as const,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe("Username is required");
		}
	});

	it("should throw BadRequestError when password is too short", async () => {
		const inputData = {
			name: "John Doe",
			username: "johndoe",
			password: "12345", // Less than 6 characters
			role: "admin" as const,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe(
				"Password must be at least 6 characters",
			);
		}
	});

	it("should throw BadRequestError when password is empty", async () => {
		const inputData = {
			name: "John Doe",
			username: "johndoe",
			password: "",
			role: "admin" as const,
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));

		await expect(
			useCase.execute(inputData, mockStaffRepo, mockUserRepo),
		).rejects.toThrow(BadRequestError);
		try {
			await useCase.execute(inputData, mockStaffRepo, mockUserRepo);
		} catch (error: any) {
			expect(error.details).toBeDefined();
			expect(error.details[0].message).toBe(
				"Password must be at least 6 characters",
			);
		}
	});

	it("should create staff member with optional fields", async () => {
		const inputData = {
			name: "Jane Driver",
			username: "janedriver",
			password: "password123",
			role: "driver" as const,
			phone: "0987654321",
			specialization: "groceries",
		};

		const mockCreatedUser: User = {
			id: "user-2",
			username: "janedriver",
			passwordHash: "hashed-password",
			role: "driver",
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: null,
		};

		const mockCreatedStaff: StaffMember = {
			id: "staff-2",
			userId: "user-2",
			name: "Jane Driver",
			username: "janedriver",
			role: "driver",
			phone: "0987654321",
			activeOrders: 0,
			specialization: "groceries",
			isOnline: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockUserRepo.findByUsername = mock(() => Promise.resolve(null));
		mockUserRepo.create = mock(() => Promise.resolve(mockCreatedUser));
		mockStaffRepo.create = mock(() => Promise.resolve(mockCreatedStaff));

		const result = await useCase.execute(
			inputData,
			mockStaffRepo,
			mockUserRepo,
		);

		expect(result).toEqual(mockCreatedStaff);
		expect(mockStaffRepo.create).toHaveBeenCalledWith({
			userId: expect.any(String),
			name: "Jane Driver",
			phone: "0987654321",
			specialization: "groceries",
			activeOrders: 0,
			isOnline: false,
		});
	});
});
