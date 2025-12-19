export interface Product {
  id: string;
  name: string;
  price: number; // decimal as string from DB
  unit: string;
  category: string; // categoryId
  description: string;
  stock: number;
  originalPrice?: number | null; // decimal as string from DB
}
