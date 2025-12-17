# Categories Module

Category management for organizing products with visual customization options.

## Overview

The Categories module manages product categories with support for icons, colors, images, and visibility controls.

## Features

- **CRUD Operations** - Create, read, update, delete categories
- **Visual Customization** - Icons, colors, and images
- **Visibility Control** - Hide categories from customers
- **Lock Status** - Mark categories as "coming soon"
- **Category Filtering** - Include/exclude hidden categories

## Domain Entities

### Category

```typescript
interface Category {
  id: string;              // UUID
  name: string;            // Category name (Arabic)
  icon: string;            // Icon identifier
  color: string;           // Tailwind CSS color classes
  image: string;           // Category image URL
  isHidden: boolean;       // Hide from customers
  isLocked: boolean;       // Coming soon status
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/v1/categories`

Get all categories.

**Query Parameters:**
- `includeHidden` (boolean, default: false) - Include hidden categories

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "خضروات",
    "icon": "vegetables",
    "color": "bg-green-500",
    "image": "https://...",
    "isHidden": false,
    "isLocked": false
  }
]
```

### GET `/v1/categories/:id`

Get a single category by ID.

**Response:** Single category object

### POST `/v1/categories`

Create a new category.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:**
```json
{
  "name": "خضروات",
  "icon": "vegetables",
  "color": "bg-green-500",
  "image": "https://...",
  "isHidden": false,
  "isLocked": false
}
```

**Response:** Created category

### PUT `/v1/categories/:id`

Update an existing category.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:** Same as POST (all fields optional)

**Response:** Updated category

### DELETE `/v1/categories/:id`

Delete a category.

**Headers:** `Authorization: Bearer <token>` (admin)

**Response:** `204 No Content`

## Use Cases

### GetCategoriesUseCase

Retrieves category list:
- Filters hidden categories by default
- Includes hidden categories if requested
- Returns all categories sorted by creation date

### GetCategoryUseCase

Retrieves single category:
- Validates category ID
- Returns 404 if not found

### CreateCategoryUseCase

Creates new category:
- Validates required fields
- Sets default values for optional fields
- Generates UUID for category ID

### UpdateCategoryUseCase

Updates existing category:
- Validates category exists
- Updates only provided fields
- Maintains existing values for omitted fields

### DeleteCategoryUseCase

Deletes category:
- Validates category exists
- Removes category from database
- Note: Products referencing this category may need handling

## Business Rules

- Category names are in Arabic
- Colors use Tailwind CSS classes
- Hidden categories are excluded from public API by default
- Locked categories indicate "coming soon" status
- Category deletion may affect associated products

## Testing

Run tests:
```bash
bun test src/modules/categories
```

Test coverage includes:
- Category CRUD operations
- Hidden category filtering
- Error handling (404, validation)

