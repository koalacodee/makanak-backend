import { app } from "./app";
import { Database } from "./drizzle";
import { engine } from "./socket.io";

const port = parseInt(process.env.PORT || "3001", 10);
const hostname = process.env.HOST || "0.0.0.0";
const wsPort = parseInt(process.env.WS_PORT || "3002", 10);
const wsHostname = process.env.WS_HOST || "0.0.0.0";
await Database.migrate();

app.listen({ port, hostname });
console.log(app.routes.map((route) => route.path));
Bun.serve({
	...engine.handler(),
	port: wsPort,
	hostname: wsHostname,
});
console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
console.log(`🦊 WebSocket is running at ws://${wsHostname}:${wsPort}`);
