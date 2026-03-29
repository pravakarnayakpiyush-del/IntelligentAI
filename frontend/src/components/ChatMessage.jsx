import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock.jsx";

const MessageBadge = ({ children, tone = "neutral" }) => {
  const styles = {
    neutral: "border-white/10 bg-white/5 text-slate-300",
    sky: "border-sky-400/30 bg-sky-400/10 text-sky-100",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-100"
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] ${styles[tone]}`}>
      {children}
    </span>
  );
};

export default function ChatMessage({ message, onSpeak, isSpeaking }) {
  const isUser = message.role === "user";
  const timestamp = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-full max-w-3xl overflow-hidden rounded-[24px] border ${
          isUser
            ? "border-white/10 bg-slate-200 text-slate-950"
            : "border-white/10 bg-white/[0.04] text-slate-100"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-2">
            <span>{isUser ? "You" : "IntelliAgent"}</span>
            {message.type === "file" && <MessageBadge tone="amber">File</MessageBadge>}
            {message.type === "image" && <MessageBadge tone="emerald">Image</MessageBadge>}
            {message.meta?.usedWeb && <MessageBadge tone="sky">Live Web</MessageBadge>}
          </div>
          <span>{timestamp}</span>
        </div>

        <div className="px-4 py-4 md:px-5">
          {message.type === "image" && message.meta?.previewUrl && (
            <img
              src={message.meta.previewUrl}
              alt={message.meta?.name || "Uploaded"}
              className="mb-4 max-h-80 w-full rounded-2xl border border-white/10 object-cover"
            />
          )}

          {message.type === "file" && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              Attached document: {message.meta?.name || "Document"}
            </div>
          )}

          <div className={`markdown-body max-w-none break-words text-[15px] leading-7 ${isUser ? "text-slate-900" : "text-slate-100"}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: CodeBlock
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {!isUser && Array.isArray(message.meta?.sources) && message.meta.sources.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                Sources
              </div>
              <div className="space-y-3">
                {message.meta.sources.map((source) => (
                  <a
                    key={`${source.id}-${source.url || source.title}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-sky-400/40 hover:bg-sky-400/[0.05]"
                  >
                    <div className="text-sm font-medium text-white">
                      [{source.id}] {source.title}
                    </div>
                    {source.snippet && (
                      <div className="mt-1 text-sm text-slate-400">{source.snippet}</div>
                    )}
                    {source.url && (
                      <div className="mt-2 truncate text-xs text-sky-200">{source.url}</div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isUser && onSpeak && (
            <button
              onClick={() => onSpeak(message)}
              className="mt-4 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-emerald-400/40 hover:text-white"
            >
              {isSpeaking ? "Stop Voice" : "Play Voice"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
