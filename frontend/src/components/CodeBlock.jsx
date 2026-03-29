import { useState } from "react";

export default function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);

  const language = className?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code className="rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.95em] text-sky-100">
        {code}
      </code>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#050816]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
        <span>{language || "code"}</span>
        <button
          onClick={copy}
          className="rounded-full bg-sky-300 px-3 py-1.5 text-[11px] font-semibold text-slate-950"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
