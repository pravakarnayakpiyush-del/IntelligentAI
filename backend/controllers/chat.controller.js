import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { buildContext } from "../utils/contextBuilder.js";
import { generateTextResponse } from "../services/gemini.service.js";
import {
  buildWebContext,
  formatWebSources,
  searchWeb,
  shouldUseWebSearch
} from "../services/webSearch.service.js";

const SYSTEM_PROMPT =
  "You are IntelliAgent, a helpful multimodal assistant. Give accurate, direct answers, use any provided document, image, or live web context, and clearly say when information may be uncertain or outdated. When responding with code, provide complete runnable snippets and state key assumptions.";

const buildChatTitle = (message = "") =>
  message
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .slice(0, 60) || "New Chat";

const getAssistantReply = async ({ message, context, useWeb }) => {
  let webContext = "";
  let webResults = [];

  if (shouldUseWebSearch(message, useWeb)) {
    try {
      webResults = await searchWeb(message);
      webContext = buildWebContext(message, webResults);
    } catch (error) {
      webContext = "";
      webResults = [];
    }
  }

  const reply = await generateTextResponse([
    { role: "system", content: SYSTEM_PROMPT },
    ...(webContext ? [{ role: "system", content: webContext }] : []),
    ...context.map((entry) => ({ role: entry.role, content: entry.content })),
    { role: "user", content: message }
  ]);

  return {
    reply,
    webSources: formatWebSources(webResults)
  };
};

export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find()
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    res.json({ chats });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId, role: { $ne: "system" } })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

export const clearChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: "",
      lastMessageAt: null
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, message, useWeb } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    let chat = null;

    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      chat = await Chat.create({
        title: buildChatTitle(message)
      });
    }

    await Message.create({
      chatId: chat._id,
      role: "user",
      content: message,
      type: "text",
      meta: {
        useWeb: Boolean(useWeb)
      }
    });

    const context = await buildContext(chat._id);
    const usedWeb = shouldUseWebSearch(message, useWeb);
    const { reply, webSources } = await getAssistantReply({
      message,
      context,
      useWeb
    });

    await Message.create({
      chatId: chat._id,
      role: "assistant",
      content: reply,
      type: "text",
      meta: {
        usedWeb,
        sources: webSources
      }
    });

    await Chat.findByIdAndUpdate(chat._id, {
      title: chat.title || buildChatTitle(message),
      lastMessage: reply.slice(0, 200),
      lastMessageAt: new Date()
    });

    res.json({ chatId: chat._id, reply, usedWeb, sources: webSources });
  } catch (err) {
    next(err);
  }
};
