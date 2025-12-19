# Makanak API SDK

A type-safe, ky-powered SDK for the Makanak API with automatic token management and refresh.

## Installation

```bash
npm install @makanac/sdk ky js-cookie
# or
yarn add @makanac/sdk ky js-cookie
# or
pnpm add @makanac/sdk ky js-cookie
```

## Usage

### Basic Setup

```typescript
import { MakanakSDK, MakanakAPI } from "@makanac/sdk";

// Create SDK instance
const sdk = new MakanakSDK({
  baseURL: "https://api.makanac.com", // Optional, defaults to http://localhost:3000
  accessTokenCookieName: "accessToken", // Optional, defaults to "accessToken"
  refreshTokenCookieName: "refreshToken", // Optional, defaults to "refreshToken"
});

// Create API client
const api = new MakanakAPI(sdk.getClient());
```

### Authentication

```typescript
// Login
const loginResponse = await api.auth.login({
  username: "admin",
  password: "password123",
});

// Store access token (automatically handled by SDK, but you can also set it manually)
sdk.setAccessToken(loginResponse.token);

// Logout
await api.auth.logout();

// Clear tokens
sdk.clearTokens();
```

### Using API Endpoints

```typescript
// Products
const products = await api.products.list({ page: 1, limit: 20 });
const product = await api.products.get("product-id");
const newProduct = await api.products.create({
  name: "Product Name",
  price: 10.99,
  unit: "kg",
  category: "category-id",
  image: "https://example.com/image.jpg",
  description: "Product description",
  stock: 100,
});

// Categories
const categories = await api.categories.list();
const category = await api.categories.get("category-id");

// Orders
const orders = await api.orders.list({ status: "pending" });
const order = await api.orders.get("order-id");
const newOrder = await api.orders.create({
  customerName: "John Doe",
  phone: "1234567890",
  address: "123 Main St",
  items: [{ id: "product-id", quantity: 2 }],
  paymentMethod: "cod",
});

// Customers
const customer = await api.customers.get("1234567890");
const updatedCustomer = await api.customers.update("1234567890", {
  name: "John Doe",
  address: "123 Main St",
});

// Cart
const cart = await api.cart.get("1234567890");
await api.cart.addItem("1234567890", {
  productId: "product-id",
  quantity: 2,
});
const order = await api.cart.buyNow("1234567890", {
  customerName: "John Doe",
  address: "123 Main St",
  paymentMethod: "cod",
});

// Settings
const settings = await api.settings.get();
const updatedSettings = await api.settings.update({
  deliveryFee: 5.0,
  pointsSystem: {
    active: true,
    value: 1,
    redemptionValue: 100,
  },
});

// Staff (admin only)
const staff = await api.staff.list();
const member = await api.staff.get("staff-id");

// Suppliers (admin/inventory only)
const suppliers = await api.suppliers.list({ status: "active" });
```

## Features

### Automatic Token Management

The SDK automatically:

- Adds the access token to protected endpoints from cookies
- Detects 401 Unauthorized responses
- Refreshes the access token using the refresh token cookie
- Retries the original request with the new token
- Clears tokens if refresh fails

### Protected Endpoints

Protected endpoints automatically require authentication:

- `/v1/products` (POST, PUT, DELETE)
- `/v1/categories` (POST, PUT, DELETE)
- `/v1/orders` (POST, PATCH)
- `/v1/staff` (all operations)
- `/v1/suppliers` (all operations)
- `/v1/settings` (PUT)
- `/v1/customers` (PUT, PATCH)
- `/v1/carts` (POST, PATCH, DELETE)

### Public Endpoints

These endpoints don't require authentication:

- `/v1/auth/login`
- `/v1/products` (GET)
- `/v1/categories` (GET)
- `/v1/orders/:id` (GET)
- `/v1/settings` (GET)
- `/v1/customers/:phone` (GET)
- `/v1/carts/:phone` (GET)

## Type Safety

All endpoints are fully typed with TypeScript, providing autocomplete and type checking for:

- Request parameters
- Request bodies
- Response types
- Query parameters

## Error Handling

The SDK uses ky's error handling. You can catch errors like:

```typescript
try {
  await api.products.create({ ... });
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - token refresh will be attempted automatically
  } else if (error.response?.status === 400) {
    // Bad request - check error.response.json() for details
  }
}
```

## Cookie Management

The SDK uses `js-cookie` to manage tokens. Tokens are stored as:

- `accessToken` - Access token (expires in 1 day)
- `refreshToken` - Refresh token (managed by server via httpOnly cookie)

Make sure your application has `js-cookie` installed and cookies are enabled.
