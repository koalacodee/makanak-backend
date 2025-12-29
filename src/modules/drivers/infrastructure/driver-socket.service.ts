import type { ServerWebSocket } from "bun";

type DriverSocket = ServerWebSocket<{ driverId: string }>;

export class DriverSocketService {
	private driverSockets = new Map<string, DriverSocket>();

	/**
	 * Add a driver socket to the map
	 */
	addDriverSocket(driverId: string, socket: DriverSocket): void {
		// Remove existing socket if any (cleanup)
		this.removeDriverSocket(driverId);
		this.driverSockets.set(driverId, socket);
	}

	/**
	 * Remove a driver socket from the map
	 */
	removeDriverSocket(driverId: string): void {
		const socket = this.driverSockets.get(driverId);
		if (socket) {
			try {
				if (socket.readyState === 1) {
					// OPEN state
					socket.close();
				}
			} catch (_error) {
				// Ignore errors when closing
			}
			this.driverSockets.delete(driverId);
		}
	}

	/**
	 * Get a driver socket by driver ID
	 */
	getDriverSocket(driverId: string): DriverSocket | undefined {
		return this.driverSockets.get(driverId);
	}

	/**
	 * Check if a driver is connected
	 */
	isDriverConnected(driverId: string): boolean {
		const socket = this.driverSockets.get(driverId);
		return socket !== undefined && socket.readyState === 1; // OPEN state
	}

	/**
	 * Push a message to a driver's socket
	 * @param driverId - The driver ID
	 * @param message - The message to send (will be JSON stringified)
	 * @returns true if message was sent, false if driver not connected
	 */
	pushToDriver(driverId: string, message: unknown): boolean {
		const socket = this.driverSockets.get(driverId);
		if (!socket || socket.readyState !== 1) {
			// Socket not found or not in OPEN state
			return false;
		}

		try {
			socket.send(JSON.stringify(message));
			return true;
		} catch (_error) {
			// If send fails, remove the socket
			this.removeDriverSocket(driverId);
			return false;
		}
	}

	/**
	 * Get all connected driver IDs
	 */
	getConnectedDriverIds(): string[] {
		return Array.from(this.driverSockets.keys()).filter((driverId) =>
			this.isDriverConnected(driverId),
		);
	}

	/**
	 * Get the count of connected drivers
	 */
	getConnectedCount(): number {
		return this.getConnectedDriverIds().length;
	}
}

// Singleton instance
export const driverSocketService = new DriverSocketService();
