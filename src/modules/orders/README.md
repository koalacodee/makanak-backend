# Orders Module

Order processing and tracking system with status management and driver assignment.

## Overview

The Orders module handles the complete order lifecycle from creation to delivery, including order tracking, status updates, and driver assignment.

## Features

- **Order Creation** - Create orders with items, customer info, and payment details
- **Status Tracking** - Track order through multiple statuses
- **Driver Assignment** - Assign orders to delivery drivers
- **Points Integration** - Support for loyalty points usage
- **Receipt Management** - Store receipt images
- **Pagination** - Efficient order list retrieval

## Domain Entities

### Order

```typescript
interface Order {
  id: string;                    // UUID
  customerName: string;          // Customer name
  phone: string;                // Customer phone (links to customers table)
  address: string;              // Delivery address
  items: CartItem[];            // Order items with product details
  subtotal?: string;            // Subtotal before delivery fee
  deliveryFee?: string;         // Delivery fee
  total: string;                // Total amount
  status: OrderStatus;          // pending | processing | ready | out_for_delivery | delivered | cancelled
  driverId?: string;            // Assigned driver ID
  createdAt: Date;
  deliveredAt?: Date;           // Delivery timestamp
  receiptImage?: string;         // Base64 or URL
  paymentMethod?: PaymentMethod; // cod | online | wallet
  pointsUsed?: number;          // Loyalty points used
  pointsDiscount?: string;      // Discount from points
  // Legacy fields
  date?: Date;
  timestamp?: number;
  deliveryTimestamp?: number;
}
```

### CartItem

```typescript
interface CartItem extends Product {
  quantity: number;             // Quantity ordered
}
```

## API Endpoints

### GET `/v1/orders`

Get paginated list of orders with filters.

**Headers:** `Authorization: Bearer <token>` (staff)

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `driverId` (string, optional) - Filter by driver
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customerName": "John Doe",
      "phone": "1234567890",
      "address": "123 Main St",
      "items": [...],
      "total": 150.50,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### GET `/v1/orders/:id`

Get a single order by ID (public endpoint).

**Response:** Single order object with full details

### POST `/v1/orders`

Create a new order.

**Request:**
```json
{
  "customerName": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St",
  "items": [
    {
      "id": "product-id",
      "quantity": 2
    }
  ],
  "subtotal": 100.00,
  "deliveryFee": 10.00,
  "paymentMethod": "cod",
  "pointsUsed": 50,
  "pointsDiscount": 5.00
}
```

**Response:** Created order with calculated total

### PATCH `/v1/orders/:id`

Update order status and assignment.

**Headers:** `Authorization: Bearer <token>` (staff)

**Request:**
```json
{
  "status": "processing",
  "driverId": "driver-uuid",
  "receiptImage": "base64_or_url"
}
```

**Response:** Updated order

## Use Cases

### GetOrdersUseCase

Retrieves paginated order list:
- Applies status filter if provided
- Applies driver filter if provided
- Calculates pagination metadata
- Validates pagination parameters

### GetOrderUseCase

Retrieves single order:
- Includes order items with product details
- Validates order ID
- Returns 404 if not found

### CreateOrderUseCase

Creates new order:
- Validates order items (must have at least one)
- Validates item quantities (> 0)
- Calculates total if not provided
- Creates order items
- Links to customer by phone

### UpdateOrderUseCase

Updates order status:
- Validates order exists
- Updates status, driver, or receipt
- Updates deliveredAt timestamp when status is "delivered"

## Order Status Flow

```
pending → processing → ready → out_for_delivery → delivered
   ↓
cancelled
```

## Business Rules

- Orders must have at least one item
- Item quantities must be positive
- Total is calculated as: subtotal + deliveryFee - pointsDiscount
- Orders can be cancelled from any status
- Driver assignment is optional
- Receipt images can be base64 or URLs
- Points discount is calculated based on store settings

## Testing

Run tests:
```bash
bun test src/modules/orders
```

Test coverage includes:
- Order CRUD operations
- Status transitions
- Driver assignment
- Points integration
- Pagination validation
- Error handling (404, validation)

