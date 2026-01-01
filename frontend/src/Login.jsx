import React, { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "./useAuth";

export default function Login(){
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div>
      <h3>Login</h3>
      <div>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={() => loginWithEmail(email, pass)}>Login</button>
        <button onClick={() => loginWithGoogle()} style={{ marginLeft: 8 }}>Login with Google</button>
      </div>
      <p style={{ fontSize: 12, color: "#666" }}>If you don't have an account create one from Firebase Console or register flow.</p>
    </div>
  );
}
