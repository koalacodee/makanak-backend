export interface Product {
  id: string;
  name: string;
  price: string; // decimal as string from DB
  unit: string;
  category: string; // categoryId
  image: string;
  description: string;
  stock: number;
  originalPrice?: string | null; // decimal as string from DB
}
