import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://intelliagent-ai.onrender.com/api",
  timeout: 30000
});

export const getChats = () => API.get("/chat");
export const getMessages = (chatId) => API.get(`/chat/${chatId}`);
export const sendMessage = (data) => API.post("/chat", data);
export const clearChat = (chatId) => API.post(`/chat/${chatId}/clear`);
export const deleteChat = (chatId) => API.delete(`/chat/${chatId}`);

export const uploadFile = ({ file, chatId, question }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (chatId) formData.append("chatId", chatId);
  if (question) formData.append("question", question);
  return API.post("/file", formData);
};

export const uploadImage = ({ file, chatId, question }) => {
  const formData = new FormData();
  formData.append("image", file);
  if (chatId) formData.append("chatId", chatId);
  if (question) formData.append("question", question);
  return API.post("/file/image", formData);
};
