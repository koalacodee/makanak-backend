export interface Customer {
  phone: string;
  name?: string | null;
  address?: string | null;
  points: number;
  totalSpent: string | null; // decimal as string from DB
  totalOrders: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInput {
  phone: string;
  name?: string;
  address?: string;
  points?: number;
  totalSpent?: number;
  totalOrders?: number;
}

export interface CustomerUpdateInput {
  points?: number; // Set points to this value
  pointsDelta?: number; // Add/subtract from current points
  name?: string;
  address?: string;
}

export interface CustomerPointsInfo {
  phone: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
}
