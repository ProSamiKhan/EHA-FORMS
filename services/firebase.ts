
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAi6SdbugoWYESIbSQTlxllSYBYsSRaPz8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eha-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "eha-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eha-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "797699967867",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:797699967867:web:6eeed9251a3f8c98284bde"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
