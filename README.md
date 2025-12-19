# Makanak (مكانك) - Grocery E-Commerce API

A modern, high-performance grocery delivery platform API built with **Bun** and **Elysia**, following clean architecture principles.

## 🚀 Features

- **Product Catalog Management** - Full CRUD operations for products with category filtering and pagination
- **Category Management** - Organize products with icons, colors, and visibility controls
- **Order Processing** - Complete order lifecycle from creation to delivery with status tracking
- **Customer Management** - Customer profiles with loyalty points system
- **Staff Management** - Role-based access control (Admin, Driver, CS, Inventory)
- **Supplier Management** - Track and manage supplier relationships
- **Store Settings** - Configurable settings including points system, delivery fees, announcements, and promotional content
- **Authentication & Authorization** - JWT-based auth with refresh tokens and role-based guards

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Framework**: [Elysia](https://elysiajs.com) - Fast and friendly web framework
- **ORM**: [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with Argon2id password hashing (Bun native)
- **Testing**: Bun's built-in test runner

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.3.1 or higher
- PostgreSQL database
- Node.js 18+ (if not using Bun)

## 🔧 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env  # If you have an example file
```

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/makanak
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

**Environment Variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 3001)
- `HOST` - Server hostname (default: 0.0.0.0)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (default: localhost ports 3000, 5173, 5174)

4. Run database migrations:

```bash
bunx drizzle-kit push
```

Or generate migration files:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

## 🏃 Development

Start the development server with hot reload:

```bash
bun run dev
```

The API will be available at `http://localhost:3001`

### API Endpoints

All endpoints are prefixed with `/v1`:

- **Auth**: `/v1/auth/login`, `/v1/auth/logout`, `/v1/auth/refresh`
- **Products**: `/v1/products` (GET, POST), `/v1/products/:id` (GET, PUT, DELETE)
- **Categories**: `/v1/categories` (GET, POST), `/v1/categories/:id` (GET, PUT, DELETE)
- **Orders**: `/v1/orders` (GET, POST), `/v1/orders/:id` (GET, PATCH)
- **Customers**: `/v1/customers/:phone` (GET, PUT, PATCH), `/v1/customers/:phone/points` (GET)
- **Staff**: `/v1/staff` (GET, POST), `/v1/staff/:id` (GET, PUT, DELETE), `/v1/staff/:id/status` (PATCH)
- **Suppliers**: `/v1/suppliers` (GET, POST), `/v1/suppliers/:id` (GET, PUT, DELETE)
- **Settings**: `/v1/settings` (GET, PUT)

See `openapi.json` for complete API documentation.

## 🧪 Testing

Run all tests:

```bash
bun test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Run tests for a specific module:

```bash
bun test src/modules/products
```

## 📁 Project Structure

The project follows a **clean architecture** pattern with modular, feature-based organization:

```
src/
├── modules/                    # Feature modules
│   ├── auth/                   # Authentication & authorization
│   ├── products/               # Product catalog
│   ├── categories/              # Category management
│   ├── orders/                 # Order processing
│   ├── customers/              # Customer management
│   ├── staff/                  # Staff management
│   ├── suppliers/              # Supplier management
│   └── settings/               # Store settings
│       ├── domain/             # Business entities & interfaces
│       ├── application/        # Use cases (business logic)
│       ├── infrastructure/     # Repository implementations & DI
│       └── presentation/       # Controllers & DTOs
├── shared/                     # Shared utilities
│   └── presentation/          # Error handlers, guards
├── drizzle/                    # Database schema & migrations
│   └── schema/                 # Drizzle table definitions
├── app.ts                      # Application assembly
└── index.ts                    # Entry point
```

### Architecture Layers

- **Domain Layer**: Pure business logic, entities, and repository interfaces
- **Application Layer**: Use cases containing business rules
- **Infrastructure Layer**: Database implementations and dependency injection
- **Presentation Layer**: HTTP controllers, DTOs, and route handlers

## 🔐 Authentication

The API uses JWT-based authentication with refresh tokens:

1. **Login**: `POST /v1/auth/login` with `username` and `password`
2. **Access Token**: Valid for 15 minutes
3. **Refresh Token**: Valid for 7 days
4. **Protected Routes**: Include `Authorization: Bearer <token>` header

### Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Driver**: Order management, status updates
- **CS** (Customer Service): Order and customer management
- **Inventory**: Product and supplier management

Use the `authGuard` middleware to protect routes:

```typescript
.use(authGuard(["admin", "inventory"]))
```

## 🗄️ Database

The project uses **Drizzle ORM** with PostgreSQL. Schema definitions are in `src/drizzle/schema/`.

### Running Migrations

Generate migration files:

```bash
bunx drizzle-kit generate
```

Apply migrations:

```bash
bunx drizzle-kit migrate
```

Push schema changes directly (development):

```bash
bunx drizzle-kit push
```

## 📝 Environment Variables

| Variable       | Description                  | Default                   |
| -------------- | ---------------------------- | ------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | Required                  |
| `JWT_SECRET`   | Secret key for JWT signing   | `change-me-in-production` |
| `PORT`         | Server port                  | `3001`                    |
| `HOST`         | Server hostname              | `0.0.0.0`                 |

## 🚀 Production

Build for production:

```bash
bun build --target=bun src/index.ts --outdir=./dist
```

Run production build:

```bash
bun dist/index.js
```

## 📄 API Documentation

Complete OpenAPI specification is available in `openapi.json`. You can use tools like:

- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

## 🤝 Contributing

1. Follow the clean architecture pattern
2. Write unit tests for all use cases
3. Use TypeScript strict mode
4. Follow the existing code style
5. Update documentation as needed

## 📜 License

[Add your license here]

## 📧 Support

For support, email support@makanak.com
