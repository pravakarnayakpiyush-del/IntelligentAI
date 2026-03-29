import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";

const QUICK_PROMPTS = [
  "What are the latest AI headlines today?",
  "Summarize this PDF and list the main risks.",
  "Analyze this image and extract any text you can find.",
  "Explain this bug in my code and suggest a fix."
];

export default function ChatContainer({
  messages,
  loading,
  error,
  activeChatTitle,
  onSend,
  onUploadFile,
  onUploadImage,
  onClearChat,
  onToggleSidebar,
  onSpeak,
  speakingId,
  onUsePrompt,
  webEnabled,
  onToggleWeb,
  autoSpeak,
  onToggleAutoSpeak,
  onExportChat,
  voiceSupported
}) {
  const bottomRef = useRef(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!hasMessages && !loading) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [hasMessages, messages, loading]);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#0f172a]">
      <div className="border-b border-white/10 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 md:hidden"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              Menu
            </button>

            <div>
              <div className="text-sm font-medium text-white">{activeChatTitle}</div>
              <div className="mt-1 text-xs text-slate-400">
                {hasMessages
                  ? "Continue the conversation"
                  : "Start a conversation with IntelliAgent"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onToggleWeb}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                webEnabled
                  ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                  : "border-white/10 text-slate-300"
              }`}
            >
              {webEnabled ? "Live Web On" : "Live Web Off"}
            </button>
            <button
              onClick={onToggleAutoSpeak}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                autoSpeak
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                  : "border-white/10 text-slate-300"
              }`}
            >
              {autoSpeak ? "Auto Voice On" : "Auto Voice Off"}
            </button>
            <button
              onClick={onExportChat}
              disabled={!hasMessages}
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              Export
            </button>
            <button
              onClick={onClearChat}
              disabled={!hasMessages}
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-6">
        {!hasMessages && (
          <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
            <div className="w-full text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                How can I help you today?
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Ask anything, upload a PDF or image, or use voice input for a faster chat workflow.
              </p>

              <div className="mt-10 grid gap-3 md:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onUsePrompt(prompt)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm leading-6 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {webEnabled ? "Live web enabled" : "Chat only mode"}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {voiceSupported ? "Voice available" : "Voice unavailable"}
                </span>
              </div>
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg._id || msg.id}
                message={msg}
                onSpeak={onSpeak}
                isSpeaking={speakingId === (msg._id || msg.id)}
              />
            ))}

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                IntelliAgent is thinking...
              </div>
            )}
          </div>
        )}

        {!hasMessages && loading && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            IntelliAgent is thinking...
          </div>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={onSend}
        onUploadFile={onUploadFile}
        onUploadImage={onUploadImage}
        loading={loading}
        webEnabled={webEnabled}
        autoSpeak={autoSpeak}
        voiceSupported={voiceSupported}
      />
    </div>
  );
}
