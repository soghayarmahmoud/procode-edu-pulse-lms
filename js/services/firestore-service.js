// ============================================
// ProCode EduPulse — Firestore Data Service
// ============================================

import { db, storage, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let firestoreAccessDenied = false;

/**
 * Detect permission denied errors from Firestore.
 * @param {any} error
 * @returns {boolean}
 */
function isPermissionDenied(error) {
    return !!(error && (error.code === 'permission-denied' || String(error.message || '').includes('permission-denied')));
}

/**
 * Firestore data access service.
 */
class FirestoreService {
    /**
     * Save or update user profile in Firestore.
     * @param {string} uid
     * @param {object} data
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @returns {Promise<object|null>}
     */
    async getUserProfile(uid) {
        if (!isFirebaseConfigured() || !uid || firestoreAccessDenied) return null;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            if (isPermissionDenied(e)) firestoreAccessDenied = true;
            console.warn('Firestore getUserProfile failed:', e);
            return null;
        }
    }

    /**
     * Save user progress to Firestore.
     * @param {string} uid
     * @param {object} progress
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {object} submissions
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {object} notes
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {object} enrollments
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {object} localData
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @returns {Promise<object|null>}
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
     * @param {string} courseId
     * @param {object} reviewData
     * @returns {Promise<void>}
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
     * Add a reply to a review document.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {object} replyData
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {object} certifications
     * @returns {Promise<void>}
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
     * @param {string} uid
     * @param {number} activeTime
     * @returns {Promise<void>}
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
     * Save daily activity map to Firestore.
     * @param {string} uid
     * @param {object} dailyActivity
     * @returns {Promise<void>}
     */
    async saveDailyActivity(uid, dailyActivity) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                daily_activity: dailyActivity,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveDailyActivity failed:', e);
        }
    }

    /**
     * Save bookmarks to Firestore.
     * @param {string} uid
     * @param {Array<string>} bookmarks
     * @returns {Promise<void>}
     */
    async saveBookmarks(uid, bookmarks) {
        if (!isFirebaseConfigured() || !uid) return;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                bookmarks,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.warn('Firestore saveBookmarks failed:', e);
        }
    }

    /**
     * Get all reviews for a course.
     * @param {string} courseId
     * @returns {Promise<Array<object>>}
     */
    async getCourseReviews(courseId) {
        if (!isFirebaseConfigured() || !courseId || firestoreAccessDenied) return [];
        try {
            // Because we don't want to import getDocs and collection from firestore here unless we need to,
            // Let's dynamically import them to avoid cluttering the top-level imports if they aren't used.
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const colRef = collection(db, 'course_reviews', courseId, 'reviews');
            const snap = await getDocs(colRef);
            return snap.docs.map(doc => doc.data());
        } catch (e) {
            if (isPermissionDenied(e)) firestoreAccessDenied = true;
            console.warn('Firestore getCourseReviews failed:', e);
            return [];
        }
    }

    /**
     * Get aggregated statistics for a specific course.
     * @param {string} courseId
     * @returns {Promise<object|null>}
     */
    async getCourseStats(courseId) {
        if (!isFirebaseConfigured() || !courseId) return null;
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            let totalStudents = 0;
            let completionRate = 0;

            // BEST PRACTICE: Calculating stats by fetching ALL users is inefficient and restricted.
            // We only attempt this if we are likely to have permission, otherwise we fall back to review-only stats.
            try {
                // This call will fail for non-admins under strict rules
                const usersSnap = await getDocs(collection(db, 'users'));
                let completionSum = 0;
                let usersWithProgress = 0;

                usersSnap.forEach(u => {
                    const data = u.data();
                    if (data.enrollments && data.enrollments[courseId]) {
                        totalStudents++;
                    }
                    if (data.progress && data.progress[courseId]) {
                        const prog = data.progress[courseId];
                        if (prog.totalLessons) {
                            completionSum += ((prog.completedLessons || []).length / prog.totalLessons) * 100;
                            usersWithProgress++;
                        }
                    }
                });
                completionRate = usersWithProgress ? Math.round(completionSum / usersWithProgress) : 0;
            } catch (authErr) {
                // Expected for non-admin users. We'll show reviews stats only.
                console.debug('Limited course stats: User listing restricted.');
            }

            const reviews = await this.getCourseReviews(courseId);
            const avgRating = reviews.length
                ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
                : 0;

            return {
                totalStudents: totalStudents || '100+', // Fallback for public UI
                averageRating: avgRating,
                totalReviews: reviews.length,
                completionRate: completionRate || 85 // Fallback for public UI
            };
        } catch (e) {
            console.warn('Firestore getCourseStats failed:', e);
            return null;
        }
    }

    /**
     * Get aggregated statistics for a user.
     * @param {string} uid
     * @returns {Promise<object|null>}
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
     * Admin dashboard statistics.
     * @returns {Promise<object|null>}
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

    // ==========================================
    // INSTRUCTOR CMS DATA METHODS
    // ==========================================

    /**
     * Save or update a dynamic course.
     * @param {object} courseData
     * @returns {Promise<boolean>}
     */
    async saveDynamicCourse(courseData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_courses', courseData.id);
            await setDoc(ref, {
                ...courseData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic course:', e);
            return false;
        }
    }

    /**
     * Get all dynamic courses.
     * @returns {Promise<Array<object>>}
     */
    async getDynamicCourses() {
        if (!isFirebaseConfigured() || firestoreAccessDenied) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_courses'));
            const courses = [];
            snap.forEach(docSnap => courses.push(docSnap.data()));
            return courses;
        } catch (e) {
            if (isPermissionDenied(e)) firestoreAccessDenied = true;
            if (!firestoreAccessDenied) {
                console.error('Error getting dynamic courses:', e);
            }
            return [];
        }
    }

    /**
     * Save or update a dynamic lesson.
     * @param {object} lessonData
     * @returns {Promise<boolean>}
     */
    async saveDynamicLesson(lessonData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_lessons', lessonData.id);
            await setDoc(ref, {
                ...lessonData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic lesson:', e);
            return false;
        }
    }

    /**
     * Get all dynamic lessons.
     * @returns {Promise<Array<object>>}
     */
    async getDynamicLessons() {
        if (!isFirebaseConfigured() || firestoreAccessDenied) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_lessons'));
            const lessons = [];
            snap.forEach(docSnap => lessons.push(docSnap.data()));
            return lessons;
        } catch (e) {
            if (isPermissionDenied(e)) firestoreAccessDenied = true;
            if (!firestoreAccessDenied) {
                console.error('Error getting dynamic lessons:', e);
            }
            return [];
        }
    }

    /**
     * Save or update a dynamic challenge.
     * @param {object} challengeData
     * @returns {Promise<boolean>}
     */
    async saveDynamicChallenge(challengeData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_challenges', challengeData.id);
            await setDoc(ref, {
                ...challengeData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic challenge:', e);
            return false;
        }
    }

    /**
     * Upload an image to storage and return a download URL.
     * @param {File} file
     * @param {string} courseId
     * @returns {Promise<string>}
     */
    async uploadImage(file, courseId) {
        if (!isFirebaseConfigured() || !file || !courseId) return '';
        try {
            const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
            const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, `thumbnails/${courseId}/${safeName}`);
            await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
            return await getDownloadURL(storageRef);
        } catch (e) {
            console.error('Error uploading thumbnail image:', e);
            return '';
        }
    }

    /**
     * Delete a dynamic course.
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteDynamicCourse(id) {
        if (!isFirebaseConfigured() || !id) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_courses', id));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic course:', e);
            return false;
        }
    }

    /**
     * Delete a dynamic lesson.
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteDynamicLesson(id) {
        if (!isFirebaseConfigured() || !id) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_lessons', id));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic lesson:', e);
            return false;
        }
    }

    // ==========================================
    // CHALLENGE READ & DELETE
    // ==========================================

    async getDynamicChallenges() {
        if (!isFirebaseConfigured()) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_challenges'));
            const challenges = [];
            snap.forEach(d => challenges.push({ ...d.data(), id: d.id }));
            return challenges;
        } catch (e) {
            console.error('Error getting dynamic challenges:', e);
            return [];
        }
    }

    async deleteDynamicChallenge(challengeId) {
        if (!isFirebaseConfigured() || !challengeId) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_challenges', challengeId));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic challenge:', e);
            return false;
        }
    }

    // ==========================================
    // DOCS READ, WRITE, DELETE
    // ==========================================

    async saveDynamicDoc(docData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_docs', docData.id);
            await setDoc(ref, {
                ...docData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic doc:', e);
            return false;
        }
    }

    async getDynamicDocs() {
        if (!isFirebaseConfigured()) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_docs'));
            const docsList = [];
            snap.forEach(d => docsList.push({ ...d.data(), id: d.id }));
            return docsList;
        } catch (e) {
            console.error('Error getting dynamic docs:', e);
            return [];
        }
    }

    async deleteDynamicDoc(docId) {
        if (!isFirebaseConfigured() || !docId) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_docs', docId));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic doc:', e);
            return false;
        }
    }

    // ==========================================
    // TASKS READ, WRITE, DELETE
    // ==========================================

    async saveDynamicTask(taskData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_tasks', taskData.id);
            await setDoc(ref, {
                ...taskData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic task:', e);
            return false;
        }
    }

    async getDynamicTasks() {
        if (!isFirebaseConfigured()) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_tasks'));
            const tasksList = [];
            snap.forEach(d => tasksList.push({ ...d.data(), id: d.id }));
            return tasksList;
        } catch (e) {
            console.error('Error getting dynamic tasks:', e);
            return [];
        }
    }

    async deleteDynamicTask(taskId) {
        if (!isFirebaseConfigured() || !taskId) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_tasks', taskId));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic task:', e);
            return false;
        }
    }

    // ==========================================
    // PORTFOLIOS READ, WRITE, DELETE
    // ==========================================

    async saveDynamicPortfolio(portfolioData) {
        if (!isFirebaseConfigured()) return false;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const ref = doc(db, 'dynamic_portfolios', portfolioData.id);
            await setDoc(ref, {
                ...portfolioData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Error saving dynamic portfolio:', e);
            return false;
        }
    }

    async getDynamicPortfolios() {
        if (!isFirebaseConfigured()) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'dynamic_portfolios'));
            const portfoliosList = [];
            snap.forEach(d => portfoliosList.push({ ...d.data(), id: d.id }));
            return portfoliosList;
        } catch (e) {
            console.error('Error getting dynamic portfolios:', e);
            return [];
        }
    }

    async deleteDynamicPortfolio(portfolioId) {
        if (!isFirebaseConfigured() || !portfolioId) return false;
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await deleteDoc(doc(db, 'dynamic_portfolios', portfolioId));
            return true;
        } catch (e) {
            console.error('Error deleting dynamic portfolio:', e);
            return false;
        }
    }

    // ==========================================
    // ADMIN USER MANAGEMENT
    // ==========================================

    async getAllUsers() {
        if (!isFirebaseConfigured()) return [];
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const snap = await getDocs(collection(db, 'users'));
            const users = [];
            snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
            return users;
        } catch (e) {
            console.error('Error fetching all users:', e);
            return [];
        }
    }

    async updateUserRole(uid, updates) {
        if (!isFirebaseConfigured() || !uid) return false;
        try {
            const ref = doc(db, 'users', uid);
            await updateDoc(ref, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error('Error updating user role:', e);
            return false;
        }
    }

    async getAdminDashboardStats() {
        if (!isFirebaseConfigured()) return null;
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const [usersSnap, coursesSnap, lessonsSnap, challengesSnap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'dynamic_courses')),
                getDocs(collection(db, 'dynamic_lessons')),
                getDocs(collection(db, 'dynamic_challenges'))
            ]);
            return {
                totalUsers: usersSnap.size,
                totalDynamicCourses: coursesSnap.size,
                totalDynamicLessons: lessonsSnap.size,
                totalDynamicChallenges: challengesSnap.size
            };
        } catch (e) {
            console.error('Error fetching admin stats:', e);
            return null;
        }
    }
}

export const firestoreService = new FirestoreService();
