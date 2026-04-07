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
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

function isRealValue(value, minLength = 1) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v.length < minLength) return false;
  const lower = v.toLowerCase();
  if (lower.includes('your_') || lower.includes('replace') || lower.includes('placeholder')) return false;
  return true;
}

function isLikelyFirebaseApiKey(value) {
  return typeof value === 'string' && /^AIza[\w-]{20,}$/.test(value.trim());
}

const hasFirebaseConfig =
  isLikelyFirebaseApiKey(firebaseConfig.apiKey) &&
  isRealValue(firebaseConfig.authDomain, 3) &&
  isRealValue(firebaseConfig.projectId, 3) &&
  isRealValue(firebaseConfig.appId, 6);

// Initialize Firebase only when config is present.
// This keeps local/offline mode working without .env credentials.
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

export const analytics = (() => {
  if (!app) return null;
  try {
    return getAnalytics(app);
  } catch {
    return null;
  }
})();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Check if Firebase is configured (not using placeholder values)
/**
 * Check if Firebase configuration is populated with real values.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  return hasFirebaseConfig;
}
