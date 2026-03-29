import express from "express";
import {
  sendMessage,
  listChats,
  getMessages,
  clearChat,
  deleteChat
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/", listChats);
router.post("/", sendMessage);
router.get("/:chatId", getMessages);
router.post("/:chatId/clear", clearChat);
router.delete("/:chatId", deleteChat);

export default router;
