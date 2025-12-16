import { serve } from "bun";
import { app } from "./app";

const port = parseInt(process.env.PORT || "3001", 10);
const hostname = process.env.HOST || "0.0.0.0";

serve({
  fetch: app.fetch,
  port,
  hostname,
});

console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
