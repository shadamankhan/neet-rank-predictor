// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 👇 Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBIzvz7gPV5rxsIaV-m-NpEkhMN3f1yvv8",
  authDomain: "neet-rank-predictor-2b483.firebaseapp.com",
  projectId: "neet-rank-predictor-2b483",
  storageBucket: "neet-rank-predictor-2b483.firebasestorage.app",
  messagingSenderId: "158762110325",
  appId: "1:158762110325:web:917031698ec8082c5c973c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
