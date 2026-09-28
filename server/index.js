import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import authRoutes from "./routes/authRoutes.js";

import { connectDB } from "./config/db.js";
import messageRoutes from "./routes/messageRoutes.js";
import { initSocket, cleanupStaleRooms } from "./sockets/chatSocket.js";

dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
connectDB();

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "CLIENT_URL",
    methods: ["GET", "POST"],
  },
});

// Redis setup for scaling across multiple server instances
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("Redis Pub Client Error:", err));
subClient.on("error", (err) => console.error("Redis Sub Client Error:", err));

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));
console.log("Redis adapter connected");

initSocket(io);
cleanupStaleRooms(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
