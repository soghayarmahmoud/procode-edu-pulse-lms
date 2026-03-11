// ============================================
// ProCode EduPulse — Authentication Service
// ============================================

import { auth, isFirebaseConfigured } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as fbSignOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const googleProvider = new GoogleAuthProvider();

class AuthService {
    constructor() {
        this._user = null;
        this._listeners = [];
        this._initialized = false;
        this._initPromise = null;
    }

    /**
     * Initialize auth state listener. Returns a promise that resolves
     * when the initial auth state is determined.
     */
    init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            if (!isFirebaseConfigured()) {
                this._initialized = true;
                resolve(null);
                return;
            }

            onAuthStateChanged(auth, (user) => {
                this._user = user;
                this._initialized = true;
                this._listeners.forEach(cb => cb(user));
                resolve(user);
            });
        });

        return this._initPromise;
    }

    /**
     * Sign up with email/password and set display name.
     */
    async signUp(email, password, displayName) {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Please add your Firebase config.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName) {
            await updateProfile(cred.user, { displayName });
        }

        return cred.user;
    }

    /**
     * Sign in with email/password.
     */
    async signIn(email, password) {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Please add your Firebase config.');
        }

        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    }

    /**
     * Sign in with Google popup.
     */
    async signInWithGoogle() {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Please add your Firebase config.');
        }

        const cred = await signInWithPopup(auth, googleProvider);
        return cred.user;
    }

    /**
     * Sign out.
     */
    async signOut() {
        if (!isFirebaseConfigured()) return;
        await fbSignOut(auth);
        this._user = null;
    }

    /**
     * Register an auth state change listener.
     */
    onAuthChange(callback) {
        this._listeners.push(callback);
        // If already initialized, fire immediately
        if (this._initialized) {
            callback(this._user);
        }
    }

    /**
     * Get the current user (may be null).
     */
    getCurrentUser() {
        return this._user;
    }

    /**
     * Check if user is logged in.
     */
    isLoggedIn() {
        return !!this._user;
    }

    /**
     * Get user display name.
     */
    getDisplayName() {
        return this._user?.displayName || this._user?.email?.split('@')[0] || 'Student';
    }

    /**
     * Get user email.
     */
    getEmail() {
        return this._user?.email || '';
    }

    /**
     * Get user UID.
     */
    getUid() {
        return this._user?.uid || null;
    }

    /**
     * Update user display name in Firebase Auth profile.
     */
    async updateDisplayName(name) {
        if (this._user && name) {
            await updateProfile(this._user, { displayName: name });
        }
    }
}

export const authService = new AuthService();
