import { useEffect, useRef, useState } from "react";
import FileUpload from "./FileUpload.jsx";

export default function ChatInput({
  onSend,
  onUploadFile,
  onUploadImage,
  loading,
  webEnabled,
  autoSpeak,
  voiceSupported
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceInputSupported, setVoiceInputSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceInputSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setText(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    recognition.start();
    setListening(true);
  };

  const handleFile = async (file) => {
    const question = text.trim();
    if (question) setText("");
    await onUploadFile?.(file, question || undefined);
  };

  const handleImage = async (file) => {
    const question = text.trim();
    if (question) setText("");
    await onUploadImage?.(file, question || undefined);
  };

  return (
    <div className="border-t border-white/10 bg-[#0f172a] px-4 py-3 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[22px] border border-white/10 bg-[#111827] p-3">
          <textarea
            className="min-h-[76px] w-full resize-none rounded-2xl bg-transparent px-3 py-2 text-base leading-7 text-slate-100 outline-none placeholder:text-slate-500"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message IntelliAgent..."
          />

          <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <FileUpload
                label="PDF / CSV"
                accept=".pdf,.csv"
                onFile={handleFile}
                disabled={loading}
              />
              <FileUpload
                label="Image"
                accept="image/*"
                onFile={handleImage}
                disabled={loading}
              />
              <button
                onClick={toggleListening}
                disabled={!voiceInputSupported || loading}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  listening
                    ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                    : "border-white/10 text-slate-300"
                } disabled:opacity-40`}
              >
                {voiceInputSupported ? (listening ? "Listening..." : "Voice") : "Mic N/A"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {webEnabled ? "Live web" : "Chat only"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {autoSpeak ? "Auto voice" : "Manual voice"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {voiceSupported ? "Voice ready" : "Voice off"}
              </span>
              <button
                onClick={handleSend}
                disabled={loading || !text.trim()}
                className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-40"
              >
                {loading ? "Working..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
