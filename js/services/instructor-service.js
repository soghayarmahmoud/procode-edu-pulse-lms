// ============================================
// ProCode EduPulse — Instructor Service
// ============================================
// Handles instructor-specific operations: course management,
// revenue tracking, and course interactions.

import { db, storage, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc,
    query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove
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
            const coursesRef = collection(db, 'courses');
            const q = query(coursesRef, where('instructorId', '==', instructorId));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
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
            const courseRef = doc(db, 'courses', courseId);
            
            await updateDoc(courseRef, {
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
            console.warn('InstructorService: addResource failed:', e);
            showToast('Failed to add resource', 'error');
            return false;
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
            const quizRef = doc(db, 'quizzes', quizId);
            
            await setDoc(quizRef, {
                ...quizData,
                quizId,
                courseId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            // Add quiz reference to course
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                quizzes: arrayUnion(quizId),
                updatedAt: serverTimestamp()
            });
            
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
                        courseId: course.id,
                        courseName: course.title,
                        reviewId: d.id,
                        ...d.data()
                    });
                });
            }
            
            return interactions;
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
            const transRef = collection(db, 'transactions');
            const q = query(
                transRef,
                where('instructorId', '==', instructorId),
                orderBy('createdAt', 'desc')
            );
            
            const snap = await getDocs(q);
            const transactions = snap.docs.map(d => d.data());
            
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
            const earnings = [];
            
            for (const course of courses) {
                const transRef = collection(db, 'transactions');
                const q = query(
                    transRef,
                    where('courseId', '==', course.id),
                    where('instructorId', '==', instructorId)
                );
                
                const snap = await getDocs(q);
                let totalRevenue = 0;
                let studentCount = new Set();
                
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    totalRevenue += data.amount || 0;
                    if (data.studentId) studentCount.add(data.studentId);
                });
                
                earnings.push({
                    courseId: course.id,
                    courseName: course.title,
                    totalRevenue,
                    enrolledStudents: studentCount.size,
                    revenuePerStudent: studentCount.size > 0 ? (totalRevenue / studentCount.size).toFixed(2) : 0
                });
            }
            
            return earnings;
        } catch (e) {
            console.warn('InstructorService: getEarningsByCoursee failed:', e);
            return [];
        }
    }

    /**
     * Get student earnings breakdown (per student enrolled in courses).
     * @param {string} instructorId
     * @returns {Promise<Array<object>>}
     */
    async getStudentEarningsBreakdown(instructorId) {
        if (!isFirebaseConfigured() || !instructorId) return [];
        try {
            const transRef = collection(db, 'transactions');
            const q = query(
                transRef,
                where('instructorId', '==', instructorId),
                orderBy('createdAt', 'desc')
            );
            
            const snap = await getDocs(q);
            const studentMap = {};
            
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (!studentMap[data.studentId]) {
                    studentMap[data.studentId] = {
                        studentId: data.studentId,
                        studentName: data.studentName || 'Unknown',
                        studentEmail: data.studentEmail || '',
                        totalSpent: 0,
                        coursesPurchased: new Set(),
                        lastPurchaseDate: null
                    };
                }
                
                studentMap[data.studentId].totalSpent += data.amount || 0;
                if (data.courseId) studentMap[data.studentId].coursesPurchased.add(data.courseId);
                studentMap[data.studentId].lastPurchaseDate = data.createdAt;
            });
            
            return Object.values(studentMap).map(s => ({
                ...s,
                coursesPurchased: s.coursesPurchased.size
            }));
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
            let totalEnrollments = 0;
            
            for (const course of courses) {
                totalEnrollments += course.totalEnrollments || 0;
            }
            
            return totalEnrollments;
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
        
        const totalEarnings = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
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
}

export const instructorService = new InstructorService();
