import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { parsePDF } from "../services/pdf.service.js";
import { parseCSV } from "../services/csv.service.js";
import { generateTextResponse, generateVisionResponse } from "../services/gemini.service.js";

const SYSTEM_PROMPT =
  "You are IntelliAgent, a helpful multimodal assistant. Answer using the provided document or image context, cite concrete evidence from that context when possible, and say clearly when the source does not contain the answer.";

const trimContent = (value, max = 14000) => value.slice(0, max);
const buildChatTitle = (value = "") =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) || "New Chat";

const buildDocumentContext = ({ fileName, mimeType, extracted }) =>
  [
    `Document context for ${fileName}.`,
    `Type: ${mimeType}`,
    "Use this extracted content for any follow-up questions in the same chat.",
    trimContent(extracted)
  ].join("\n\n");

const buildImageAnalysisPrompt = (question) =>
  [
    "Analyze this image in detail for future question answering.",
    "Describe the scene, notable objects, text/OCR, layout, charts, UI elements, and any uncertainties.",
    "Return a compact but information-dense analysis that can be reused later.",
    `Primary user goal: ${question || "Describe and understand the uploaded image."}`
  ].join("\n");

const ensureChat = async (chatId, title) => {
  if (chatId) {
    const existing = await Chat.findById(chatId);
    if (existing) return existing;
  }

  return Chat.create({ title: buildChatTitle(title) });
};

export const uploadFile = async (req, res, next) => {
  try {
    const { chatId, question } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    let extracted = "";
    if (file.mimetype === "application/pdf") {
      extracted = await parsePDF(file.buffer);
    } else if (file.mimetype.includes("csv")) {
      const rows = await parseCSV(file.buffer);
      extracted = JSON.stringify(rows.slice(0, 80));
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    const trimmed = extracted.slice(0, 12000);
    const chat = await ensureChat(
      chatId,
      question?.trim() || `File analysis: ${file.originalname}`
    );
    const sourceContext = buildDocumentContext({
      fileName: file.originalname,
      mimeType: file.mimetype,
      extracted: trimmed
    });

    await Message.create({
      chatId: chat._id,
      role: "user",
      content: question?.trim() || `Uploaded file: ${file.originalname}`,
      type: "file",
      meta: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    await Message.create({
      chatId: chat._id,
      role: "system",
      content: sourceContext,
      type: "file",
      meta: {
        kind: "document_context",
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    const reply = await generateTextResponse([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: sourceContext },
      {
        role: "user",
        content: question?.trim() || "Summarize and analyze the file."
      }
    ]);

    await Message.create({
      chatId: chat._id,
      role: "assistant",
      content: reply,
      type: "text"
    });

    await Chat.findByIdAndUpdate(chat._id, {
      title: chat.title || buildChatTitle(question?.trim() || file.originalname),
      lastMessage: reply.slice(0, 200),
      lastMessageAt: new Date()
    });

    res.json({ chatId: chat._id, reply });
  } catch (err) {
    next(err);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    const { chatId, question } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Unsupported image type" });
    }

    const chat = await ensureChat(
      chatId,
      question?.trim() || `Image analysis: ${file.originalname}`
    );

    await Message.create({
      chatId: chat._id,
      role: "user",
      content: question?.trim() || `Uploaded image: ${file.originalname}`,
      type: "image",
      meta: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    const imageContext = await generateVisionResponse({
      prompt: buildImageAnalysisPrompt(question?.trim()),
      image: {
        data: file.buffer.toString("base64"),
        mimeType: file.mimetype
      }
    });

    await Message.create({
      chatId: chat._id,
      role: "system",
      content: trimContent(
        [
          `Image context for ${file.originalname}.`,
          `Type: ${file.mimetype}`,
          "Use this analysis for any future questions about this image.",
          imageContext
        ].join("\n\n"),
        10000
      ),
      type: "image",
      meta: {
        kind: "image_context",
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    const reply = await generateTextResponse([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `Image context for ${file.originalname}:\n\n${trimContent(
          imageContext,
          8000
        )}`
      },
      {
        role: "user",
        content:
          question?.trim() || "Describe the image and extract any relevant text."
      }
    ]);

    await Message.create({
      chatId: chat._id,
      role: "assistant",
      content: reply,
      type: "text"
    });

    await Chat.findByIdAndUpdate(chat._id, {
      title: chat.title || buildChatTitle(question?.trim() || file.originalname),
      lastMessage: reply.slice(0, 200),
      lastMessageAt: new Date()
    });

    res.json({ chatId: chat._id, reply });
  } catch (err) {
    next(err);
  }
};
