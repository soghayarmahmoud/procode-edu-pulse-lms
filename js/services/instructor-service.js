// ============================================
// ProCode EduPulse — Instructor Service
// ============================================
// Handles instructor-specific operations: course management,
// revenue tracking, and course interactions.

import { db, storage, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc,
    query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove, collectionGroup
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { showToast } from '../utils/dom.js';

/**
 * Instructor Service - Handle instructor operations.
 */
class InstructorService {
    /**
     * Create InstructorService instance.
     */
    constructor() {
        this.instructorCache = {};
    }

    // ================== COURSE MANAGEMENT ==================

    /**
     * Get all courses created by instructor.
     * @param {string} instructorId
     * @returns {Promise<Array<object>>}
     */
    async getInstructorCourses(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return [];
        try {
            const dynamicRef = collection(db, 'dynamic_courses');
            const dynamicQ = query(dynamicRef, where('instructorId', '==', instructorId));
            const dynamicSnap = await getDocs(dynamicQ);
            const dynamicCourses = dynamicSnap.docs.map(d => ({ id: d.id, ...d.data(), _source: 'dynamic_courses' }));
            if (dynamicCourses.length > 0) return dynamicCourses;

            const coursesRef = collection(db, 'courses');
            const coursesQ = query(coursesRef, where('instructorId', '==', instructorId));
            const coursesSnap = await getDocs(coursesQ);
            return coursesSnap.docs.map(d => ({ id: d.id, ...d.data(), _source: 'courses' }));
        } catch (e) {
            console.warn('InstructorService: getInstructorCourses failed:', e);
            return [];
        }
    }

    /**
     * Create a new course.
     * @param {string} instructorId
     * @param {object} courseData
     * @returns {Promise<string|null>} Course ID
     */
    async createCourse(instructorId, courseData) {
        if (!isFirebaseConfigured() || !instructorId) return null;
        try {
            const courseId = `course_${Date.now()}`;
            const courseRef = doc(db, 'courses', courseId);
            
            await setDoc(courseRef, {
                ...courseData,
                courseId,
                instructorId,
                status: 'draft', // Starts as draft, needs admin approval
                enrollments: [],
                totalEnrollments: 0,
                averageRating: 0,
                totalReviews: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            showToast('Course created successfully', 'success');
            return courseId;
        } catch (e) {
            console.warn('InstructorService: createCourse failed:', e);
            showToast('Failed to create course', 'error');
            return null;
        }
    }

    /**
     * Update course details.
     * @param {string} courseId
     * @param {object} updates
     * @returns {Promise<boolean>}
     */
    async updateCourse(courseId, updates) {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            showToast('Course updated successfully', 'success');
            return true;
        } catch (e) {
            console.warn('InstructorService: updateCourse failed:', e);
            showToast('Failed to update course', 'error');
            return false;
        }
    }

    /**
     * Publish course (submit for admin approval).
     * @param {string} courseId
     * @returns {Promise<boolean>}
     */
    async publishCourse(courseId) {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                status: 'pending', // Awaiting admin approval
                submittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showToast('Course submitted for review', 'success');
            return true;
        } catch (e) {
            console.warn('InstructorService: publishCourse failed:', e);
            showToast('Failed to submit course', 'error');
            return false;
        }
    }

    /**
     * Add a video to course lessons.
     * @param {string} courseId
     * @param {object} videoData { title, description, videoUrl, duration, order }
     * @returns {Promise<boolean>}
     */
    async addVideoLesson(courseId, videoData) {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const lessonId = `lesson_${Date.now()}`;
            const courseRef = doc(db, 'courses', courseId);
            
            await updateDoc(courseRef, {
                lessons: arrayUnion({
                    id: lessonId,
                    ...videoData,
                    createdAt: new Date().toISOString()
                }),
                updatedAt: serverTimestamp()
            });
            
            showToast('Video lesson added', 'success');
            return true;
        } catch (e) {
            console.warn('InstructorService: addVideoLesson failed:', e);
            showToast('Failed to add video lesson', 'error');
            return false;
        }
    }

    /**
     * Add external resource to course.
     * @param {string} courseId
     * @param {object} resource { title, url, type: 'pdf'|'github'|'link' }
     * @returns {Promise<boolean>}
     */
    async addResource(courseId, resource) {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const resourceId = `res_${Date.now()}`;
            const dynamicCourseRef = doc(db, 'dynamic_courses', courseId);
            
            await updateDoc(dynamicCourseRef, {
                resources: arrayUnion({
                    id: resourceId,
                    ...resource,
                    addedAt: new Date().toISOString()
                }),
                updatedAt: serverTimestamp()
            });
            
            showToast('Resource added', 'success');
            return true;
        } catch (e) {
            try {
                const courseRef = doc(db, 'courses', courseId);
                await updateDoc(courseRef, {
                    resources: arrayUnion({
                        id: `res_${Date.now()}`,
                        ...resource,
                        addedAt: new Date().toISOString()
                    }),
                    updatedAt: serverTimestamp()
                });
                showToast('Resource added', 'success');
                return true;
            } catch (fallbackError) {
                console.warn('InstructorService: addResource failed:', fallbackError);
                showToast('Failed to add resource', 'error');
                return false;
            }
        }
    }

    /**
     * Create quiz for course.
     * @param {string} courseId
     * @param {object} quizData
     * @returns {Promise<string|null>} Quiz ID
     */
    async createQuiz(courseId, quizData) {
        if (!isFirebaseConfigured() || !courseId) return null;
        try {
            const quizId = `quiz_${Date.now()}`;
            const quizRef = doc(db, 'dynamic_quizzes', quizId);
            
            await setDoc(quizRef, {
                ...quizData,
                quizId,
                courseId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            // Add quiz reference to course
            try {
                const dynamicCourseRef = doc(db, 'dynamic_courses', courseId);
                await updateDoc(dynamicCourseRef, {
                    quizzes: arrayUnion(quizId),
                    updatedAt: serverTimestamp()
                });
            } catch {
                const courseRef = doc(db, 'courses', courseId);
                await updateDoc(courseRef, {
                    quizzes: arrayUnion(quizId),
                    updatedAt: serverTimestamp()
                });
            }
            
            showToast('Quiz created', 'success');
            return quizId;
        } catch (e) {
            console.warn('InstructorService: createQuiz failed:', e);
            showToast('Failed to create quiz', 'error');
            return null;
        }
    }

    // ================== COURSE INTERACTIONS ==================

    /**
     * Get all reviews and comments for instructor's courses.
     * @param {string} instructorId
     * @returns {Promise<Array<object>>}
     */
    async getInstructorCourseInteractions(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return [];
        try {
            const courses = await this.getInstructorCourses(instructorId);
            const interactions = [];
            
            for (const course of courses) {
                const reviewsRef = collection(db, 'course_reviews', course.id, 'reviews');
                const snap = await getDocs(reviewsRef);
                
                snap.docs.forEach(d => {
                    interactions.push({
                        type: 'review',
                        courseId: course.id,
                        courseName: course.title,
                        reviewId: d.id,
                        ...d.data()
                    });
                });

                const lessonsRef = collection(db, 'dynamic_lessons');
                const lessonsQ = query(lessonsRef, where('courseId', '==', course.id));
                const lessonsSnap = await getDocs(lessonsQ);

                for (const lessonDoc of lessonsSnap.docs) {
                    const lesson = lessonDoc.data();
                    const commentsRef = collection(db, 'lesson_comments');
                    const commentsQ = query(commentsRef, where('lessonId', '==', lesson.id));
                    const commentsSnap = await getDocs(commentsQ);

                    commentsSnap.docs.forEach(commentDoc => {
                        const c = commentDoc.data();
                        interactions.push({
                            type: 'comment',
                            courseId: course.id,
                            courseName: course.title,
                            lessonId: lesson.id,
                            lessonTitle: lesson.title || lesson.id,
                            reviewId: commentDoc.id,
                            authorName: c.authorName,
                            text: c.content || c.text || '',
                            createdAt: c.createdAt || null,
                            rating: 0,
                            replies: c.replies || []
                        });
                    });
                }
            }

            return interactions.sort((a, b) => {
                const aTime = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.seconds || 0);
                const bTime = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.seconds || 0);
                return bTime - aTime;
            });
        } catch (e) {
            console.warn('InstructorService: getInstructorCourseInteractions failed:', e);
            return [];
        }
    }

    /**
     * Reply to a review/comment.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {object} replyData { authorId, authorName, authorEmail, text }
     * @returns {Promise<boolean>}
     */
    async replyToReview(courseId, reviewId, replyData) {
        if (!isFirebaseConfigured() || !courseId || !reviewId) return false;
        try {
            const reviewRef = doc(db, 'course_reviews', courseId, 'reviews', reviewId);
            
            await updateDoc(reviewRef, {
                replies: arrayUnion({
                    id: `reply_${Date.now()}`,
                    ...replyData,
                    createdAt: serverTimestamp()
                }),
                updatedAt: serverTimestamp()
            });
            
            showToast('Reply posted', 'success');
            return true;
        } catch (e) {
            console.warn('InstructorService: replyToReview failed:', e);
            showToast('Failed to post reply', 'error');
            return false;
        }
    }

    /**
     * Reply to a review or lesson comment.
     * @param {object} payload
     * @param {'review'|'comment'} payload.type
     * @param {string} payload.courseId
     * @param {string} payload.interactionId
     * @param {string} [payload.lessonId]
     * @param {object} payload.replyData
     * @returns {Promise<boolean>}
     */
    async replyToInteraction(payload) {
        const { type, courseId, interactionId, lessonId, replyData } = payload || {};
        if (!isFirebaseConfigured() || !interactionId) return false;

        if (type === 'comment') {
            try {
                const commentRef = doc(db, 'lesson_comments', interactionId);
                await updateDoc(commentRef, {
                    replies: arrayUnion({
                        id: `reply_${Date.now()}`,
                        ...replyData,
                        lessonId: lessonId || null,
                        createdAt: serverTimestamp()
                    }),
                    updatedAt: serverTimestamp()
                });
                showToast('Reply posted', 'success');
                return true;
            } catch (e) {
                console.warn('InstructorService: replyToInteraction(comment) failed:', e);
                showToast('Failed to post reply', 'error');
                return false;
            }
        }

        return this.replyToReview(courseId, interactionId, replyData);
    }

    /**
     * Get reviews for specific course.
     * @param {string} courseId
     * @returns {Promise<Array<object>>}
     */
    async getCourseReviews(courseId) {
        if (!isFirebaseConfigured() || !courseId) return [];
        try {
            const reviewsRef = collection(db, 'course_reviews', courseId, 'reviews');
            const q = query(reviewsRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
        } catch (e) {
            console.warn('InstructorService: getCourseReviews failed:', e);
            return [];
        }
    }

    // ================== REVENUE TRACKING ==================

    /**
     * Get instructor earnings summary.
     * @param {string} instructorId
     * @param {string} period 'month'|'quarter'|'year'|'all'
     * @returns {Promise<object>}
     */
    async getEarningsSummary(instructorId, period = 'month') {
        if (!isFirebaseConfigured() || !instructorId) return {};
        try {
            const courses = await this.getInstructorCourses(instructorId);
            const courseMap = new Map(courses.map(c => [c.id, c]));
            const transactions = await this._listInstructorTransactions(instructorId, courseMap);
            
            return this._calculateEarningsSummary(transactions, period);
        } catch (e) {
            console.warn('InstructorService: getEarningsSummary failed:', e);
            return this._getDefaultEarningsSummary();
        }
    }

    /**
     * Get earnings breakdown by course.
     * @param {string} instructorId
     * @returns {Promise<Array<object>>}
     */
    async getEarningsByCoursee(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return [];
        try {
            const courses = await this.getInstructorCourses(instructorId);
            const courseMap = new Map(courses.map(c => [c.id, c]));
            const transactions = await this._listInstructorTransactions(instructorId, courseMap);
            const earnings = [];
            
            for (const course of courses) {
                const snapData = transactions.filter(t => t.courseId === course.id);
                let totalRevenue = 0;
                const studentCount = new Set();
                
                snapData.forEach((data) => {
                    totalRevenue += this._resolveTransactionAmount(data, course);
                    if (data.studentId) studentCount.add(data.studentId);
                });
                
                earnings.push({
                    courseId: course.id,
                    courseName: course.title,
                    totalRevenue,
                    enrolledStudents: studentCount.size,
                    revenuePerStudent: studentCount.size > 0 ? Number((totalRevenue / studentCount.size).toFixed(2)) : 0
                });
            }
            
            return earnings.sort((a, b) => b.totalRevenue - a.totalRevenue);
        } catch (e) {
            console.warn('InstructorService: getEarningsByCoursee failed:', e);
            return [];
        }
    }

    async getEarningsByCourse(instructorId) {
        return this.getEarningsByCoursee(instructorId);
    }

    /**
     * Get student earnings breakdown (per student enrolled in courses).
     * @param {string} instructorId
     * @returns {Promise<Array<object>>}
     */
    async getStudentEarningsBreakdown(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return [];
        try {
            const courses = await this.getInstructorCourses(instructorId);
            const courseMap = new Map(courses.map(c => [c.id, c]));
            const transactions = await this._listInstructorTransactions(instructorId, courseMap);
            const studentMap = {};
            
            transactions.forEach((data) => {
                const sid = data.studentId || data.userId || 'unknown';
                if (sid === 'unknown') return;

                const course = courseMap.get(data.courseId);
                const amount = this._resolveTransactionAmount(data, course);
                if (!studentMap[sid]) {
                    studentMap[sid] = {
                        studentId: sid,
                        studentName: data.studentName || 'Unknown',
                        studentEmail: data.studentEmail || '',
                        totalSpent: 0,
                        coursesPurchased: new Set(),
                        lastPurchaseDate: null
                    };
                }
                
                studentMap[sid].totalSpent += amount;
                if (data.courseId) studentMap[sid].coursesPurchased.add(data.courseId);
                studentMap[sid].lastPurchaseDate = data.createdAt || data.purchaseDate || null;
            });
            
            return Object.values(studentMap).map(s => ({
                ...s,
                coursesPurchased: s.coursesPurchased.size
            })).sort((a, b) => b.totalSpent - a.totalSpent);
        } catch (e) {
            console.warn('InstructorService: getStudentEarningsBreakdown failed:', e);
            return [];
        }
    }

    /**
     * Get total active enrollments for instructor.
     * @param {string} instructorId
     * @returns {Promise<number>}
     */
    async getTotalEnrollments(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return 0;
        try {
            const courses = await this.getInstructorCourses(instructorId);
            const courseMap = new Map(courses.map(c => [c.id, c]));
            const transactions = await this._listInstructorTransactions(instructorId, courseMap);
            const uniquePairs = new Set();

            transactions.forEach((t) => {
                const sid = t.studentId || t.userId;
                if (sid && t.courseId) uniquePairs.add(`${sid}:${t.courseId}`);
            });

            if (uniquePairs.size > 0) return uniquePairs.size;

            return courses.reduce((sum, c) => sum + (Number(c.totalEnrollments || 0) || 0), 0);
        } catch (e) {
            console.warn('InstructorService: getTotalEnrollments failed:', e);
            return 0;
        }
    }

    /**
     * Get course performance metrics.
     * @param {string} courseId
     * @returns {Promise<object>}
     */
    async getCourseMetrics(courseId) {
        if (!isFirebaseConfigured() || !courseId) return {};
        try {
            const courseRef = doc(db, 'courses', courseId);
            const courseSnap = await getDoc(courseRef);
            
            if (!courseSnap.exists()) return {};
            
            const course = courseSnap.data();
            const reviews = await this.getCourseReviews(courseId);
            
            // Calculate metrics
            const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
            
            return {
                courseId,
                courseName: course.title,
                totalEnrollments: course.totalEnrollments || 0,
                completionRate: course.completionRate || 0,
                averageRating,
                totalReviews: reviews.length,
                status: course.status,
                enrollmentGrowth: 0 // Set based on historical data
            };
        } catch (e) {
            console.warn('InstructorService: getCourseMetrics failed:', e);
            return {};
        }
    }

    // ================== HELPERS ==================

    /**
     * Calculate earnings summary from transactions.
     * @param {Array<object>} transactions
     * @param {string} period
     * @returns {object}
     */
    _calculateEarningsSummary(transactions, period) {
        const now = new Date();
        let filteredTransactions = transactions;
        
        if (period === 'month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredTransactions = transactions.filter(t => new Date(t.createdAt) >= monthAgo);
        } else if (period === 'quarter') {
            const quarterAgo = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            filteredTransactions = transactions.filter(t => new Date(t.createdAt) >= quarterAgo);
        } else if (period === 'year') {
            const yearAgo = new Date(now.getFullYear(), 0, 1);
            filteredTransactions = transactions.filter(t => new Date(t.createdAt) >= yearAgo);
        }
        
        const totalEarnings = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount || 0) || 0), 0);
        const totalTransactions = filteredTransactions.length;
        const averageTransactionAmount = totalTransactions > 0 ? (totalEarnings / totalTransactions).toFixed(2) : 0;
        
        return {
            totalEarnings: totalEarnings.toFixed(2),
            transactionCount: totalTransactions,
            averageTransactionAmount,
            period,
            currency: 'USD'
        };
    }

    /**
     * Get default earnings summary.
     * @returns {object}
     */
    _getDefaultEarningsSummary() {
        return {
            totalEarnings: '0.00',
            transactionCount: 0,
            averageTransactionAmount: '0.00',
            period: 'month',
            currency: 'USD'
        };
    }

    async _listInstructorTransactions(instructorId, courseMap) {
        const courseIds = Array.from(courseMap.keys());
        if (!courseIds.length) return [];

        const normalized = [];

        try {
            const transRef = collection(db, 'transactions');
            const txQ = query(transRef, where('instructorId', '==', instructorId));
            const txSnap = await getDocs(txQ);
            txSnap.forEach((d) => {
                const row = d.data();
                if (!row.courseId || !courseMap.has(row.courseId)) return;
                const course = courseMap.get(row.courseId);
                normalized.push({
                    ...row,
                    amount: this._resolveTransactionAmount(row, course),
                    studentId: row.studentId || row.userId || '',
                    createdAt: row.createdAt || row.purchaseDate || null
                });
            });
        } catch (e) {
            console.warn('InstructorService: transactions lookup fallback path engaged:', e);
        }

        if (normalized.length > 0) return normalized;

        try {
            const purchasesRef = collectionGroup(db, 'purchases');
            const purchasesSnap = await getDocs(purchasesRef);
            purchasesSnap.forEach((d) => {
                const row = d.data();
                if (!row.courseId || !courseMap.has(row.courseId)) return;
                const course = courseMap.get(row.courseId);
                normalized.push({
                    ...row,
                    amount: this._resolveTransactionAmount(row, course),
                    studentId: row.studentId || row.userId || '',
                    createdAt: row.createdAt || row.purchaseDate || null
                });
            });
            return normalized;
        } catch (e) {
            console.warn('InstructorService: purchases collectionGroup fallback failed:', e);
            return [];
        }
    }

    _resolveTransactionAmount(transaction, course) {
        const fromTx = Number(transaction?.amount || 0);
        if (!Number.isNaN(fromTx) && fromTx > 0) return fromTx;

        const fromCourse = Number(course?.pricing?.price || course?.price || 0);
        if (!Number.isNaN(fromCourse) && fromCourse > 0) return fromCourse;

        return 0;
    }
}

export const instructorService = new InstructorService();
