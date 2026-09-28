import { useEffect, useRef } from "react";

const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MessageList({ messages, currentUser }) {
  const listRef = useRef(null);

  // Jump to the newest message whenever the list changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((msg) => {
        const isOwn = msg.sender === currentUser;
        return (
          <div
            key={msg._id || msg.text + msg.createdAt}
            className={`message-bubble ${isOwn ? "own" : "other"}`}
          >
            {!isOwn && <div className="message-sender">{msg.sender}</div>}
            {msg.text}
            <div className="message-time">{formatTime(msg.createdAt)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
