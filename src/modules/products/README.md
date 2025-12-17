# Products Module

Product catalog management with category filtering, stock tracking, and pagination.

## Overview

The Products module manages the grocery product catalog, including product details, pricing, stock levels, and category associations.

## Features

- **CRUD Operations** - Create, read, update, delete products
- **Category Filtering** - Filter products by category
- **Stock Management** - Track inventory levels
- **Pagination** - Efficient list retrieval with pagination
- **Price Management** - Support for regular and original prices (discounts)

## Domain Entities

### Product

```typescript
interface Product {
  id: string;              // UUID
  name: string;            // Product name (Arabic)
  price: string;           // Current price (decimal as string)
  unit: string;            // Unit of measurement (e.g., "كيلو", "لتر")
  category: string;        // Category ID
  image: string;           // Product image URL
  description: string;     // Product description (Arabic)
  stock: number;           // Available quantity
  originalPrice?: string;  // Original price before discount
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/v1/products`

Get paginated list of products with optional filters.

**Query Parameters:**
- `category` (string, optional) - Filter by category ID
- `inStock` (boolean, optional) - Filter products in stock
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "طماطم",
      "price": 15.50,
      "unit": "كيلو",
      "category": "category-id",
      "image": "https://...",
      "description": "...",
      "stock": 100,
      "originalPrice": 20.00
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET `/v1/products/:id`

Get a single product by ID.

**Response:** Single product object

### POST `/v1/products`

Create a new product.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Request:**
```json
{
  "name": "طماطم",
  "price": 15.50,
  "unit": "كيلو",
  "category": "category-id",
  "image": "https://...",
  "description": "...",
  "stock": 100,
  "originalPrice": 20.00
}
```

**Response:** Created product

### PUT `/v1/products/:id`

Update an existing product.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Request:** Same as POST (all fields optional)

**Response:** Updated product

### DELETE `/v1/products/:id`

Delete a product.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Response:** `204 No Content`

## Use Cases

### GetProductsUseCase

Retrieves paginated product list:
- Applies category filter if provided
- Applies stock filter if provided
- Calculates pagination metadata
- Validates pagination parameters

### GetProductUseCase

Retrieves single product:
- Validates product ID
- Returns 404 if not found

### CreateProductUseCase

Creates new product:
- Validates required fields
- Generates UUID for product ID
- Sets default stock to 0 if not provided

### UpdateProductUseCase

Updates existing product:
- Validates product exists
- Updates only provided fields
- Maintains existing values for omitted fields

### DeleteProductUseCase

Deletes product:
- Validates product exists
- Removes product from database

## Business Rules

- Product names and descriptions are in Arabic
- Prices are stored as decimal strings for precision
- Stock cannot be negative
- Products can have original prices for discount display
- Category must exist (enforced by foreign key)

## Testing

Run tests:
```bash
bun test src/modules/products
```

Test coverage includes:
- Product CRUD operations
- Pagination validation
- Category filtering
- Stock filtering
- Error handling (404, validation)

