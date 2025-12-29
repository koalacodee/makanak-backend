export type StaffRole = "admin" | "driver" | "cs" | "inventory";

export interface StaffMember {
	id: string;
	userId: string; // Reference to users table
	name: string;
	username: string; // From users table
	role: StaffRole;
	phone?: string | null;
	activeOrders?: number | null;
	specialization?: string | null;
	isOnline?: boolean | null;
	createdAt: Date;
	updatedAt: Date;
}
