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
import { firestoreService } from './firestore-service.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Authentication service wrapper.
 */
class AuthService {
    /**
     * Create an AuthService instance.
     */
    constructor() {
        this._user = null;
        this._profile = null; // Cache for Firestore user profile
        this._listeners = [];
        this._initialized = false;
        this._initPromise = null;
    }

    /**
     * Initialize auth state listener. Returns a promise that resolves
     * when the initial auth state is determined.
     */
    /**
     * Initialize auth state listener.
     * @returns {Promise<object|null>}
     */
    init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            if (!isFirebaseConfigured()) {
                this._initialized = true;
                resolve(null);
                return;
            }

            // Safety timeout to prevent infinite loading if Firebase hangs
            const timeoutId = setTimeout(() => {
                if (!this._initialized) {
                    console.warn('AuthService init timed out after 7s. Proceeding in offline/anonymous mode.');
                    this._initialized = true;
                    resolve(null);
                }
            }, 7000);

            onAuthStateChanged(auth, async (user) => {
                clearTimeout(timeoutId);
                this._user = user;
                this._profile = null; // Clear profile on auth change
                
                if (user) {
                    try {
                        this._profile = await firestoreService.getUserProfile(user.uid);
                    } catch (e) {
                        console.warn('Profile fetch failed during auth change:', e);
                    }
                }
                
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
    /**
     * Sign up with email/password and set display name.
     * @param {string} email
     * @param {string} password
     * @param {string} displayName
     * @returns {Promise<object>}
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
    /**
     * Sign in with email/password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>}
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
    /**
     * Sign in with Google popup.
     * @returns {Promise<object>}
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
    /**
     * Sign out.
     * @returns {Promise<void>}
     */
    async signOut() {
        if (!isFirebaseConfigured()) return;
        await fbSignOut(auth);
        this._user = null;
        this._profile = null;
    }

    /**
     * Register an auth state change listener.
     */
    /**
     * Register an auth state change listener.
     * @param {(user: object|null) => void} callback
     * @returns {void}
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
    /**
     * Get the current user.
     * @returns {object|null}
     */
    getCurrentUser() {
        return this._user;
    }

    /**
     * Check if user is logged in.
     */
    /**
     * Check if user is logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this._user;
    }

    /**
     * Get user display name.
     */
    /**
     * Get user display name.
     * @returns {string}
     */
    getDisplayName() {
        return this._user?.displayName || this._user?.email?.split('@')[0] || 'Student';
    }

    /**
     * Get user email.
     */
    /**
     * Get user email.
     * @returns {string}
     */
    getEmail() {
        return this._user?.email || '';
    }

    /**
     * Get user UID.
     */
    /**
     * Get user UID.
     * @returns {string|null}
     */
    getUid() {
        return this._user?.uid || null;
    }

    /**
     * Get the current user profile from Firestore.
     */
    /**
     * Get the current user profile from Firestore.
     * @returns {Promise<object|null>}
     */
    async getUserProfile() {
        if (!this._user) return null;
        if (this._profile) return this._profile;
        
        try {
            this._profile = await firestoreService.getUserProfile(this._user.uid);
            return this._profile;
        } catch (e) {
            console.warn('Manual profile fetch failed:', e);
            return null;
        }
    }

    /**
     * Check if the current user has admin privileges.
     */
    /**
     * Check if the current user has admin privileges.
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        const profile = await this.getUserProfile();
        if (!profile) return false;
        
        // Match logic from admin-dashboard.js
        return profile.isAdmin === true || profile.profile?.isAdmin === true;
    }

    /**
     * Update user display name in Firebase Auth profile.
     */
    /**
     * Update user display name in Firebase Auth profile.
     */
    /**
     * Update user display name in Firebase Auth profile.
     * @param {string} name
     * @returns {Promise<void>}
     */
    async updateDisplayName(name) {
        if (this._user && name) {
            await updateProfile(this._user, { displayName: name });
        }
    }

    /**
     * Check if the current user has admin privileges (synchronous, uses cache).
     */
    /**
     * Check if the current user has admin privileges (sync cache).
     * @returns {boolean}
     */
    isAdminSync() {
        if (!this._profile) return false;
        return this._profile.isAdmin === true || this._profile.profile?.isAdmin === true;
    }
}

export const authService = new AuthService();
