// Auth Types
export interface LoginInput {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: {
		id: string;
		username: string;
		role: "admin" | "driver" | "cs" | "inventory";
	};
}

export interface RefreshTokenResponse {
	accessToken: string;
}

export interface MeResponse {
	id: string;
	username: string;
	role: "admin" | "driver" | "cs" | "inventory";
	createdAt?: string;
	updatedAt?: string;
	lastLoginAt?: string;
}

// Product Types
export interface Product {
	id: string;
	name: string;
	price: number;
	unit: string;
	category: string;
	image: string;
	description: string;
	stock: number;
	originalPrice?: number;
}

export interface ProductInput {
	name: string;
	price: number;
	unit: string;
	category: string;
	image: string;
	description: string;
	stock: number;
	originalPrice?: number;
}

export interface ProductQuery {
	category?: string;
	inStock?: boolean;
	page?: number;
	limit?: number;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ProductsResponse {
	data: Product[];
	pagination: Pagination;
}

// Category Types
export interface Category {
	id: string;
	name: string;
	icon: string;
	color: string;
	image: string;
	isHidden: boolean;
	isLocked: boolean;
}

export interface CategoryInput {
	id?: string;
	name: string;
	icon: string;
	color: string;
	image: string;
	isHidden?: boolean;
	isLocked?: boolean;
}

// Order Types
export interface OrderItem {
	id: string;
	name: string;
	price: number;
	unit: string;
	category: string;
	image: string;
	description: string;
	stock: number;
	originalPrice?: number;
	quantity: number;
}

export interface Order {
	id: string;
	customerName: string;
	phone: string;
	address: string;
	items: OrderItem[];
	subtotal?: number;
	deliveryFee?: number;
	total: number;
	status:
		| "pending"
		| "processing"
		| "ready"
		| "out_for_delivery"
		| "delivered"
		| "cancelled";
	driverId?: string;
	createdAt: string;
	deliveredAt?: string;
	receiptImage?: string;
	paymentMethod?: "cod" | "online" | "wallet";
	pointsUsed?: number;
	pointsDiscount?: number;
	date?: string;
	timestamp?: number;
	deliveryTimestamp?: number;
	uploadKey?: string;
}

export interface OrderInput {
	customerName: string;
	phone: string;
	address: string;
	items: Array<{ id: string; quantity: number }>;
	subtotal?: number;
	deliveryFee?: number;
	paymentMethod: "cod" | "online" | "wallet";
	pointsUsed?: number;
	pointsDiscount?: number;
	attach?: boolean;
}

export interface OrderUpdate {
	status?:
		| "pending"
		| "processing"
		| "ready"
		| "out_for_delivery"
		| "delivered"
		| "cancelled";
	driverId?: string;
	receiptImage?: string;
}

export interface OrderQuery {
	status?: string;
	phone?: string;
	page?: number;
	limit?: number;
}

export interface OrdersResponse {
	data: Order[];
	pagination: Pagination;
}

// Customer Types
export interface Customer {
	phone: string;
	name?: string;
	address?: string;
	points: number;
	totalSpent?: number;
	totalOrders?: number;
}

export interface CustomerInput {
	name?: string;
	address?: string;
	points?: number;
	totalSpent?: number;
	totalOrders?: number;
}

export interface CustomerUpdate {
	name?: string;
	address?: string;
	points?: number;
	pointsDelta?: number;
	totalSpent?: number;
	totalOrders?: number;
}

export interface CustomerPointsInfo {
	points: number;
	pointsValue: number;
	redemptionValue: number;
	isActive: boolean;
}

// Cart Types
export interface CartItem {
	id: string;
	productId: string;
	quantity: number;
	product: {
		id: string;
		name: string;
		price: number;
		unit: string;
		categoryId: string;
		category?: {
			id: string;
			name: string;
		};
		image: string;
		description: string;
		stock: number;
		originalPrice?: number;
	};
}

export interface Cart {
	id: string;
	customerPhone: string;
	items: CartItem[];
	createdAt: string;
	updatedAt: string;
}

export interface AddItemToCartInput {
	productId: string;
	quantity: number;
}

export interface UpdateCartItemInput {
	quantity: number;
}

export interface BuyNowInput {
	customerName: string;
	address: string;
	subtotal?: number;
	deliveryFee?: number;
	paymentMethod: "cod" | "online" | "wallet";
	pointsUsed?: number;
	pointsDiscount?: number;
}

// Settings Types
export interface StoreSettings {
	id: string;
	pointsSystem?: {
		active: boolean;
		value: number;
		redemptionValue: number;
	};
	deliveryFee?: number;
	announcement?: {
		active: boolean;
		message: string;
	};
	socialMedia?: {
		facebook?: string;
		instagram?: string;
		phone?: string;
		email?: string;
	};
	paymentInfo?: {
		vodafoneCash?: string;
		instaPay?: string;
	};
	promo?: {
		isActive: boolean;
		image?: string;
		topBadge?: string;
		title?: string;
		description?: string;
		code?: string;
		buttonText?: string;
	};
	content?: {
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
}

export interface StoreSettingsInput {
	pointsSystem?: {
		active: boolean;
		value: number;
		redemptionValue: number;
	};
	deliveryFee?: number;
	announcement?: {
		active: boolean;
		message: string;
	};
	socialMedia?: {
		facebook?: string;
		instagram?: string;
		phone?: string;
		email?: string;
	};
	paymentInfo?: {
		vodafoneCash?: string;
		instaPay?: string;
	};
	promo?: {
		isActive: boolean;
		image?: string;
		topBadge?: string;
		title?: string;
		description?: string;
		code?: string;
		buttonText?: string;
	};
	content?: StoreSettings["content"];
}

// Staff Types
export interface StaffMember {
	id: string;
	name: string;
	username: string;
	role: "admin" | "driver" | "cs" | "inventory";
	phone?: string;
	activeOrders?: number;
	specialization?: string;
	isOnline?: boolean;
}

export interface StaffMemberInput {
	name: string;
	username: string;
	password: string;
	role: "admin" | "driver" | "cs" | "inventory";
	phone?: string;
	specialization?: string;
}

export interface StaffMemberUpdate {
	name?: string;
	phone?: string;
	specialization?: string;
}

export interface StaffStatusUpdate {
	isOnline?: boolean;
	activeOrders?: number;
}

// Supplier Types
export interface Supplier {
	id: string;
	name: string;
	phone: string;
	category: string;
	companyName?: string;
	notes?: string;
	status: "active" | "inactive" | "pending";
}

export interface SupplierInput {
	name: string;
	phone: string;
	category: string;
	companyName?: string;
	notes?: string;
	status?: "active" | "inactive" | "pending";
}

export interface SupplierQuery {
	status?: "active" | "inactive" | "pending";
	category?: string;
}
