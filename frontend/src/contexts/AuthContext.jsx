// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onIdTokenChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  getIdToken: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to ID token changes (covers sign-in, sign-out, token refresh)
  useEffect(() => {
  const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
    if (currentUser) {
      try {
        const tokenResult = await currentUser.getIdTokenResult(true);
        const isAdmin = tokenResult.claims.admin === true;

        setUser({
          ...currentUser,
          isAdmin: isAdmin,
        });
      } catch (err) {
        console.error("Failed to decode token claims:", err);
        setUser(currentUser);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  // Helper to get ID token for calling backend
  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.error("Failed to get ID token:", err);
      return null;
    }
  }, []);

  // Logout helper (clears firebase auth)
  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // user will be nullified by onIdTokenChanged subscription
    } catch (err) {
      console.error("Sign out failed:", err);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    getIdToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
