import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBkJWDa-9xtQ9ToJPXQaEgSP0hPgAgv9xM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "workforce-tracker-5b5d3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "workforce-tracker-5b5d3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "workforce-tracker-5b5d3.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "290516265382",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:290516265382:web:23f0b9ff918023626bc767",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-CT5J3D0D6R",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
