import { useState } from "react";
import { GENERAL_ROOM, ROOM_DELETE_SECONDS } from "../config";

function JoinForm({ username, onJoin, onLogout }) {
  const [room, setRoom] = useState("");

  const cleanRoom = room.trim().toLowerCase();
  const isTemporary = cleanRoom !== "" && cleanRoom !== GENERAL_ROOM;

  const handleJoin = () => {
    if (cleanRoom === "") return;
    onJoin(cleanRoom);
  };

  return (
    <div className="join-form">
      <h2>Hi, {username}</h2>

      <button className="general-button" onClick={() => onJoin(GENERAL_ROOM)}>
        Join #general
      </button>
      <p className="join-hint">
        Permanent room. Its chat history is always kept.
      </p>

      <div className="or-divider">or</div>

      <input
        placeholder="Create or join another room"
        value={room}
        maxLength={30}
        onChange={(e) => setRoom(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />

      {isTemporary && (
        <div className="temp-warning">
          Heads up: "{cleanRoom}" is a temporary room. When everyone leaves, its
          chat is deleted after {ROOM_DELETE_SECONDS} seconds.
        </div>
      )}

      <button onClick={handleJoin} disabled={cleanRoom === ""}>
        Join
      </button>
      <button className="link-button" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}

export default JoinForm;
