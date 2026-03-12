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

    /**
     * Save a review for a course.
     */
    async saveReview(courseId, reviewData) {
        if (!isFirebaseConfigured() || !courseId) return;
        try {
            // We use the review ID as the document ID inside the course's reviews subcollection
            const ref = doc(db, 'course_reviews', courseId, 'reviews', reviewData.id);
            await setDoc(ref, {
                ...reviewData,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveReview failed:', e);
        }
    }

    /**
     * Get all reviews for a course.
     */
    async getCourseReviews(courseId) {
        if (!isFirebaseConfigured() || !courseId) return [];
        try {
            // Because we don't want to import getDocs and collection from firestore here unless we need to,
            // Let's dynamically import them to avoid cluttering the top-level imports if they aren't used.
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const colRef = collection(db, 'course_reviews', courseId, 'reviews');
            const snap = await getDocs(colRef);
            return snap.docs.map(doc => doc.data());
        } catch (e) {
            console.warn('Firestore getCourseReviews failed:', e);
            return [];
        }
    }
}

export const firestoreService = new FirestoreService();
