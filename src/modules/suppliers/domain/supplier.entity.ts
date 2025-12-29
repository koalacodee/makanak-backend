export type SupplierStatus = 'active' | 'pending'

export interface Supplier {
  id: string
  name: string
  phone: string
  category: string
  companyName?: string | null
  notes?: string | null
  status: SupplierStatus
  createdAt: Date
  updatedAt: Date
}

export interface SupplierInput {
  name: string
  phone: string
  category: string
  companyName?: string
  notes?: string
  status?: SupplierStatus
}
