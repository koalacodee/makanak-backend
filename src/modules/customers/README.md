# Customers Module

Customer management and loyalty points system.

## Overview

The Customers module manages customer profiles, tracks loyalty points, and provides customer information for order processing.

## Features

- **Customer Profiles** - Store customer information (name, phone, address)
- **Loyalty Points** - Track and manage customer points balance
- **Points History** - Track total spent and order count
- **Upsert Operations** - Create or update customers in one operation
- **Points Management** - Set points directly or adjust with delta

## Domain Entities

### Customer

```typescript
interface Customer {
  phone: string;            // Primary key (unique identifier)
  name?: string;           // Customer full name
  address?: string;        // Default delivery address
  points: number;          // Current loyalty points balance
  totalSpent: string;      // Total amount spent (decimal as string)
  totalOrders: number;     // Total number of orders
  createdAt: Date;
  updatedAt: Date;
}
```

### CustomerPointsInfo

```typescript
interface CustomerPointsInfo {
  phone: string;
  points: number;
  totalSpent: number;      // Parsed as number
  totalOrders: number;
}
```

## API Endpoints

### GET `/v1/customers/:phone`

Get customer by phone number.

**Response:**
```json
{
  "phone": "1234567890",
  "name": "John Doe",
  "address": "123 Main St",
  "points": 150,
  "totalSpent": 750.50,
  "totalOrders": 5
}
```

### PUT `/v1/customers/:phone`

Create or update customer (upsert).

**Request:**
```json
{
  "name": "John Doe",
  "address": "123 Main St",
  "points": 100,
  "totalSpent": 500.00,
  "totalOrders": 3
}
```

**Response:** Created or updated customer

### PATCH `/v1/customers/:phone`

Update customer fields (partial update).

**Request:**
```json
{
  "points": 200,           // Set points to specific value
  "pointsDelta": 50,       // OR add/subtract from current (cannot use both)
  "name": "Jane Doe",
  "address": "456 Oak Ave"
}
```

**Response:** Updated customer

**Note:** Cannot specify both `points` and `pointsDelta` in the same request.

### GET `/v1/customers/:phone/points`

Get customer loyalty points information.

**Response:**
```json
{
  "phone": "1234567890",
  "points": 150,
  "totalSpent": 750.50,
  "totalOrders": 5
}
```

## Use Cases

### GetCustomerUseCase

Retrieves customer by phone:
- Validates phone number
- Returns 404 if customer not found

### UpsertCustomerUseCase

Creates or updates customer:
- Creates new customer if doesn't exist
- Updates existing customer if found
- Ensures phone matches path parameter

### UpdateCustomerUseCase

Updates customer fields:
- Validates customer exists
- Prevents using both `points` and `pointsDelta`
- Updates only provided fields
- Calculates new points if using `pointsDelta`

### GetCustomerPointsUseCase

Retrieves points information:
- Returns formatted points data
- Includes total spent and order count
- Returns 404 if customer not found

## Business Rules

- Phone number is the unique identifier (primary key)
- Points cannot be negative (enforced by application logic)
- `pointsDelta` allows adding or subtracting points
- Cannot use both `points` and `pointsDelta` simultaneously
- Total spent and order count are updated by order processing
- Customer is automatically created on first order if doesn't exist

## Points System Integration

The points system integrates with:
- **Order Creation**: Points can be used for discounts
- **Order Completion**: Points are earned based on store settings
- **Store Settings**: Points earning/redemption rates configured in Settings module

## Testing

Run tests:
```bash
bun test src/modules/customers
```

Test coverage includes:
- Customer CRUD operations
- Upsert functionality
- Points management (set and delta)
- Points info retrieval
- Error handling (404, validation)

