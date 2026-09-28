import { useState } from "react";
import { API_URL } from "../config";

function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("Please fill in both fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      onAuth(data); // { token, username }
    } catch (err) {
      setError("Cannot reach the server");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="join-form">
      <h2>{isLogin ? "Welcome back" : "Create an account"}</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      {error && <div className="form-error">{error}</div>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
      </button>
      <button
        className="link-button"
        onClick={() => {
          setMode(isLogin ? "register" : "login");
          setError("");
        }}
      >
        {isLogin
          ? "New here? Create an account"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}

export default AuthForm;
