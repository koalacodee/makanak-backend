# Auth Module

Authentication and authorization module for staff members with JWT-based access control.

## Overview

The Auth module provides secure authentication using JWT tokens with refresh token support. It implements role-based access control (RBAC) for protecting API endpoints.

## Features

- **JWT Authentication** - Access tokens (15min) and refresh tokens (7 days)
- **Password Security** - Argon2id hashing using Bun's native crypto
- **Role-Based Access Control** - Four roles: `admin`, `driver`, `cs`, `inventory`
- **Refresh Token Rotation** - Secure token refresh mechanism
- **Auth Guard** - Reusable middleware for protecting routes

## Domain Entities

### User

```typescript
interface User {
  id: string; // UUID
  username: string; // Unique login identifier
  passwordHash: string; // Argon2id hash
  role: UserRole; // admin | driver | cs | inventory
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### RefreshToken

```typescript
interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string; // Hashed refresh token
  expiresAt: Date;
  createdAt: Date;
}
```

## API Endpoints

### POST `/v1/auth/login`

Authenticate a staff member and receive access/refresh tokens.

**Request:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "admin"
  }
}
```

**Cookies:** Sets `refreshToken` HTTP-only cookie

### POST `/v1/auth/logout`

Invalidate refresh tokens for the current user.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

### POST `/v1/auth/refresh`

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response:**

```json
{
  "token": "new_access_token"
}
```

## Use Cases

### LoginUseCase

Handles user authentication:

- Validates credentials
- Verifies password with Argon2id
- Generates access and refresh tokens
- Stores refresh token hash in database
- Updates last login timestamp

### LogoutUseCase

Handles user logout:

- Revokes all refresh tokens for the user
- Clears refresh token cookie

### RefreshTokenUseCase

Handles token refresh:

- Validates refresh token
- Verifies token hash in database
- Generates new access token
- Optionally rotates refresh token

## Auth Guard

Protect routes with role-based access:

```typescript
import { authGuard } from "@/modules/auth";

// Protect route for admin only
.use(authGuard(["admin"]))

// Protect route for multiple roles
.use(authGuard(["admin", "inventory"]))

// Protect route for all authenticated users
.use(authGuard())
```

## Security

- **Password Hashing**: Argon2id with Bun's native implementation
- **Token Storage**: Refresh tokens stored as hashes in database
- **HTTP-Only Cookies**: Refresh tokens sent via secure cookies
- **Token Expiration**: Short-lived access tokens (15min)
- **Token Rotation**: Refresh tokens can be rotated on use

## Testing

Run tests:

```bash
bun test src/modules/auth
```

Test coverage includes:

- Successful login
- Invalid credentials
- Token refresh
- Token revocation
- Role-based access control
