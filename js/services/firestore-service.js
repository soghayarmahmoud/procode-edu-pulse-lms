// ============================================
// ProCode EduPulse — Firestore Data Service
// ============================================

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion
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
     * Save enrollments to Firestore.
     */
    async saveEnrollments(uid, enrollments) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                enrollments,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveEnrollments failed:', e);
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
                    enrollments: localData.enrollments || {},
                    certifications: localData.certifications || {},
                    active_time: localData.active_time || 0,
                    first_access: localData.first_access || new Date().toISOString(),
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
     * Add a reply to a review document
     */
    async addReply(courseId, reviewId, replyData) {
        if (!isFirebaseConfigured() || !courseId || !reviewId) return;
        try {
            const ref = doc(db, 'course_reviews', courseId, 'reviews', reviewId);
            // Use updateDoc to push into replies array
            await updateDoc(ref, {
                replies: arrayUnion({
                    ...replyData,
                    updatedAt: serverTimestamp()
                }),
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore addReply failed:', e);
        }
    }

    /**
     * Save certifications to Firestore.
     */
    async saveCertifications(uid, certifications) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                certifications,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveCertifications failed:', e);
        }
    }

    /**
     * Save activity time to Firestore.
     */
    async saveActivityTime(uid, activeTime) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                active_time: activeTime,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveActivityTime failed:', e);
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

    /**
     * Get aggregated statistics for a specific course
     */
    async getCourseStats(courseId) {
        if (!isFirebaseConfigured() || !courseId) return null;
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            // fetch all users
            const usersSnap = await getDocs(collection(db, 'users'));
            let totalStudents = 0;
            let completionSum = 0;
            let usersWithProgress = 0;

            usersSnap.forEach(u => {
                const data = u.data();
                if (data.enrollments && data.enrollments[courseId]) {
                    totalStudents++;
                }
                if (data.progress && data.progress[courseId]) {
                    const prog = data.progress[courseId];
                    const lessons = prog.completedLessons || [];
                    // assume totalLessons available from local cache on client side when calling
                    if (prog.totalLessons) {
                        completionSum += (lessons.length / prog.totalLessons) * 100;
                        usersWithProgress++;
                    }
                }
            });

            const reviews = await this.getCourseReviews(courseId);
            const avgRating = reviews.length
                ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
                : 0;
            const completionRate = usersWithProgress ? (completionSum / usersWithProgress) : 0;

            return {
                totalStudents,
                averageRating: avgRating,
                totalReviews: reviews.length,
                completionRate: Math.round(completionRate)
            };
        } catch (e) {
            console.warn('Firestore getCourseStats failed:', e);
            return null;
        }
    }

    /**
     * Get aggregated statistics for a user
     */
    async getUserStats(uid) {
        if (!isFirebaseConfigured() || !uid) return null;
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) return null;
            const data = snap.data();
            const enrollments = data.enrollments || {};
            const coursesEnrolled = Object.keys(enrollments).length;
            const progress = data.progress || {};
            let lessonsCompleted = 0;
            Object.values(progress).forEach(p => { lessonsCompleted += (p.completedLessons || []).length; });
            let totalHours = lessonsCompleted * 0.25;
            // assume stored
            const reviews = data.reviews || {};
            let ratingsSum = 0;
            let reviewCount = 0;
            Object.values(reviews).forEach(arr => {
                arr.forEach(r => { ratingsSum += r.rating; reviewCount++; });
            });
            const avgRating = reviewCount ? ratingsSum / reviewCount : 0;
            return {
                coursesEnrolled,
                lessonsCompleted,
                totalHours: Math.round(totalHours * 10) / 10,
                reviewsWritten: reviewCount,
                averageRatingGiven: avgRating.toFixed(1)
            };
        } catch (e) {
            console.warn('Firestore getUserStats failed:', e);
            return null;
        }
    }

    /**
     * Admin dashboard statistics
     */
    async getAdminStats() {
        if (!isFirebaseConfigured()) return null;
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const usersSnap = await getDocs(collection(db, 'users'));
            const totalUsers = usersSnap.size;
            let totalEnrollments = 0;
            let courseCountMap = {};
            let dailyActive = {};

            usersSnap.forEach(u => {
                const d = u.data();
                if (d.enrollments) {
                    Object.keys(d.enrollments).forEach(cid => {
                        totalEnrollments++;
                        courseCountMap[cid] = (courseCountMap[cid] || 0) + 1;
                    });
                }
                if (d.lastLogin) {
                    const day = new Date(d.lastLogin.seconds * 1000).toISOString().split('T')[0];
                    dailyActive[day] = (dailyActive[day] || 0) + 1;
                }
            });
            const mostPopular = Object.entries(courseCountMap).sort((a,b)=>b[1]-a[1]).map(e=>({courseId:e[0],count:e[1]}));
            return {
                totalUsers,
                totalCourses: coursesData ? coursesData.length : null,
                totalEnrollments,
                mostPopularCourses: mostPopular,
                dailyActiveUsers: dailyActive
            };
        } catch (e) {
            console.warn('Firestore getAdminStats failed:', e);
            return null;
        }
    }
}

export const firestoreService = new FirestoreService();
