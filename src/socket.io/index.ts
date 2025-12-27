import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";
import { DriversIO } from "./drivers";
import { InventoryIO } from "./inventory";

const io = new Server();
export const engine = new Engine({ path: "/socket.io/" });
io.bind(engine);

io.on("connection", (socket) => {
  socket.emit("test", "Hello from server");
});

// Create namespaces first (they are created lazily, but we want them registered)
io.of("/test").on("connection", (socket) => {
  socket.emit("test", "Hello from server");
});

// Now initialize the namespace handlers
export const driversIO = new DriversIO(io);
export const inventoryIO = new InventoryIO(io);
