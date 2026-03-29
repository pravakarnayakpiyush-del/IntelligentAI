export default function Sidebar({
  open,
  onClose,
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onDelete
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/55 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-white/10 bg-[#0b1020] transition-transform md:static md:w-[260px] ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-sky-200/70">
              IntelliAgent
            </div>
            <div className="mt-1 text-lg font-semibold text-white">Chats</div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 md:hidden"
            aria-label="Close sidebar"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full rounded-2xl bg-white text-slate-950 px-4 py-3 text-sm font-semibold transition hover:bg-slate-200"
          >
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {chats.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm leading-6 text-slate-500">
              No chat history yet.
            </div>
          )}

          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`group rounded-2xl border px-3 py-3 transition ${
                  activeChatId === chat._id
                    ? "border-white/20 bg-white/[0.08]"
                    : "border-transparent hover:bg-white/[0.05]"
                }`}
              >
                <button onClick={() => onSelect(chat._id)} className="w-full text-left">
                  <div className="truncate text-sm font-medium text-white">
                    {chat.title || "Untitled chat"}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                    {chat.lastMessage || "No messages yet"}
                  </div>
                </button>

                <button
                  onClick={() => onDelete(chat._id)}
                  className="mt-3 text-xs text-slate-500 transition hover:text-rose-300"
                  aria-label="Delete chat"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
