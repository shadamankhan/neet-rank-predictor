// src/Auth.jsx
import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Auth({ onUserChange }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        setUser(res.user);
        onUserChange(res.user);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setUser(res.user);
        onUserChange(res.user);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    onUserChange(null);
  }

  return (
    <div style={{ margin: "20px" }}>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          /><br /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          /><br /><br />
          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
          <p style={{ cursor: "pointer", color: "blue" }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create new account" : "Already have an account? Login"}
          </p>
        </form>
      )}
    </div>
  );
}
