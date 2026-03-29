import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
};

const getTextModelName = () =>
  process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const getVisionModelName = () =>
  process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";

const serializeMessages = (messages) =>
  messages
    .filter((message) => message?.content)
    .map((message) => {
      const role = message.role?.toUpperCase() || "USER";
      return `[${role}]\n${message.content.trim()}`;
    })
    .join("\n\n");

export const generateTextResponse = async (messages) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getTextModelName() });
  const prompt = serializeMessages(messages);

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateVisionResponse = async ({ prompt, image }) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getVisionModelName() });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    }
  ]);

  return result.response.text();
};
