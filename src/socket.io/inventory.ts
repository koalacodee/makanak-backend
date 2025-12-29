import * as jose from "jose";
import type { DefaultEventsMap, Namespace, Server } from "socket.io";
import type { Order } from "@/modules/orders/presentation/orders.dto";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

interface SocketData {
	user?: {
		sub: string;
		role: string;
		exp: number;
		iat: number;
	};
}

export class InventoryIO {
	// inventoryId -> socketId
	private io: Namespace<
		DefaultEventsMap,
		DefaultEventsMap,
		DefaultEventsMap,
		SocketData
	>;
	constructor(io: Server) {
		this.io = io.of("/inventory");

		this.io.use(async (socket, next) => {
			const token = socket.handshake.auth.token;
			if (!token) {
				return next(new Error("Missing Access Token"));
			}
			try {
				const payload = await jose
					.jwtVerify<{
						sub: string;
						role: string;
						exp: number;
						iat: number;
					}>(token, new TextEncoder().encode(JWT_SECRET))
					.then((result) => result.payload);

				if (!payload || typeof payload !== "object" || !("sub" in payload)) {
					console.warn("Invalid Access Token, Rejecting");
					return next(new Error("Invalid Access Token"));
				}

				if (payload.role !== "inventory") {
					return next(new Error("Unauthorized"));
				}

				socket.data.user = payload;
				next();
			} catch (_error) {
				console.warn("JWT verifying Failed");
				next(new Error("Invalid Access Token"));
			}
		});

		this.io.on("connection", (socket) => {
			const inventoryId = socket.data.user?.sub;

			if (!inventoryId) {
				return;
			}
			socket.join("inventory_notifications");
		});

		this.io.on("disconnect", (socket) => {
			const inventoryId = socket.data.user?.sub;
			if (!inventoryId) {
				return;
			}
			socket.leave("inventory_notifications");
		});
	}

	notifyInventoryWithPendingOrder(pendingOrder: Order) {
		this.io.to("inventory_notifications").emit("pending_order", pendingOrder);
	}
}
