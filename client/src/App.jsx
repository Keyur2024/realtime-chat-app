import { useState, useEffect } from "react";
import socket from "./socket";
import AuthForm from "./components/AuthForm";
import JoinForm from "./components/JoinForm";
import ChatRoom from "./components/ChatRoom";

const getSavedUser = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  return token && username ? { token, username } : null;
};

function App() {
  const [user, setUser] = useState(getSavedUser);
  const [room, setRoom] = useState(() => localStorage.getItem("room"));

  const handleAuth = ({ token, username }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser({ token, username });
  };

  const joinRoom = (name) => {
    localStorage.setItem("room", name);
    setRoom(name);
  };

  const leaveRoom = () => {
    localStorage.removeItem("room");
    setRoom(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("room");
    setRoom(null);
    setUser(null);
  };

  // Stay connected while logged in; disconnect on logout
  useEffect(() => {
    if (!user) return;

    const onConnectError = (err) => {
      if (
        err.message === "Invalid or expired token" ||
        err.message === "Not logged in"
      ) {
        handleLogout();
      }
    };

    socket.on("connect_error", onConnectError);
    socket.connect();

    return () => {
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [user]);

  if (!user) return <AuthForm onAuth={handleAuth} />;

  if (!room) {
    return (
      <JoinForm
        username={user.username}
        onJoin={joinRoom}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatRoom
      room={room}
      username={user.username}
      onLeave={leaveRoom}
      onLogout={handleLogout}
    />
  );
}

export default App;
