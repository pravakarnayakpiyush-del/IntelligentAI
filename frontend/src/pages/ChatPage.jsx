import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ChatContainer from "../components/ChatContainer.jsx";
import {
  clearChat,
  deleteChat,
  getChats,
  getMessages,
  sendMessage,
  uploadFile,
  uploadImage
} from "../services/api.js";

const createTimestamp = () => new Date().toISOString();

const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [webEnabled, setWebEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId),
    [activeChatId, chats]
  );

  const refreshChats = async (preferredId) => {
    const res = await getChats();
    const list = res.data.chats || [];
    setChats(list);

    if (preferredId) {
      setActiveChatId(preferredId);
      await loadMessages(preferredId);
      return;
    }

    if (!activeChatId && list.length) {
      setActiveChatId(list[0]._id);
      await loadMessages(list[0]._id);
    }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const res = await getMessages(chatId);
    setMessages(res.data.messages || []);
  };

  useEffect(() => {
    refreshChats();
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;

    setVoiceSupported(true);

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices() || [];
      setVoices(availableVoices);

      if (!selectedVoice && availableVoices.length) {
        const preferredVoice =
          availableVoices.find((voice) => /en/i.test(voice.lang)) || availableVoices[0];
        setSelectedVoice(preferredVoice?.name || "");
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const speakText = (text, messageId) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((entry) => entry.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(messageId || "auto");
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectChat = async (chatId) => {
    setSidebarOpen(false);
    setActiveChatId(chatId);
    await loadMessages(chatId);
  };

  const handleNewChat = () => {
    setSidebarOpen(false);
    setActiveChatId(null);
    setMessages([]);
    setError("");
  };

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);

    const optimistic = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      type: "text",
      createdAt: createTimestamp(),
      meta: {
        requestedLiveWeb: webEnabled
      }
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await sendMessage({
        chatId: activeChatId,
        message: trimmed,
        useWeb: webEnabled
      });

      const reply = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.data.reply,
        type: "text",
        createdAt: createTimestamp(),
        meta: {
          usedWeb: Boolean(res.data.usedWeb),
          sources: res.data.sources || []
        }
      };

      setMessages((prev) => [...prev, reply]);
      await refreshChats(res.data.chatId);

      if (autoSpeak) {
        speakText(reply.content, reply.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file, question) => {
    if (!file || loading) return;

    setError("");
    setLoading(true);

    const optimistic = {
      id: `f-${Date.now()}`,
      role: "user",
      content: question?.trim() || `Uploaded file: ${file.name}`,
      type: "file",
      meta: {
        name: file.name,
        size: file.size
      },
      createdAt: createTimestamp()
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await uploadFile({ file, chatId: activeChatId, question });
      const reply = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.data.reply,
        type: "text",
        createdAt: createTimestamp()
      };

      setMessages((prev) => [...prev, reply]);
      await refreshChats(res.data.chatId);

      if (autoSpeak) {
        speakText(reply.content, reply.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze file");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (file, question) => {
    if (!file || loading) return;

    setError("");
    setLoading(true);

    const previewUrl = URL.createObjectURL(file);
    const optimistic = {
      id: `i-${Date.now()}`,
      role: "user",
      content: question?.trim() || `Uploaded image: ${file.name}`,
      type: "image",
      meta: {
        name: file.name,
        previewUrl,
        size: file.size
      },
      createdAt: createTimestamp()
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await uploadImage({ file, chatId: activeChatId, question });
      const reply = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.data.reply,
        type: "text",
        createdAt: createTimestamp()
      };

      setMessages((prev) => [...prev, reply]);
      await refreshChats(res.data.chatId);

      if (autoSpeak) {
        speakText(reply.content, reply.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;

    setError("");
    setLoading(true);

    try {
      await clearChat(activeChatId);
      setMessages([]);
      await refreshChats(activeChatId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to clear chat");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    setError("");
    setLoading(true);

    try {
      await deleteChat(chatId);
      if (activeChatId === chatId) {
        const remainingChats = chats.filter((chat) => chat._id !== chatId);
        const nextChatId = remainingChats[0]?._id || null;
        setActiveChatId(nextChatId);
        await loadMessages(nextChatId);
      }
      await refreshChats();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete chat");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (message) => {
    if (!message?.content || !window.speechSynthesis) return;

    const messageId = message._id || message.id;

    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    speakText(message.content, messageId);
  };

  const handleExportChat = () => {
    if (!messages.length) return;

    const title = activeChat?.title || "chat";
    const content = messages
      .map((message) => {
        const who = message.role === "assistant" ? "IntelliAgent" : "You";
        const timestamp = message.createdAt
          ? new Date(message.createdAt).toLocaleString()
          : "";
        return `## ${who}${timestamp ? ` • ${timestamp}` : ""}\n\n${message.content}\n`;
      })
      .join("\n");

    downloadTextFile(`${title.replace(/\s+/g, "-").toLowerCase()}.md`, content);
  };

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="relative flex min-h-screen w-full overflow-hidden">
        <div className="flex h-[100dvh] w-full overflow-hidden">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            chats={chats}
            activeChatId={activeChatId}
            onSelect={handleSelectChat}
            onNewChat={handleNewChat}
            onDelete={handleDeleteChat}
          />

          <ChatContainer
            messages={messages}
            loading={loading}
            error={error}
            activeChatTitle={activeChat?.title || "New Chat"}
            onSend={handleSend}
            onUploadFile={handleUploadFile}
            onUploadImage={handleUploadImage}
            onClearChat={handleClearChat}
            onToggleSidebar={() => setSidebarOpen(true)}
            onSpeak={handleSpeak}
            speakingId={speakingId}
            onUsePrompt={handleSend}
            webEnabled={webEnabled}
            onToggleWeb={() => setWebEnabled((value) => !value)}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={() => setAutoSpeak((value) => !value)}
            onExportChat={handleExportChat}
            voiceSupported={voiceSupported}
            voices={voices}
            selectedVoice={selectedVoice}
          />
        </div>
      </div>
    </div>
  );
}
