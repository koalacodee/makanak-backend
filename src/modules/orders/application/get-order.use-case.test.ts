import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { GetOrderUseCase } from "./get-order.use-case";
import type { IOrderRepository } from "../domain/orders.iface";
import type { IAttachmentRepository } from "@/shared/attachments";
import type { Order } from "../domain/order.entity";
import type { Attachment } from "@/shared/attachments";
import { NotFoundError } from "../../../shared/presentation/errors";
import filehub from "@/shared/filehub";

describe("GetOrderUseCase", () => {
  let useCase: GetOrderUseCase;
  let mockOrderRepo: IOrderRepository;
  let mockAttachmentRepo: IAttachmentRepository;
  let originalGetSignedUrlBatch: typeof filehub.getSignedUrlBatch;

  beforeEach(() => {
    useCase = new GetOrderUseCase();
    mockOrderRepo = {
      findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as Order)),
      update: mock(() => Promise.resolve({} as Order)),
      getReadyOrdersForDriver: mock(() =>
        Promise.resolve({ orders: [], counts: [] })
      ),
      count: mock(() => Promise.resolve(0)),
      saveCancellation: mock(() => Promise.resolve({} as any)),
    };
    mockAttachmentRepo = {
      findById: mock(() => Promise.resolve(null)),
      findByTargetId: mock(() => Promise.resolve([])),
      findByTargetIds: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({} as Attachment)),
      update: mock(() => Promise.resolve({} as Attachment)),
      delete: mock(() => Promise.resolve()),
      deleteByTargetId: mock(() => Promise.resolve()),
    };
    originalGetSignedUrlBatch = filehub.getSignedUrlBatch;
    filehub.getSignedUrlBatch = mock(() =>
      Promise.resolve([])
    ) as typeof filehub.getSignedUrlBatch;
  });

  afterEach(() => {
    filehub.getSignedUrlBatch = originalGetSignedUrlBatch;
  });

  it("should return order when found", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockAttachmentRepo.findByTargetIds = mock(() => Promise.resolve([]));
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([]));

    const result = await useCase.execute(
      "order-1",
      mockOrderRepo,
      mockAttachmentRepo
    );

    expect(result.id).toBe("order-1");
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockAttachmentRepo.findByTargetIds).toHaveBeenCalledWith([
      "order-1",
    ]);
  });

  it("should return order with receipt image when attachment exists", async () => {
    const mockOrder: Order = {
      id: "order-1",
      customerName: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
      orderItems: [],
      total: 100,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const mockAttachment: Attachment = {
      id: "att-1",
      filename: "receipt.jpg",
      targetId: "order-1",
      size: 1024,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSignedUrl = {
      filename: "receipt.jpg",
      signedUrl: "https://example.com/signed/receipt.jpg",
      expirationDate: new Date(),
    };

    mockOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
    mockAttachmentRepo.findByTargetIds = mock(() =>
      Promise.resolve([mockAttachment])
    );
    filehub.getSignedUrlBatch = mock(() => Promise.resolve([mockSignedUrl]));

    const result = await useCase.execute(
      "order-1",
      mockOrderRepo,
      mockAttachmentRepo
    );

    expect(result.receiptImage).toBe("https://example.com/signed/receipt.jpg");
  });

  it("should throw NotFoundError when order not found", async () => {
    mockOrderRepo.findById = mock(() => Promise.resolve(null));

    await expect(
      useCase.execute("non-existent", mockOrderRepo, mockAttachmentRepo)
    ).rejects.toThrow(NotFoundError);
    expect(mockOrderRepo.findById).toHaveBeenCalledWith("non-existent");
  });
});
