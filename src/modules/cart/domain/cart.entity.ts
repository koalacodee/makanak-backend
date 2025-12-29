export interface CartItemEntity {
  id: string // cart item id
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    unit: string
    categoryId: string
    category?: {
      id: string
      name: string
    }
    image: string
    description: string
    stock: number
    originalPrice?: number | null
  }
}

export interface Cart {
  id: string
  customerPhone: string
  items: CartItemEntity[]
  createdAt: Date
  updatedAt: Date
}

export interface CartItemInput {
  productId: string
  quantity: number
}

export interface CartItemUpdate {
  quantity: number
}
