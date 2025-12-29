export interface Product {
  id: string
  name: string
  price: number // decimal as string from DB
  category: string // categoryId
  description: string
  stock: number
  originalPrice?: number | null // decimal as string from DB
  quantityType: 'count' | 'weight'
  unitOfMeasurement?: 'ton' | 'kg' | 'g' | 'mg' | 'l' | 'ml' | null
}
