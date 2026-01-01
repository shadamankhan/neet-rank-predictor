// useAuth.js
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);
  return { user };
}

export async function loginWithEmail(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}
export async function registerWithEmail(email, pass) {
  return createUserWithEmailAndPassword(auth, email, pass);
}
export async function logout() {
  return signOut(auth);
}
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

