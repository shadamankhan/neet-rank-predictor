// src/components/LoginButton.jsx
import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Simple Google login button. After sign-in you can call `user.getIdToken(true)`
 * to force-refresh claims (useful after server-side setCustomUserClaims).
 */
export default function LoginButton({ onSignedIn }) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (onSignedIn) onSignedIn(user);
      // force refresh token so claims are available quickly if server recently set them
      try { await user.getIdToken(true); } catch (_) {}
    } catch (err) {
      console.error("Sign-in failed:", err);
      alert("Sign-in failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      if (onSignedIn) onSignedIn(null);
    } catch (err) {
      console.error("Sign-out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSignIn} disabled={loading}>
        Sign in with Google
      </button>{" "}
      <button onClick={handleSignOut} disabled={loading}>
        Sign out
      </button>
    </div>
  );
}
