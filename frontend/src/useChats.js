import { useCallback, useEffect, useRef, useState } from "react";

/* Chat list persisted in localStorage.

   Same storage key and record shape as web_app.py's PAGE script, so chats
   created in the server-rendered page still load here:
     {id, title, pinned?, messages: [{role, q?, blocks?, error?}]}
   Only the message payload differs -- the old page stored rendered `html`,
   this one stores typed blocks. Both are tolerated on read. */

const LS_KEY = "oncosuite_chats";

const uid = () =>
  "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export default function useChats() {
  const [chats, setChats] = useState(load);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(chats));
    } catch {
      // quota exceeded (large answers) -- keep the session usable in memory
    }
  }, [chats]);

  const active = chats.find((c) => c.id === activeId) || null;

  // addMessage is called twice in the same send() (user message, then the bot
  // reply after an await) without React re-rendering in between, so it cannot
  // rely on the `activeId` state closure to know a chat was just created by
  // its own first call -- that closure is stale until the next render. A ref,
  // updated synchronously right when the chat is created, is the one source
  // both calls agree on.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const newChat = useCallback(() => {
    activeIdRef.current = null;
    setActiveId(null);
  }, []);

  /** Append a message, creating the chat on the first one. */
  const addMessage = useCallback((message) => {
    setChats((prev) => {
      let id = activeIdRef.current;
      let next = prev;
      if (!id || !prev.some((c) => c.id === id)) {
        id = uid();
        const title =
          message.role === "user" ? (message.q || "").slice(0, 48) : "New Query";
        next = [{ id, title, messages: [] }, ...prev];
        activeIdRef.current = id;
        setActiveId(id);
      }
      return next.map((c) =>
        c.id === id ? { ...c, messages: [...c.messages, message] } : c,
      );
    });
  }, []);

  const renameChat = useCallback((id, title) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const togglePin = useCallback((id) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
    },
    [],
  );

  return {
    chats, activeId, active, activeIdRef,
    setActiveId, newChat, addMessage, renameChat, togglePin, deleteChat,
  };
}
