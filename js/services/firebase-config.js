// ============================================
// ProCode EduPulse — Firebase Configuration
// ============================================
// 
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use an existing one)
// 3. Add a Web App in Project Settings
// 4. Enable Email/Password + Google in Authentication → Sign-in method
// 5. Create a Firestore Database (start in test mode)
// 6. Copy your config values below
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// ─── YOUR FIREBASE CONFIG ───
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAn4X_wlxzkn2yAm3wUpYo8JSm8iSow19g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "procode-e53b8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "procode-e53b8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "procode-e53b8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "260188643661",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:260188643661:web:ff94d866e2ab9d3fba9704",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-26SC9Z33YG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Check if Firebase is configured (not using placeholder values)
/**
 * Check if Firebase configuration is populated with real values.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.length > 10;
}
