// ============================================
// ProCode EduPulse — Firestore Data Service
// ============================================

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

class FirestoreService {
    /**
     * Save or update user profile in Firestore.
     */
    async saveUserProfile(uid, data) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await setDoc(ref, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('Firestore saveUserProfile failed:', e);
        }
    }

    /**
     * Get user profile from Firestore.
     */
    async getUserProfile(uid) {
        if (!isFirebaseConfigured() || !uid) return null;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.warn('Firestore getUserProfile failed:', e);
            return null;
        }
    }

    /**
     * Save user progress to Firestore.
     */
    async saveProgress(uid, progress) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                progress,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveProgress failed:', e);
        }
    }

    /**
     * Save user submissions to Firestore.
     */
    async saveSubmissions(uid, submissions) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                submissions,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveSubmissions failed:', e);
        }
    }

    /**
     * Save notes to Firestore.
     */
    async saveNotes(uid, notes) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                notes,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveNotes failed:', e);
        }
    }

    /**
     * Sync all localStorage data to Firestore (one-time migration).
     */
    async syncLocalToCloud(uid, localData) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                // First time — push all local data to cloud
                await setDoc(ref, {
                    profile: localData.profile || {},
                    progress: localData.progress || {},
                    submissions: localData.submissions || {},
                    notes: localData.notes || {},
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        } catch (e) {
            console.warn('Firestore syncLocalToCloud failed:', e);
        }
    }

    /**
     * Load all user data from Firestore to populate localStorage.
     */
    async loadCloudData(uid) {
        if (!isFirebaseConfigured() || !uid) return null;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.warn('Firestore loadCloudData failed:', e);
            return null;
        }
    }
}

export const firestoreService = new FirestoreService();
