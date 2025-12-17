# Suppliers Module

Supplier management for tracking vendor relationships and inventory sources.

## Overview

The Suppliers module manages supplier information, including contact details, categories, and status tracking for inventory management.

## Features

- **Supplier Management** - Full CRUD operations for suppliers
- **Status Tracking** - Track supplier status (active, pending)
- **Category Filtering** - Filter suppliers by product category
- **Company Information** - Store company names and notes
- **Status Filtering** - Filter by active/pending status

## Domain Entities

### Supplier

```typescript
interface Supplier {
  id: string;                // UUID
  name: string;              // Supplier name
  phone: string;             // Contact phone number
  category: string;          // Product category they supply
  companyName?: string;      // Company name
  notes?: string;            // Additional notes
  status: SupplierStatus;    // active | pending
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/v1/suppliers`

Get all suppliers with optional filters.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Query Parameters:**
- `status` (string, optional) - Filter by status (active | pending)
- `category` (string, optional) - Filter by category

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Fresh Produce Co.",
    "phone": "1234567890",
    "category": "groceries",
    "companyName": "Fresh Produce Company LLC",
    "notes": "Weekly delivery on Mondays",
    "status": "active"
  }
]
```

### GET `/v1/suppliers/:id`

Get a single supplier by ID.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Response:** Single supplier object

### POST `/v1/suppliers`

Create a new supplier.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Request:**
```json
{
  "name": "Fresh Produce Co.",
  "phone": "1234567890",
  "category": "groceries",
  "companyName": "Fresh Produce Company LLC",
  "notes": "Weekly delivery on Mondays",
  "status": "pending"
}
```

**Response:** Created supplier

### PUT `/v1/suppliers/:id`

Update an existing supplier.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Request:** Same as POST (all fields optional)

**Response:** Updated supplier

### DELETE `/v1/suppliers/:id`

Delete a supplier.

**Headers:** `Authorization: Bearer <token>` (admin/inventory)

**Response:** `204 No Content`

## Use Cases

### GetSuppliersUseCase

Retrieves supplier list:
- Applies status filter if provided
- Applies category filter if provided
- Returns all matching suppliers

### GetSupplierUseCase

Retrieves single supplier:
- Validates supplier ID
- Returns 404 if not found

### CreateSupplierUseCase

Creates new supplier:
- Validates required fields (name, phone, category)
- Sets default status to "pending" if not provided
- Generates UUID for supplier ID

### UpdateSupplierUseCase

Updates existing supplier:
- Validates supplier exists
- Updates only provided fields
- Maintains existing values for omitted fields

### DeleteSupplierUseCase

Deletes supplier:
- Validates supplier exists
- Removes supplier from database

## Business Rules

- Supplier name, phone, and category are required
- Default status is "pending" for new suppliers
- Status can be changed to "active" after verification
- Category should match product categories
- Company name and notes are optional
- Phone number should be unique (enforced by application logic)

## Status Management

- **pending**: New supplier, not yet verified
- **active**: Verified supplier, actively supplying products

## Integration

Suppliers are used for:
- Inventory tracking
- Purchase order management
- Vendor relationship management
- Product sourcing information

## Testing

Run tests:
```bash
bun test src/modules/suppliers
```

Test coverage includes:
- Supplier CRUD operations
- Status filtering
- Category filtering
- Error handling (404, validation)

