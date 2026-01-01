// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth as firebaseAuth } from "../firebase"; // expects your project to export initialized `auth` from /src/firebase
import "./Login.css"; // optional

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const auth = firebaseAuth || getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  const signIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Force refresh token after sign-in if needed elsewhere:
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
    } catch (err) {
      console.error("Sign-in failed:", err);
      alert("Sign-in failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (e) {
      console.error("Sign-out failed", e);
      alert("Sign-out failed");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "0 auto" }}>
      <h2>Sign in</h2>

      {user ? (
        <div>
          <p>Signed in as <strong>{user.email}</strong></p>
          <p>UID: <code style={{ fontSize: 12 }}>{user.uid}</code></p>
          <button onClick={handleSignOut} style={{ padding: "8px 12px" }}>Sign out</button>
        </div>
      ) : (
        <div>
          <p>Sign in with your Google account to access admin features (if you have admin claim).</p>
          <button onClick={signIn} disabled={loading} style={{ padding: "10px 14px" }}>
            {loading ? "Opening…" : "Sign in with Google"}
          </button>
        </div>
      )}

      <section style={{ marginTop: 18, color: "#555" }}>
        <strong>Notes</strong>
        <ul>
          <li>Popup-based sign-in is used — allow popups in your browser for localhost.</li>
          <li>If you used redirect sign-in earlier, this popup method will still work.</li>
        </ul>
      </section>
    </div>
  );
}
