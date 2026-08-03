import { useEffect, useRef, useState } from "react";

/* Chat sidebar -- the React port of web_app.py's <aside class="sidebar">.

   Same behaviour as the server-rendered page: chats persist in localStorage,
   are searchable, and each row has a ⋮ menu with pin / rename / delete. Pinned
   chats group above the rest. Icons are inline SVG rather than emoji entities,
   which fall back to unreadable glyphs in the sidebar's font stack. */

const ICON = {
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.3-4.3",
  pin: "M9 4h6l-1 6 3 3H7l3-3-1-6ZM12 13v7",
  pencil: "M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3ZM15 6l3 3",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
};

function Svg({ d, size = 15 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}
    >
      <path d={d} />
    </svg>
  );
}

function Dots() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function ChatRow({ chat, active, onSelect, onPin, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Close the popup on any outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const commit = (keep) => {
    setEditing(false);
    const v = draft.trim();
    if (keep && v) onRename(v.slice(0, 80));
    else setDraft(chat.title || "");
  };

  return (
    <div
      className={`chat-item${active ? " active" : ""}`}
      onClick={() => !editing && onSelect()}
    >
      {chat.pinned ? (
        <span className="ci-pin" title="Pinned">
          <Svg d={ICON.pin} size={13} />
        </span>
      ) : null}

      {editing ? (
        <input
          ref={inputRef}
          className="ci-edit"
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(true)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commit(true);
            if (e.key === "Escape") commit(false);
          }}
          autoFocus
        />
      ) : (
        <span className="ci-title">{chat.title || "New Query"}</span>
      )}

      <span
        className={`ci-menu${menuOpen ? " open" : ""}`}
        title="More"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
      >
        <Dots />
      </span>

      {menuOpen ? (
        <div className="ci-pop" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setMenuOpen(false); onPin(); }}>
            <Svg d={ICON.pin} />
            {chat.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          <button type="button" onClick={() => { setMenuOpen(false); setEditing(true); }}>
            <Svg d={ICON.pencil} />
            Rename
          </button>
          <div className="sep" />
          <button
            type="button"
            className="danger"
            onClick={() => {
              setMenuOpen(false);
              if (window.confirm(`Delete "${chat.title || "this chat"}"?`)) onDelete();
            }}
          >
            <Svg d={ICON.trash} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar({
  chats, activeId, onSelect, onNew, onPin, onRename, onDelete,
}) {
  const [term, setTerm] = useState("");
  const q = term.trim().toLowerCase();
  const shown = q
    ? chats.filter((c) => (c.title || "").toLowerCase().includes(q))
    : chats;
  const pinned = shown.filter((c) => c.pinned);
  const rest = shown.filter((c) => !c.pinned);

  const row = (c) => (
    <ChatRow
      key={c.id}
      chat={c}
      active={c.id === activeId}
      onSelect={() => onSelect(c.id)}
      onPin={() => onPin(c.id)}
      onRename={(title) => onRename(c.id, title)}
      onDelete={() => onDelete(c.id)}
    />
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <p className="brand">Analyst</p>
        <button className="new-chat" type="button" onClick={onNew}>
          <Svg d={ICON.plus} size={16} />
          New Query
        </button>
      </div>

      <div className="search-box">
        <span className="si"><Svg d={ICON.search} size={14} /></span>
        <input
          type="text"
          placeholder="Search chats..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <div className="chats-label"><span>Chats</span></div>

      <div className="chat-list">
        {!shown.length ? (
          <div className="chat-empty">
            {q ? "No matching chats." : "No chats yet."}
          </div>
        ) : (
          <>
            {pinned.length ? <div className="cl-sub">Pinned</div> : null}
            {pinned.map(row)}
            {pinned.length && rest.length ? <div className="cl-sub">Recent</div> : null}
            {rest.map(row)}
          </>
        )}
      </div>

      <div className="sidebar-foot">Answers from the oncosuite_gold database.</div>
    </aside>
  );
}
