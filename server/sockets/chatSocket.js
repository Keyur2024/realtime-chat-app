import jwt from "jsonwebtoken";
import Message from "../models/Message.js";

const GENERAL_ROOM = "general";
const DELETE_DELAY_MS = 30 * 1000;
const MAX_MESSAGE_LENGTH = 1000;

const deleteTimers = new Map();

const getUsernames = async (io, room) => {
  const sockets = await io.in(room).fetchSockets();
  return sockets.map((s) => s.data.username);
};

const cancelRoomDeletion = (room) => {
  const timer = deleteTimers.get(room);
  if (timer) {
    clearTimeout(timer);
    deleteTimers.delete(room);
  }
};

const scheduleRoomDeletion = (io, room) => {
  if (room === GENERAL_ROOM || deleteTimers.has(room)) return;

  const timer = setTimeout(async () => {
    deleteTimers.delete(room);
    try {
      const sockets = await io.in(room).fetchSockets();
      if (sockets.length === 0) {
        await Message.deleteMany({ room });
        console.log(`Room "${room}" was empty, so it was deleted`);
      }
    } catch (err) {
      console.error("Room cleanup failed:", err.message);
    }
  }, DELETE_DELAY_MS);

  deleteTimers.set(room, timer);
};

// Runs once at server start: clears leftover temporary rooms nobody comes back to
export const cleanupStaleRooms = async (io) => {
  try {
    const rooms = await Message.distinct("room");
    const temporaryRooms = rooms.filter((room) => room !== GENERAL_ROOM);

    temporaryRooms.forEach((room) => scheduleRoomDeletion(io, room));

    if (temporaryRooms.length > 0) {
      console.log(
        `Startup cleanup: ${temporaryRooms.length} temporary room(s) will be deleted in ${DELETE_DELAY_MS / 1000}s if nobody is in them`,
      );
    }
  } catch (err) {
    console.error("Startup cleanup failed:", err.message);
  }
};

// Take a socket out of the room it is currently in
const leaveCurrentRoom = async (io, socket) => {
  const room = socket.data.room;
  if (!room) return;

  socket.data.room = null;
  await socket.leave(room);

  const usernames = await getUsernames(io, room);
  if (usernames.length === 0) {
    scheduleRoomDeletion(io, room);
  } else {
    io.to(room).emit("roomUsers", usernames);
  }
};

export const initSocket = (io) => {
  // The guard at the door: no valid token, no connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not logged in"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.username = payload.username;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`${socket.data.username} connected:`, socket.id);

    socket.on("joinRoom", async ({ room }) => {
      try {
        if (typeof room !== "string" || room.trim() === "") return;

        // switching rooms: leave the old one first
        if (socket.data.room && socket.data.room !== room) {
          await leaveCurrentRoom(io, socket);
        }

        await socket.join(room);
        socket.data.room = room;

        cancelRoomDeletion(room);

        io.to(room).emit("roomUsers", await getUsernames(io, room));
        console.log(`${socket.data.username} joined room ${room}`);
      } catch (err) {
        console.error("joinRoom failed:", err.message);
      }
    });

    socket.on("leaveRoom", async () => {
      try {
        await leaveCurrentRoom(io, socket);
      } catch (err) {
        console.error("leaveRoom failed:", err.message);
      }
    });

    socket.on("sendMessage", async ({ room, text }) => {
      try {
        if (room !== socket.data.room) return;
        if (typeof text !== "string") return;
        const clean = text.trim();
        if (clean === "" || clean.length > MAX_MESSAGE_LENGTH) return;

        const message = await Message.create({
          room,
          sender: socket.data.username,
          text: clean,
        });
        io.to(room).emit("receiveMessage", message);
      } catch (err) {
        console.error("sendMessage failed:", err.message);
      }
    });

    socket.on("typing", ({ room }) => {
      if (room !== socket.data.room) return;
      socket.to(room).emit("userTyping", socket.data.username);
    });

    socket.on("stopTyping", ({ room }) => {
      if (room !== socket.data.room) return;
      socket.to(room).emit("userStoppedTyping", socket.data.username);
    });

    socket.on("disconnect", async () => {
      console.log(`${socket.data.username} disconnected:`, socket.id);
      try {
        await leaveCurrentRoom(io, socket);
      } catch (err) {
        console.error("disconnect cleanup failed:", err.message);
      }
    });
  });
};
