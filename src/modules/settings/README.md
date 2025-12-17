# Settings Module

Store-wide settings and configuration management with singleton pattern.

## Overview

The Settings module manages global store configuration including points system, delivery fees, announcements, social media links, payment information, promotional content, and website content.

## Features

- **Singleton Pattern** - Single settings record for the entire store
- **Points System** - Configure loyalty points earning and redemption rates
- **Delivery Configuration** - Set delivery fees
- **Announcements** - Store-wide announcements with activation toggle
- **Social Media** - Facebook, Instagram, phone, email links
- **Payment Info** - Vodafone Cash and InstaPay numbers
- **Promotional Content** - Promo banners with images and codes
- **Website Content** - Hero sections, features, journey steps, terms, quality info

## Domain Entities

### StoreSettings

```typescript
interface StoreSettings {
  id: string;                    // UUID
  pointsSystem: {
    active: boolean;
    value: number;               // Earning rate: Spend X EGP = 1 Point
    redemptionValue: number;      // Redemption rate: 1 Point = X EGP
  };
  deliveryFee: number;           // Default delivery fee
  announcement: {
    active: boolean;
    message: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    phone?: string;
    email?: string;
  };
  paymentInfo: {
    vodafoneCash?: string;
    instaPay?: string;
  };
  promo: {
    isActive: boolean;
    image?: string;
    topBadge?: string;
    title?: string;
    description?: string;
    code?: string;
    buttonText?: string;
  };
  content: {
    hero?: {
      badge?: string;
      titleLine1?: string;
      titleHighlight?: string;
      description?: string;
    };
    features?: Array<{
      title?: string;
      description?: string;
    }>;
    journey?: {
      title?: string;
      steps?: Array<{
        title?: string;
        description?: string;
      }>;
    };
    sections?: {
      categoriesTitle?: string;
      categoriesSubtitle?: string;
    };
    info?: {
      terms?: Array<{
        title?: string;
        description?: string;
      }>;
      quality?: {
        title?: string;
        description?: string;
        hotline?: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/v1/settings`

Get store settings (public endpoint).

**Response:**
```json
{
  "id": "uuid",
  "pointsSystem": {
    "active": true,
    "value": 10,
    "redemptionValue": 0.1
  },
  "deliveryFee": 5.00,
  "announcement": {
    "active": true,
    "message": "Welcome to Makanak!"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/makanak",
    "instagram": "@makanak",
    "phone": "1234567890",
    "email": "info@makanak.com"
  },
  "paymentInfo": {
    "vodafoneCash": "01012345678",
    "instaPay": "01012345678"
  },
  "promo": {
    "isActive": true,
    "image": "https://...",
    "title": "Special Offer",
    "code": "SAVE20"
  },
  "content": {...}
}
```

**Note:** Returns default values if no settings exist.

### PUT `/v1/settings`

Update store settings.

**Headers:** `Authorization: Bearer <token>` (admin)

**Request:** Partial StoreSettings object (all fields optional)

**Response:** Updated settings

**Note:** Creates settings if they don't exist (singleton pattern).

## Use Cases

### GetSettingsUseCase

Retrieves store settings:
- Returns single settings record
- Returns null if no settings exist (handled by controller)

### UpdateSettingsUseCase

Updates store settings:
- Merges with existing settings (partial update)
- Creates settings if they don't exist
- Updates only provided fields
- Maintains existing nested object values

## Business Rules

- Only one settings record exists (singleton)
- Settings are created automatically on first update
- Partial updates merge with existing values
- Nested objects are merged, not replaced
- Points system values must be positive numbers
- Delivery fee cannot be negative

## Points System Configuration

- **value**: Amount in EGP that equals 1 point (e.g., 10 = spend 10 EGP to earn 1 point)
- **redemptionValue**: Amount in EGP that 1 point equals (e.g., 0.1 = 1 point = 0.1 EGP discount)
- **active**: Enable/disable the points system

## Integration

Settings are used by:
- **Orders Module**: Delivery fee, points redemption
- **Customers Module**: Points earning calculation
- **Frontend**: Display announcements, promo banners, content sections

## Testing

Run tests:
```bash
bun test src/modules/settings
```

Test coverage includes:
- Getting settings (existing and non-existing)
- Updating individual fields
- Updating nested objects
- Creating settings on first update
- Merging partial updates

