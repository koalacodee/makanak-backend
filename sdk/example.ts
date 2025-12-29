/**
 * Example usage of the Makanak SDK
 *
 * This file demonstrates how to use the SDK in a frontend application.
 */
// @ts-nocheck

import { createSDK } from "./src";

// Initialize SDK
const { sdk, api } = createSDK({
	baseURL: "https://api.makanac.com",
	accessTokenCookieName: "accessToken",
	refreshTokenCookieName: "refreshToken",
});

// Example: Login
async function _loginExample() {
	try {
		const response = await api.auth.login({
			username: "admin",
			password: "password123",
		});

		// Token is automatically stored in cookie by SDK
		// But you can also set it manually if needed
		sdk.setAccessToken(response.token);

		console.log("Logged in:", response.user);
	} catch (error) {
		console.error("Login failed:", error);
	}
}

// Example: Get products (public endpoint)
async function _getProductsExample() {
	try {
		const products = await api.products.list({ page: 1, limit: 20 });
		console.log("Products:", products.data);
	} catch (error) {
		console.error("Failed to get products:", error);
	}
}

// Example: Create order (protected endpoint - requires auth)
async function _createOrderExample() {
	try {
		const order = await api.orders.create({
			customerName: "John Doe",
			phone: "1234567890",
			address: "123 Main St",
			items: [{ id: "product-id", quantity: 2 }],
			paymentMethod: "cod",
		});
		console.log("Order created:", order);
	} catch (error: unknown) {
		if (
			(error as { response?: { status?: number } })?.response?.status === 401
		) {
			console.error("Unauthorized - please login");
		} else {
			console.error("Failed to create order:", error);
		}
	}
}

// Example: Cart operations
async function _cartExample() {
	const phone = "1234567890";

	try {
		// Get cart
		const cart = await api.cart.get(phone);
		console.log("Cart:", cart);

		// Add item to cart
		await api.cart.addItem(phone, {
			productId: "product-id",
			quantity: 2,
		});

		// Update item quantity
		await api.cart.updateItem("cart-item-id", {
			quantity: 3,
		});

		// Buy now (convert cart to order)
		const order = await api.cart.buyNow(phone, {
			customerName: "John Doe",
			address: "123 Main St",
			paymentMethod: "cod",
		});
		console.log("Order from cart:", order);
	} catch (error) {
		console.error("Cart operation failed:", error);
	}
}

// Example: Logout
async function _logoutExample() {
	try {
		await api.auth.logout();
		sdk.clearTokens();
		console.log("Logged out successfully");
	} catch (error) {
		console.error("Logout failed:", error);
	}
}
