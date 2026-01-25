import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGoogle } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState("login");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    async function handleGoogle() {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
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
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '2rem auto' }} className="card">
            <h2 style={{ textAlign: 'center', color: 'var(--amu-primary)' }}>
                {mode === 'login' ? 'Student Login' : 'Create Account'}
            </h2>

            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <button onClick={handleGoogle} className="btn-primary" style={{ width: '100%', background: '#db4437' }}>
                    Continue with Google
                </button>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#ccc' }}>OR</div>

            <form onSubmit={handleEmailAuth}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    {mode === "login" ? "Sign In" : "Register"}
                </button>

                {error && <div style={{ marginTop: '1rem', color: 'var(--amu-secondary)', fontSize: '0.9rem' }}>{error}</div>}

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                        style={{ background: 'none', border: 'none', color: 'var(--amu-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {mode === "login" ? "New student? Create account" : "Already have an account? Login"}
                    </button>
                </div>
            </form>
        </div>
    );
}
