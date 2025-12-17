export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  description: string;
  stock: number;
  originalPrice?: number | null;
  quantity: number; // quantity in cart/order
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online" | "wallet";

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  subtotal?: string | null; // decimal as string from DB
  deliveryFee?: string | null; // decimal as string from DB
  total: string; // decimal as string from DB
  status: OrderStatus;
  driverId?: string | null;
  createdAt: Date;
  deliveredAt?: Date | null;
  receiptImage?: string | null;
  paymentMethod?: PaymentMethod | null;
  pointsUsed?: number | null;
  pointsDiscount?: string | null; // decimal as string from DB
  // Legacy fields
  date?: Date | null;
  timestamp?: number | null;
  deliveryTimestamp?: number | null;
}
