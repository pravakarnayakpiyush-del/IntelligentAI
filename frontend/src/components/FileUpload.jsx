export default function FileUpload({ label, accept, onFile, disabled = false }) {
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFile?.(file);
    event.target.value = "";
  };

  return (
    <label
      className={`rounded-full border px-3 py-2 text-sm transition ${
        disabled
          ? "cursor-not-allowed border-white/10 text-slate-600"
          : "cursor-pointer border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/40 hover:text-white"
      }`}
    >
      {label}
      <input type="file" hidden accept={accept} onChange={handleUpload} disabled={disabled} />
    </label>
  );
}
