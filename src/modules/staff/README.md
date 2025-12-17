# Staff Module

Staff member management with role-based access and driver status tracking.

## Overview

The Staff module manages staff members including admins, drivers, customer service, and inventory staff. It integrates with the Auth module for authentication.

## Features

- **Staff Management** - Full CRUD operations for staff members
- **Role Management** - Four roles: admin, driver, cs, inventory
- **Driver Features** - Track active orders, specialization, online status
- **User Integration** - Links to Auth module's user accounts
- **Status Tracking** - Monitor driver online/offline status

## Domain Entities

### StaffMember

```typescript
interface StaffMember {
  id: string;                // UUID
  userId: string;            // Foreign key to users table
  name: string;              // Full name
  username: string;          // Login username (from users table)
  role: StaffRole;          // admin | driver | cs | inventory
  phone?: string;           // Contact phone (important for drivers)
  activeOrders?: number;    // Active orders count (for drivers)
  specialization?: string;  // Category specialization (for drivers)
  isOnline?: boolean;       // Online status (for drivers)
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/v1/staff`

Get all staff members with optional role filter.

**Headers:** `Authorization: Bearer <token>` (admin)

**Query Parameters:**
- `role` (string, optional) - Filter by role (admin | driver | cs | inventory)

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "name": "John Driver",
    "username": "jdriver",
    "role": "driver",
    "phone": "1234567890",
    "activeOrders": 3,
    "specialization": "groceries",
    "isOnline": true
  }
]
```

### GET `/v1/staff/:id`

Get a single staff member by ID.

**Headers:** `Authorization: Bearer <token>` (admin)

**Response:** Single staff member object

### POST `/v1/staff`

Create a new staff member.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:**
```json
{
  "name": "John Driver",
  "username": "jdriver",
  "password": "securepassword",
  "role": "driver",
  "phone": "1234567890",
  "specialization": "groceries"
}
```

**Response:** Created staff member (without password)

### PUT `/v1/staff/:id`

Update an existing staff member.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:**
```json
{
  "name": "John Driver Updated",
  "username": "jdriver",
  "password": "newpassword",  // Optional
  "role": "driver",
  "phone": "1234567890",
  "specialization": "groceries"
}
```

**Response:** Updated staff member

### DELETE `/v1/staff/:id`

Delete a staff member.

**Headers:** `Authorization: Bearer <token>` (admin)

**Response:** `204 No Content`

**Note:** This also deletes the associated user account.

### PATCH `/v1/staff/:id/status`

Update driver online status.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:**
```json
{
  "isOnline": true
}
```

**Response:** Updated staff member

## Use Cases

### GetStaffUseCase

Retrieves staff list:
- Applies role filter if provided
- Joins with users table for username and role
- Returns all staff members

### GetStaffMemberUseCase

Retrieves single staff member:
- Validates staff ID
- Returns 404 if not found
- Includes user account information

### CreateStaffMemberUseCase

Creates new staff member:
- Validates username uniqueness
- Creates user account in Auth module
- Hashes password with Argon2id
- Creates staff member record
- Links to user account

### UpdateStaffMemberUseCase

Updates staff member:
- Validates staff exists
- Updates user account if username/password/role changed
- Updates staff-specific fields
- Re-hashes password if provided

### DeleteStaffMemberUseCase

Deletes staff member:
- Validates staff exists
- Deletes staff member record
- Deletes associated user account

### UpdateStaffStatusUseCase

Updates driver online status:
- Validates staff exists
- Validates staff is a driver
- Updates isOnline status

## Business Rules

- Staff members must have associated user accounts
- Username must be unique across all users
- Passwords are hashed with Argon2id
- Driver-specific fields (phone, specialization, isOnline) only apply to drivers
- Active orders count is managed by order assignment
- Deleting staff also deletes their user account

## Role Descriptions

- **admin**: Full system access, can manage all resources
- **driver**: Order delivery, can update order status, has online status
- **cs** (Customer Service): Order and customer management
- **inventory**: Product and supplier management

## Integration with Auth Module

- Staff members are authenticated through the Auth module
- User accounts are created automatically when creating staff
- Role-based access control uses roles from user accounts
- Password changes update the user account

## Testing

Run tests:
```bash
bun test src/modules/staff
```

Test coverage includes:
- Staff CRUD operations
- Role filtering
- User account creation/update
- Password hashing
- Driver status updates
- Error handling (404, validation, uniqueness)

