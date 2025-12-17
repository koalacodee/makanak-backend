import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateSettingsUseCase } from "./update-settings.use-case";
import type { ISettingsRepository } from "../domain/settings.iface";
import type {
  StoreSettings,
  StoreSettingsInput,
} from "../domain/settings.entity";

describe("UpdateSettingsUseCase", () => {
  let useCase: UpdateSettingsUseCase;
  let mockRepo: ISettingsRepository;

  beforeEach(() => {
    useCase = new UpdateSettingsUseCase();
    mockRepo = {
      find: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StoreSettings)),
      update: mock(() => Promise.resolve({} as StoreSettings)),
    };
  });

  it("should update existing settings successfully", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      pointsSystem: {
        active: true,
        value: 10,
        redemptionValue: 0.1,
      },
      deliveryFee: "7.50",
      updatedAt: new Date("2024-01-02"),
    };

    const updateInput: StoreSettingsInput = {
      pointsSystem: {
        active: true,
        value: 10,
        redemptionValue: 0.1,
      },
      deliveryFee: 7.5,
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should create settings if they don't exist", async () => {
    const newSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: true,
        value: 10,
        redemptionValue: 0.1,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateInput: StoreSettingsInput = {
      pointsSystem: {
        active: true,
        value: 10,
        redemptionValue: 0.1,
      },
      deliveryFee: 5.0,
    };

    mockRepo.find = mock(() => Promise.resolve(null));
    mockRepo.update = mock(() => Promise.resolve(newSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(newSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update only points system", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      pointsSystem: {
        active: true,
        value: 20,
        redemptionValue: 0.2,
      },
    };

    const updateInput: StoreSettingsInput = {
      pointsSystem: {
        active: true,
        value: 20,
        redemptionValue: 0.2,
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update only delivery fee", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      deliveryFee: "10.00",
    };

    const updateInput: StoreSettingsInput = {
      deliveryFee: 10.0,
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update announcement", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      announcement: {
        active: true,
        message: "New announcement!",
      },
    };

    const updateInput: StoreSettingsInput = {
      announcement: {
        active: true,
        message: "New announcement!",
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update social media", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      socialMedia: {
        facebook: "https://facebook.com/store",
        instagram: "@store",
        phone: "1234567890",
        email: "store@example.com",
      },
    };

    const updateInput: StoreSettingsInput = {
      socialMedia: {
        facebook: "https://facebook.com/store",
        instagram: "@store",
        phone: "1234567890",
        email: "store@example.com",
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update payment info", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      paymentInfo: {
        vodafoneCash: "01012345678",
        instaPay: "01012345678",
      },
    };

    const updateInput: StoreSettingsInput = {
      paymentInfo: {
        vodafoneCash: "01012345678",
        instaPay: "01012345678",
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update promo", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      promo: {
        isActive: true,
        image: "https://example.com/promo.jpg",
        topBadge: "New",
        title: "Special Offer",
        description: "Get 20% off",
        code: "SAVE20",
        buttonText: "Shop Now",
      },
    };

    const updateInput: StoreSettingsInput = {
      promo: {
        isActive: true,
        image: "https://example.com/promo.jpg",
        topBadge: "New",
        title: "Special Offer",
        description: "Get 20% off",
        code: "SAVE20",
        buttonText: "Shop Now",
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update content", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      content: {
        hero: {
          badge: "Best Store",
          titleLine1: "Welcome",
          titleHighlight: "to Makanak",
          description: "Fresh groceries delivered to your door",
        },
        features: [
          {
            title: "Fast Delivery",
            description: "Get your order in 30 minutes",
          },
        ],
        journey: {
          title: "How it works",
          steps: [
            {
              title: "Order",
              description: "Choose your items",
            },
          ],
        },
        sections: {
          categoriesTitle: "Categories",
          categoriesSubtitle: "Browse our selection",
        },
        info: {
          terms: [
            {
              title: "Terms",
              description: "Our terms and conditions",
            },
          ],
          quality: {
            title: "Quality",
            description: "We guarantee quality",
            hotline: "1234567890",
          },
        },
      },
    };

    const updateInput: StoreSettingsInput = {
      content: {
        hero: {
          badge: "Best Store",
          titleLine1: "Welcome",
          titleHighlight: "to Makanak",
          description: "Fresh groceries delivered to your door",
        },
        features: [
          {
            title: "Fast Delivery",
            description: "Get your order in 30 minutes",
          },
        ],
        journey: {
          title: "How it works",
          steps: [
            {
              title: "Order",
              description: "Choose your items",
            },
          ],
        },
        sections: {
          categoriesTitle: "Categories",
          categoriesSubtitle: "Browse our selection",
        },
        info: {
          terms: [
            {
              title: "Terms",
              description: "Our terms and conditions",
            },
          ],
          quality: {
            title: "Quality",
            description: "We guarantee quality",
            hotline: "1234567890",
          },
        },
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });

  it("should update multiple fields at once", async () => {
    const existingSettings: StoreSettings = {
      id: "settings-1",
      pointsSystem: {
        active: false,
        value: 0,
        redemptionValue: 0,
      },
      deliveryFee: "5.00",
      announcement: {
        active: false,
        message: "",
      },
      socialMedia: {},
      paymentInfo: {},
      promo: {
        isActive: false,
      },
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSettings: StoreSettings = {
      ...existingSettings,
      pointsSystem: {
        active: true,
        value: 15,
        redemptionValue: 0.15,
      },
      deliveryFee: "8.00",
      announcement: {
        active: true,
        message: "Updated announcement",
      },
      socialMedia: {
        facebook: "https://facebook.com/store",
      },
    };

    const updateInput: StoreSettingsInput = {
      pointsSystem: {
        active: true,
        value: 15,
        redemptionValue: 0.15,
      },
      deliveryFee: 8.0,
      announcement: {
        active: true,
        message: "Updated announcement",
      },
      socialMedia: {
        facebook: "https://facebook.com/store",
      },
    };

    mockRepo.find = mock(() => Promise.resolve(existingSettings));
    mockRepo.update = mock(() => Promise.resolve(updatedSettings));

    const result = await useCase.execute(updateInput, mockRepo);

    expect(result).toEqual(updatedSettings);
    expect(mockRepo.update).toHaveBeenCalledWith(updateInput);
  });
});
