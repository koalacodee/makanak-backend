import * as jose from "jose";
import type { DefaultEventsMap, Namespace, Server } from "socket.io";
import type { ReadyOrderWithShouldTake } from "@/modules/drivers/presentation/drivers.dto";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export class DriversIO {
	// driverId -> socketId
	private driversSockets = new Map<string, string>();
	private io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>;
	constructor(io: Server) {
		this.io = io.of("/drivers");

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

				if (payload.role !== "driver") {
					console.warn("Unauthorized, Rejecting");
					return next(new Error("Unauthorized"));
				}

				socket.data.user = payload;
				this.driversSockets.set(payload.sub, socket.id);
				next();
			} catch (_error) {
				console.warn("JWT verifying Failed");
				next(new Error("Invalid Access Token"));
			}
		});

		this.io.on("connection", (socket) => {
			const driverId = socket.data.user?.sub;
			console.warn("Driver connected", driverId);
			if (!driverId) {
				console.warn("No driverId found, Rejecting");
				socket.disconnect();
				return;
			}
			this.driversSockets.set(driverId, socket.id);
		});

		this.io.on("disconnect", (socket) => {
			const driverId = socket.data.user?.sub;
			if (!driverId) {
				console.warn("No driverId found, Rejecting");
				socket.disconnect();
				return;
			}
			this.driversSockets.delete(driverId);
		});
	}

	notifyDriverWithReadyOrder(
		driverId: string,
		readyOrder: ReadyOrderWithShouldTake,
	) {
		const socketId = this.driversSockets.get(driverId);
		if (!socketId) {
			console.warn("Socket not found, Rejecting");
			return;
		}
		const socket = this.io.sockets.get(socketId);
		if (!socket) {
			console.warn("Socket not found, Rejecting");
			return;
		}
		socket.emit("ready_order", readyOrder);
	}
}
