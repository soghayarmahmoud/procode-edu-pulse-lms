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

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

// ─── YOUR FIREBASE CONFIG ───
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAn4X_wlxzkn2yAm3wUpYo8JSm8iSow19g",
  authDomain: "procode-e53b8.firebaseapp.com",
  projectId: "procode-e53b8",
  storageBucket: "procode-e53b8.firebasestorage.app",
  messagingSenderId: "260188643661",
  appId: "1:260188643661:web:ff94d866e2ab9d3fba9704",
  measurementId: "G-26SC9Z33YG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
/** @type {import('https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js').Analytics} */
export const analytics = getAnalytics(app);
/** @type {import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js').Auth} */
export const auth = getAuth(app);
/** @type {import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js').Firestore} */
export const db = getFirestore(app);
/** @type {import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js').FirebaseStorage} */
export const storage = getStorage(app);

// Check if Firebase is configured (not using placeholder values)
/**
 * Check if Firebase configuration is populated with real values.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.length > 10;
}
