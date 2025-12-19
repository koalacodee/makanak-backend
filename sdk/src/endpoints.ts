// @ts-nocheck

import type { KyInstance } from "ky";
import type {
  LoginInput,
  LoginResponse,
  Product,
  ProductInput,
  ProductQuery,
  ProductsResponse,
  Category,
  CategoryInput,
  Order,
  OrderInput,
  OrderUpdate,
  OrderQuery,
  OrdersResponse,
  Customer,
  CustomerInput,
  CustomerUpdate,
  CustomerPointsInfo,
  Cart,
  AddItemToCartInput,
  UpdateCartItemInput,
  BuyNowInput,
  StoreSettings,
  StoreSettingsInput,
  StaffMember,
  StaffMemberInput,
  StaffMemberUpdate,
  StaffStatusUpdate,
  Supplier,
  SupplierInput,
  SupplierQuery,
} from "./types";

export interface MeResponse {
  id: string;
  username: string;
  role: "admin" | "driver" | "cs" | "inventory";
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export class AuthEndpoints {
  constructor(private client: KyInstance) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    return this.client.post("v1/auth/login", { json: input }).json();
  }

  async logout(): Promise<void> {
    await this.client.post("v1/auth/logout", {
      credentials: "include",
    });
  }

  async refresh(): Promise<{ accessToken: string }> {
    return this.client
      .post("v1/auth/refresh", {
        credentials: "include",
      })
      .json();
  }

  async me(): Promise<MeResponse> {
    return this.client.get("v1/auth/me").json();
  }
}

export class ProductsEndpoints {
  constructor(private client: KyInstance) {}

  async list(query?: ProductQuery): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    if (query?.category) searchParams.set("category", query.category);
    if (query?.inStock !== undefined)
      searchParams.set("inStock", String(query.inStock));
    if (query?.page) searchParams.set("page", String(query.page));
    if (query?.limit) searchParams.set("limit", String(query.limit));

    return this.client
      .get("v1/products", { searchParams })
      .json<ProductsResponse>();
  }

  async get(id: string): Promise<Product> {
    return this.client.get(`v1/products/${id}`).json();
  }

  async create(input: ProductInput): Promise<Product> {
    return this.client.post("v1/products", { json: input }).json();
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    return this.client.put(`v1/products/${id}`, { json: input }).json();
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`v1/products/${id}`);
  }
}

export class CategoriesEndpoints {
  constructor(private client: KyInstance) {}

  async list(includeHidden?: boolean): Promise<Category[]> {
    const searchParams = new URLSearchParams();
    if (includeHidden !== undefined)
      searchParams.set("includeHidden", String(includeHidden));

    return this.client
      .get("v1/categories", { searchParams })
      .json<Category[]>();
  }

  async get(id: string): Promise<Category> {
    return this.client.get(`v1/categories/${id}`).json();
  }

  async create(input: CategoryInput): Promise<Category> {
    return this.client.post("v1/categories", { json: input }).json();
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    return this.client.put(`v1/categories/${id}`, { json: input }).json();
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`v1/categories/${id}`);
  }
}

export class OrdersEndpoints {
  constructor(private client: KyInstance) {}

  async list(query?: OrderQuery): Promise<OrdersResponse> {
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.phone) searchParams.set("phone", query.phone);
    if (query?.page) searchParams.set("page", String(query.page));
    if (query?.limit) searchParams.set("limit", String(query.limit));

    return this.client
      .get("v1/orders", { searchParams })
      .json<OrdersResponse>();
  }

  async get(id: string): Promise<Order> {
    return this.client.get(`v1/orders/${id}`).json();
  }

  async create(input: OrderInput): Promise<Order> {
    return this.client.post("v1/orders", { json: input }).json();
  }

  async update(id: string, input: OrderUpdate): Promise<Order> {
    return this.client.patch(`v1/orders/${id}`, { json: input }).json();
  }
}

export class CustomersEndpoints {
  constructor(private client: KyInstance) {}

  async get(phone: string): Promise<Customer> {
    return this.client.get(`v1/customers/${phone}`).json();
  }

  async upsert(phone: string, input: CustomerInput): Promise<Customer> {
    return this.client.put(`v1/customers/${phone}`, { json: input }).json();
  }

