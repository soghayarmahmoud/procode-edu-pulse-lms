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
const LOCAL_USERS_KEY = 'procode_local_auth_users';
const LOCAL_SESSION_KEY = 'procode_local_auth_session';

function getLocalAuthStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function setLocalAuthStore(store) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(store));
}

function setLocalSession(uid) {
    if (!uid) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return;
    }
    localStorage.setItem(LOCAL_SESSION_KEY, uid);
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function toAuthError(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

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
                const users = getLocalAuthStore();
                const uid = localStorage.getItem(LOCAL_SESSION_KEY);
                if (uid && users[uid]) {
                    this._user = {
                        uid,
                        email: users[uid].email,
                        displayName: users[uid].displayName || users[uid].email?.split('@')[0]
                    };
                }
                this._initialized = true;
                this._listeners.forEach(cb => cb(this._user));
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
            const normalizedEmail = normalizeEmail(email);
            if (!normalizedEmail || !normalizedEmail.includes('@')) {
                throw toAuthError('auth/invalid-email', 'Please enter a valid email address.');
            }
            if (!password || password.length < 6) {
                throw toAuthError('auth/weak-password', 'Password must be at least 6 characters.');
            }

            const users = getLocalAuthStore();
            const exists = Object.values(users).some(u => normalizeEmail(u.email) === normalizedEmail);
            if (exists) {
                throw toAuthError('auth/email-already-in-use', 'This email is already registered. Try signing in.');
            }

            const uid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const userRecord = {
                uid,
                email: normalizedEmail,
                displayName: (displayName || normalizedEmail.split('@')[0] || 'Student').trim(),
                password,
                createdAt: Date.now()
            };

            users[uid] = userRecord;
            setLocalAuthStore(users);
            setLocalSession(uid);

            this._user = {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            };
            this._listeners.forEach(cb => cb(this._user));
            return this._user;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName) {
            await updateProfile(cred.user, { displayName });
            this._user = { ...cred.user, displayName };
        } else {
            this._user = cred.user;
        }

        this._listeners.forEach(cb => cb(this._user));
        return this._user;
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
            const normalizedEmail = normalizeEmail(email);
            const users = getLocalAuthStore();
            const matched = Object.values(users).find(u => normalizeEmail(u.email) === normalizedEmail);

            if (!matched) {
                throw toAuthError('auth/user-not-found', 'No account found with this email.');
            }
            if (matched.password !== password) {
                throw toAuthError('auth/wrong-password', 'Incorrect password. Please try again.');
            }

            setLocalSession(matched.uid);
            this._user = {
                uid: matched.uid,
                email: matched.email,
                displayName: matched.displayName || matched.email?.split('@')[0]
            };
            this._listeners.forEach(cb => cb(this._user));
            return this._user;
        }

        const cred = await signInWithEmailAndPassword(auth, email, password);
        this._user = cred.user;
        this._listeners.forEach(cb => cb(this._user));
        return this._user;
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
            // Local fallback in demo mode: create/reuse a synthetic Google user.
            const users = getLocalAuthStore();
            const existing = Object.values(users).find(u => u.provider === 'google-local');
            const userRecord = existing || {
                uid: `local_google_${Date.now()}`,
                email: 'local.google.user@procode.local',
                displayName: 'Local Google User',
                password: null,
                provider: 'google-local',
                createdAt: Date.now()
            };

            users[userRecord.uid] = userRecord;
            setLocalAuthStore(users);
            setLocalSession(userRecord.uid);

            this._user = {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            };
            this._listeners.forEach(cb => cb(this._user));
            return this._user;
        }

        const cred = await signInWithPopup(auth, googleProvider);
        this._user = cred.user;
        this._listeners.forEach(cb => cb(this._user));
        return this._user;
    }

    /**
     * Sign out.
     */
    /**
     * Sign out.
     * @returns {Promise<void>}
     */
    async signOut() {
        if (!isFirebaseConfigured()) {
            setLocalSession(null);
            this._user = null;
            this._profile = null;
            this._listeners.forEach(cb => cb(null));
            return;
        }
        await fbSignOut(auth);
        this._user = null;
        this._profile = null;
        this._listeners.forEach(cb => cb(null));
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
        if (!this._user && !isFirebaseConfigured()) {
            const users = getLocalAuthStore();
            const uid = localStorage.getItem(LOCAL_SESSION_KEY);
            if (uid && users[uid]) {
                this._user = {
                    uid,
                    email: users[uid].email,
                    displayName: users[uid].displayName || users[uid].email?.split('@')[0] || 'Student'
                };
            }
        }

        if (!this._user && isFirebaseConfigured() && auth?.currentUser) {
            this._user = auth.currentUser;
        }

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

    static getSuperAdminEmails() {
        return ['mahmoudsruby@gmail.com', 'mahmoudabdelrauf84@gmail.com'];
    }

    static getSuperInstructorEmails() {
        return ['mahmoudsruby@gmail.com', 'mahmoudabdelrauf84@gmail.com'];
    }

    static isSuperAdminEmail(email) {
        return !!(email && AuthService.getSuperAdminEmails().includes(email.toLowerCase()));
    }

    static isSuperInstructorEmail(email) {
        return !!(email && AuthService.getSuperInstructorEmails().includes(email.toLowerCase()));
    }

    /**
     * Check if the current user has admin privileges.
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        if (AuthService.isSuperAdminEmail(this._user?.email)) return true;
        const profile = await this.getUserProfile();
        if (!profile) return false;
        return profile.isAdmin === true || profile.profile?.isAdmin === true;
    }

    /**
     * Check if the current user has instructor privileges.
     * @returns {Promise<boolean>}
     */
    async isInstructor() {
        if (AuthService.isSuperInstructorEmail(this._user?.email)) return true;
        const profile = await this.getUserProfile();
        if (!profile) return false;
        return profile.isInstructor === true || profile.profile?.isInstructor === true;
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
        if (!isFirebaseConfigured()) {
            if (this._user && name) {
                const users = getLocalAuthStore();
                const uid = this._user.uid;
                if (users[uid]) {
                    users[uid].displayName = name;
                    setLocalAuthStore(users);
                }
                this._user = { ...this._user, displayName: name };
                this._listeners.forEach(cb => cb(this._user));
            }
            return;
        }
        if (this._user && name) {
            await updateProfile(this._user, { displayName: name });
        }
    }

    /**
     * Check if the current user has admin privileges (synchronous, uses cache).
     * @returns {boolean}
     */
    isAdminSync() {
        if (AuthService.isSuperAdminEmail(this._user?.email)) return true;
        if (!this._profile) return false;
        return this._profile.isAdmin === true || this._profile.profile?.isAdmin === true;
    }

    /**
     * Check if the current user has instructor privileges (synchronous, uses cache).
     * @returns {boolean}
     */
    isInstructorSync() {
        if (AuthService.isSuperInstructorEmail(this._user?.email)) return true;
        if (!this._profile) return false;
        return this._profile.isInstructor === true || this._profile.profile?.isInstructor === true;
    }

    /**
     * Check if current user can access admin UI (sync).
     * Includes super-admin allowlist and cached profile roles.
     * @returns {boolean}
     */
    hasAdminAccessSync() {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (AuthService.isSuperAdminEmail(user.email)) return true;
        return this.isAdminSync();
    }

    /**
     * Check if current user is in super-admin allowlist (sync).
     * @returns {boolean}
     */
    hasSuperAdminAccessSync() {
        const user = this.getCurrentUser();
        if (!user) return false;
        return AuthService.isSuperAdminEmail(user.email);
    }
}

export const authService = new AuthService();
