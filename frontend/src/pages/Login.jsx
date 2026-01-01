// src/pages/Login.jsx
import React, { useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [error, setError] = useState(null);

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  async function handleGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 560 }}>
      <h2>Sign in</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleGoogle} style={{ padding: "8px 12px", marginRight: 8 }}>
          Sign in with Google
        </button>
      </div>

      <hr />

      <form onSubmit={handleEmailAuth} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "8px 12px" }}>
            {mode === "login" ? "Sign in" : "Register"}
          </button>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ padding: "8px 12px" }}>
            {mode === "login" ? "Create account" : "Back to login"}
          </button>
        </div>

        {error && <div style={{ marginTop: 12, color: "red" }}>{error}</div>}
      </form>
    </div>
  );
}
