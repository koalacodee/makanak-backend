import {
  QuantityType,
  UnitOfMeasurement,
} from "@/modules/products/presentation/products.dto";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productStock: number;
  productQuantityType: QuantityType;
  productUnitOfMeasurement?: UnitOfMeasurement;
}

export interface OrderCancellation {
  id: string;
  orderId: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  cancelledBy: "driver" | "inventory";
  image?: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online";

export interface Order {
  id: string;
  customerName: string;
  referenceCode?: string;
  phone: string;
  address: string;
  orderItems: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  status: OrderStatus;
  driverId?: string;
  createdAt: string;
  deliveredAt?: string;
  paymentMethod?: PaymentMethod;
  pointsUsed?: number;
  pointsDiscount?: string; // decimal as string from DB
  pointsEarned?: number;
  couponDiscount?: number;
  couponId?: string;
  cancellation?: OrderCancellation;
  verificationHash?: string;
  // Legacy fields
  date?: string;
  timestamp?: number | null;
  deliveryTimestamp?: number | null;
}
