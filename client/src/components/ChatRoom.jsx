import { useEffect, useState } from "react";
import socket from "../socket";
import { API_URL, GENERAL_ROOM, ROOM_DELETE_SECONDS } from "../config";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function ChatRoom({ room, username, onLeave, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const isGeneral = room === GENERAL_ROOM;

  useEffect(() => {
    // Join now if connected, and again after any reconnect (e.g. server restart)
    const join = () => socket.emit("joinRoom", { room });
    if (socket.connected) join();
    socket.on("connect", join);

    fetch(`${API_URL}/api/messages/${room}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (res.status === 401) {
          onLogout();
          return [];
        }
        return res.json();
      })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]));

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("roomUsers", (usernames) => {
      setOnlineUsers(usernames);
    });

    socket.on("userTyping", (typingUsername) => {
      setTypingUsers((prev) =>
        prev.includes(typingUsername) ? prev : [...prev, typingUsername],
      );
    });

    socket.on("userStoppedTyping", (typingUsername) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingUsername));
    });

    return () => {
      socket.off("connect", join);
      socket.off("receiveMessage");
      socket.off("roomUsers");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [room]);

  const sendMessage = (text) => {
    socket.emit("sendMessage", { room, text });
  };

  const handleLeave = () => {
    socket.emit("leaveRoom");
    onLeave();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>
            Room: {room}
            <span
              className={`room-badge ${isGeneral ? "permanent" : "temporary"}`}
            >
              {isGeneral ? "Permanent" : "Temporary"}
            </span>
          </h2>
          <div className="online-list">
            Online ({onlineUsers.length}): {onlineUsers.join(", ")}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleLeave}>Leave</button>
          <button onClick={onLogout}>Log out</button>
        </div>
      </div>

      {!isGeneral && (
        <div className="temp-banner">
          Temporary room: its chat is deleted {ROOM_DELETE_SECONDS} seconds
          after everyone leaves.
        </div>
      )}

      <MessageList messages={messages} currentUser={username} />
      <div className="typing-indicator">
        {typingUsers.length > 0 && `${typingUsers.join(", ")} typing...`}
      </div>
      <MessageInput onSend={sendMessage} room={room} username={username} />
    </div>
  );
}

export default ChatRoom;
