// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

// Firebase config from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Auth
export const appAuth = getAuth(firebaseApp);

// Export for normal frontend use
export const auth = appAuth;

// Explicitly set persistence
import { setPersistence, browserLocalPersistence } from "firebase/auth";
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence Error:", error);
});

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google (Popup)", error);
    throw error;
  }
};

export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
    // No return value here, the page will reload.
    // Result is handled by getRedirectResult or onAuthStateChanged
  } catch (error) {
    console.error("Error signing in with Google (Redirect)", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// 🔥 Expose auth + app globally for debugging in browser console
// (You can remove these later if you want)
window.firebaseApp = firebaseApp;
window.appAuth = appAuth;

export default firebaseApp;