  async update(phone: string, input: CustomerUpdate): Promise<Customer> {
    return this.client.patch(`v1/customers/${phone}`, { json: input }).json();
  }

  async getPoints(phone: string): Promise<CustomerPointsInfo> {
    return this.client.get(`v1/customers/${phone}/points`).json();
  }
}

export class CartEndpoints {
  constructor(private client: KyInstance) {}

  async get(phone: string): Promise<Cart> {
    return this.client.get(`v1/carts/${phone}`).json();
  }

  async addItem(
    phone: string,
    input: AddItemToCartInput
  ): Promise<Cart["items"][0]> {
    return this.client.post(`v1/carts/${phone}/items`, { json: input }).json();
  }

  async updateItem(
    itemId: string,
    input: UpdateCartItemInput
  ): Promise<Cart["items"][0]> {
    return this.client
      .patch(`v1/carts/items/${itemId}`, { json: input })
      .json();
  }

  async removeItem(itemId: string): Promise<void> {
    await this.client.delete(`v1/carts/items/${itemId}`);
  }

  async clear(phone: string): Promise<void> {
    await this.client.delete(`v1/carts/${phone}`);
  }

  async buyNow(phone: string, input: BuyNowInput): Promise<Order> {
    return this.client
      .post(`v1/carts/${phone}/buy-now`, { json: input })
      .json();
  }
}

export class SettingsEndpoints {
  constructor(private client: KyInstance) {}

  async get(): Promise<StoreSettings | null> {
    return this.client.get("v1/settings").json();
  }

  async update(input: StoreSettingsInput): Promise<StoreSettings> {
    return this.client.put("v1/settings", { json: input }).json();
  }
}

export class StaffEndpoints {
  constructor(private client: KyInstance) {}

  async list(role?: string): Promise<StaffMember[]> {
    const searchParams = new URLSearchParams();
    if (role) searchParams.set("role", role);

    return this.client.get("v1/staff", { searchParams }).json<StaffMember[]>();
  }

  async get(id: string): Promise<StaffMember> {
    return this.client.get(`v1/staff/${id}`).json();
  }

  async create(input: StaffMemberInput): Promise<StaffMember> {
    return this.client.post("v1/staff", { json: input }).json();
  }

  async update(id: string, input: StaffMemberUpdate): Promise<StaffMember> {
    return this.client.patch(`v1/staff/${id}`, { json: input }).json();
  }

  async updateStatus(
    id: string,
    input: StaffStatusUpdate
  ): Promise<StaffMember> {
    return this.client.patch(`v1/staff/${id}/status`, { json: input }).json();
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`v1/staff/${id}`);
  }
}

export class SuppliersEndpoints {
  constructor(private client: KyInstance) {}

  async list(query?: SupplierQuery): Promise<Supplier[]> {
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.category) searchParams.set("category", query.category);

    return this.client.get("v1/suppliers", { searchParams }).json<Supplier[]>();
  }

  async get(id: string): Promise<Supplier> {
    return this.client.get(`v1/suppliers/${id}`).json();
  }

  async create(input: SupplierInput): Promise<Supplier> {
    return this.client.post("v1/suppliers", { json: input }).json();
  }

  async update(id: string, input: SupplierInput): Promise<Supplier> {
    return this.client.put(`v1/suppliers/${id}`, { json: input }).json();
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`v1/suppliers/${id}`);
  }
}

export class MakanakAPI {
  public auth: AuthEndpoints;
  public products: ProductsEndpoints;
  public categories: CategoriesEndpoints;
  public orders: OrdersEndpoints;
  public customers: CustomersEndpoints;
  public cart: CartEndpoints;
  public settings: SettingsEndpoints;
  public staff: StaffEndpoints;
  public suppliers: SuppliersEndpoints;

  constructor(client: KyInstance) {
    this.auth = new AuthEndpoints(client);
    this.products = new ProductsEndpoints(client);
    this.categories = new CategoriesEndpoints(client);
    this.orders = new OrdersEndpoints(client);
    this.customers = new CustomersEndpoints(client);
    this.cart = new CartEndpoints(client);
    this.settings = new SettingsEndpoints(client);
    this.staff = new StaffEndpoints(client);
    this.suppliers = new SuppliersEndpoints(client);
  }
}
