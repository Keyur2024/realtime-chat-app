import express from "express";
import { getMessagesByRoom } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:room", protect, getMessagesByRoom);

export default router;
