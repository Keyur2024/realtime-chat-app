import { useState, useRef } from "react";
import socket from "../socket";

function MessageInput({ onSend, room, username }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);

    socket.emit("typing", { room, username });

    // Clear any existing timeout, then set a new one
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { room, username });
    }, 1500); // stop "typing" after 1.5s of no keystrokes
  };

  const handleSend = () => {
    if (text.trim() === "") return;
    onSend(text);
    setText("");
    socket.emit("stopTyping", { room, username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="message-input-area">
      <input
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default MessageInput;
