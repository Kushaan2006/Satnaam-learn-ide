import "dotenv/config";
import http from "http";

import { Server } from "socket.io";

import { connectRoomRedis } from "./config/roomRedisClient.js";

import app from "./app.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});

try {
  await connectRoomRedis();

  registerSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.log("Server Startup Failed: ", error);
}
