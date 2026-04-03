// ============================================
// ProCode EduPulse — Admin Management Service
// ============================================
// Handles admin operations: user management, analytics,
// content moderation, and system-wide settings.

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs,
    query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { showToast } from '../utils/dom.js';

/**
 * Admin Management Service - Handle all admin operations.
 */
class AdminManagementService {
    /**
     * Create AdminManagementService instance.
     */
    constructor() {
        this.systemSettingsCache = null;
    }

    // ================== USER MANAGEMENT ==================

    /**
     * Get all users with pagination.
     * @param {number} pageSize
     * @param {string} [lastUserDocId] For pagination
     * @returns {Promise<{users: Array, lastDoc: string}>}
     */
    async getAllUsers(pageSize = 20, lastUserDocId = null) {
        if (!isFirebaseConfigured()) return { users: [], lastDoc: null };
        try {
            const usersRef = collection(db, 'users');
            let q = query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize + 1));
            
            const snap = await getDocs(q);
            const docs = snap.docs;
            
            const users = docs.slice(0, pageSize).map(d => ({
                id: d.id,
                ...d.data()
            }));
            
            const lastDoc = docs.length > pageSize ? docs[pageSize - 1].id : null;
            return { users, lastDoc };
        } catch (e) {
            console.warn('AdminManagementService: getAllUsers failed:', e);
            showToast('Failed to fetch users', 'error');
            return { users: [], lastDoc: null };
        }
    }

    /**
     * Search users by email or name.
     * @param {string} searchQuery
     * @returns {Promise<Array<object>>}
     */
    async searchUsers(searchQuery) {
        if (!isFirebaseConfigured() || !searchQuery) return [];
        try {
            const usersRef = collection(db, 'users');
            const snap = await getDocs(usersRef);
            
            const lowerQuery = searchQuery.toLowerCase();
            return snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(u => 
                    (u.profile?.email?.toLowerCase() || '').includes(lowerQuery) ||
                    (u.profile?.name?.toLowerCase() || '').includes(lowerQuery)
                );
        } catch (e) {
            console.warn('AdminManagementService: searchUsers failed:', e);
            return [];
        }
    }

    /**
     * Ban a user (mark as banned, disable access).
     * @param {string} userId
     * @param {string} reason
     * @returns {Promise<boolean>}
     */
    async banUser(userId, reason = '') {
        if (!isFirebaseConfigured() || !userId) return false;
        try {
            const ref = doc(db, 'users', userId);
            await updateDoc(ref, {
                status: 'banned',
                bannedReason: reason,
                bannedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showToast(`User banned successfully`, 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: banUser failed:', e);
            showToast('Failed to ban user', 'error');
            return false;
        }
    }

    /**
     * Suspend a user (temporary ban).
     * @param {string} userId
     * @param {number} suspensionDays Number of days to suspend
     * @param {string} reason
     * @returns {Promise<boolean>}
     */
    async suspendUser(userId, suspensionDays = 7, reason = '') {
        if (!isFirebaseConfigured() || !userId) return false;
        try {
            const suspendUntil = new Date();
            suspendUntil.setDate(suspendUntil.getDate() + suspensionDays);
            
            const ref = doc(db, 'users', userId);
            await updateDoc(ref, {
                status: 'suspended',
                suspendedUntil: suspendUntil.toISOString(),
                suspensionReason: reason,
                updatedAt: serverTimestamp()
            });
            showToast(`User suspended for ${suspensionDays} days`, 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: suspendUser failed:', e);
            showToast('Failed to suspend user', 'error');
            return false;
        }
    }

    /**
     * Unsuspend or unban a user.
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async restoreUser(userId) {
        if (!isFirebaseConfigured() || !userId) return false;
        try {
            const ref = doc(db, 'users', userId);
            await updateDoc(ref, {
                status: 'active',
                bannedAt: null,
                suspendedUntil: null,
                updatedAt: serverTimestamp()
            });
            showToast('User restored successfully', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: restoreUser failed:', e);
            showToast('Failed to restore user', 'error');
            return false;
        }
    }

    /**
     * Elevate user role (e.g., student -> instructor).
     * @param {string} userId
     * @param {string} newRole 'student', 'instructor', 'admin'
     * @returns {Promise<boolean>}
     */
    async elevateUserRole(userId, newRole) {
        if (!isFirebaseConfigured() || !userId) return false;
        try {
            const ref = doc(db, 'users', userId);
            const roleUpdates = {
                updatedAt: serverTimestamp()
            };
            
            if (newRole === 'instructor') {
                roleUpdates.isInstructor = true;
            } else if (newRole === 'admin') {
                roleUpdates.isAdmin = true;
            }
            
            await updateDoc(ref, roleUpdates);
            showToast(`User role elevated to ${newRole}`, 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: elevateUserRole failed:', e);
            showToast('Failed to elevate user role', 'error');
            return false;
        }
    }

    /**
     * Downgrade user role.
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async downgradeUserRole(userId) {
        if (!isFirebaseConfigured() || !userId) return false;
        try {
            const ref = doc(db, 'users', userId);
            await updateDoc(ref, {
                isInstructor: false,
                isAdmin: false,
                updatedAt: serverTimestamp()
            });
            showToast('User role downgraded to student', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: downgradeUserRole failed:', e);
            showToast('Failed to downgrade user role', 'error');
            return false;
        }
    }

    // ================== ANALYTICS & REVENUE ==================

    /**
     * Get platform-wide analytics.
     * @returns {Promise<object>}
     */
    async getPlatformAnalytics() {
        if (!isFirebaseConfigured()) return {};
        try {
            const analyticsRef = doc(db, 'system', 'analytics');
            const snap = await getDoc(analyticsRef);
            return snap.exists() ? snap.data() : this._getDefaultAnalytics();
        } catch (e) {
            console.warn('AdminManagementService: getPlatformAnalytics failed:', e);
            return this._getDefaultAnalytics();
        }
    }

    /**
     * Get or compute real-time analytics.
     * @returns {Promise<object>}
     */
    async computeRealTimeAnalytics() {
        if (!isFirebaseConfigured()) return {};
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const coursesSnap = await getDocs(collection(db, 'courses'));
            
            let totalUsers = 0;
            let activeUsers = 0;
            let instructors = 0;
            let totalEnrollments = 0;
            let totalRevenue = 0;
            
            usersSnap.forEach(doc => {
                totalUsers++;
                const data = doc.data();
                if (data.status === 'active') activeUsers++;
                if (data.isInstructor) instructors++;
                if (data.enrollments?.length) {
                    totalEnrollments += Object.values(data.enrollments).length;
                }
            });
            
            // Calculate revenue from subscriptions/purchases
            const analyticsRef = doc(db, 'system', 'analytics');
            const analyticsSnap = await getDoc(analyticsRef);
            if (analyticsSnap.exists()) {
                totalRevenue = analyticsSnap.data().totalRevenue || 0;
            }
            
            return {
                totalUsers,
                activeUsers,
                instructors,
                totalCourses: coursesSnap.docs.length,
                totalEnrollments,
                totalRevenue,
                platformGrowth: {
                    newUsersThisMonth: 0, // Set based on created dates
                    enrollmentGrowthRate: 0 // Set based on historical data
                }
            };
        } catch (e) {
            console.warn('AdminManagementService: computeRealTimeAnalytics failed:', e);
            return this._getDefaultAnalytics();
        }
    }

    /**
     * Record a revenue transaction.
     * @param {object} transaction
     * @returns {Promise<boolean>}
     */
    async recordTransaction(transaction) {
        if (!isFirebaseConfigured()) return false;
        try {
            const transactionId = `txn_${Date.now()}`;
            const transRef = doc(db, 'transactions', transactionId);
            
            await setDoc(transRef, {
                ...transaction,
                transactionId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            // Update platform total revenue
            const analyticsRef = doc(db, 'system', 'analytics');
            const snap = await getDoc(analyticsRef);
            const currentRevenue = snap.exists() ? (snap.data().totalRevenue || 0) : 0;
            
            await updateDoc(analyticsRef, {
                totalRevenue: currentRevenue + (transaction.amount || 0),
                updatedAt: serverTimestamp()
            });
            
            return true;
        } catch (e) {
            console.warn('AdminManagementService: recordTransaction failed:', e);
            return false;
        }
    }

    // ================== CONTENT MODERATION ==================

    /**
     * Get courses pending approval.
     * @returns {Promise<Array<object>>}
     */
    async getPendingCourses() {
        if (!isFirebaseConfigured()) return [];
        try {
            const coursesRef = collection(db, 'courses');
            const q = query(coursesRef, where('status', '==', 'pending'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('AdminManagementService: getPendingCourses failed:', e);
            return [];
        }
    }

    /**
     * Approve a course for live publication.
     * @param {string} courseId
     * @returns {Promise<boolean>}
     */
    async approveCourse(courseId) {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showToast('Course approved for publication', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: approveCourse failed:', e);
            showToast('Failed to approve course', 'error');
            return false;
        }
    }

    /**
     * Reject a course (with reason).
     * @param {string} courseId
     * @param {string} rejectionReason
     * @returns {Promise<boolean>}
     */
    async rejectCourse(courseId, rejectionReason = '') {
        if (!isFirebaseConfigured() || !courseId) return false;
        try {
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                status: 'rejected',
                rejectionReason,
                rejectedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showToast('Course rejected', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: rejectCourse failed:', e);
            showToast('Failed to reject course', 'error');
            return false;
        }
    }

    /**
     * Flag a comment or review for moderation.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} reason
     * @returns {Promise<boolean>}
     */
    async flagForModeration(courseId, reviewId, reason) {
        if (!isFirebaseConfigured()) return false;
        try {
            const flagId = `flag_${Date.now()}`;
            const flagRef = doc(db, 'moderation_queue', flagId);
            
            await setDoc(flagRef, {
                courseId,
                reviewId,
                reason,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            showToast('Item flagged for review', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: flagForModeration failed:', e);
            showToast('Failed to flag item', 'error');
            return false;
        }
    }

    /**
     * Get moderation queue.
     * @returns {Promise<Array<object>>}
     */
    async getModerationQueue() {
        if (!isFirebaseConfigured()) return [];
        try {
            const modRef = collection(db, 'moderation_queue');
            const q = query(modRef, where('status', '==', 'pending'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('AdminManagementService: getModerationQueue failed:', e);
            return [];
        }
    }

    /**
     * Approve flagged content.
     * @param {string} flagId
     * @returns {Promise<boolean>}
     */
    async approveModerationFlag(flagId) {
        if (!isFirebaseConfigured() || !flagId) return false;
        try {
            const flagRef = doc(db, 'moderation_queue', flagId);
            await updateDoc(flagRef, {
                status: 'approved',
                approvedAt: serverTimestamp()
            });
            showToast('Content approved', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: approveModerationFlag failed:', e);
            return false;
        }
    }

    /**
     * Remove flagged content (delete review/comment).
     * @param {string} flagId
     * @param {string} courseId
     * @param {string} reviewId
     * @returns {Promise<boolean>}
     */
    async removeFlaggedContent(flagId, courseId, reviewId) {
        if (!isFirebaseConfigured()) return false;
        try {
            // Delete the review
            const reviewRef = doc(db, 'course_reviews', courseId, 'reviews', reviewId);
            await deleteDoc(reviewRef);
            
            // Mark flag as resolved
            const flagRef = doc(db, 'moderation_queue', flagId);
            await updateDoc(flagRef, {
                status: 'removed',
                removedAt: serverTimestamp()
            });
            
            showToast('Content removed', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: removeFlaggedContent failed:', e);
            showToast('Failed to remove content', 'error');
            return false;
        }
    }

    // ================== SYSTEM SETTINGS ==================

    /**
     * Get system settings.
     * @returns {Promise<object>}
     */
    async getSystemSettings() {
        if (!isFirebaseConfigured()) return this._getDefaultSettings();
        try {
            if (this.systemSettingsCache) {
                return this.systemSettingsCache;
            }
            
            const settingsRef = doc(db, 'system', 'settings');
            const snap = await getDoc(settingsRef);
            
            const settings = snap.exists() ? snap.data() : this._getDefaultSettings();
            this.systemSettingsCache = settings;
            return settings;
        } catch (e) {
            console.warn('AdminManagementService: getSystemSettings failed:', e);
            return this._getDefaultSettings();
        }
    }

    /**
     * Update system settings.
     * @param {object} updates
     * @returns {Promise<boolean>}
     */
    async updateSystemSettings(updates) {
        if (!isFirebaseConfigured()) return false;
        try {
            const settingsRef = doc(db, 'system', 'settings');
            await updateDoc(settingsRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            this.systemSettingsCache = null; // Invalidate cache
            showToast('System settings updated', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: updateSystemSettings failed:', e);
            showToast('Failed to update settings', 'error');
            return false;
        }
    }

    /**
     * Update subscription pricing.
     * @param {object} pricing { basic, pro, premium }
     * @returns {Promise<boolean>}
     */
    async updatePricing(pricing) {
        const updates = {
            subscriptionPricing: pricing
        };
        return this.updateSystemSettings(updates);
    }

    /**
     * Set promotional banner.
     * @param {object} banner { active, text, color, url }
     * @returns {Promise<boolean>}
     */
    async setPromotionalBanner(banner) {
        const updates = {
            promotionalBanner: banner
        };
        return this.updateSystemSettings(updates);
    }

    /**
     * Create or update platform-wide announcement.
     * @param {object} announcement
     * @returns {Promise<boolean>}
     */
    async createAnnouncement(announcement) {
        if (!isFirebaseConfigured()) return false;
        try {
            const announcementId = `ann_${Date.now()}`;
            const annRef = doc(db, 'announcements', announcementId);
            
            await setDoc(annRef, {
                ...announcement,
                announcementId,
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            showToast('Announcement created', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: createAnnouncement failed:', e);
            showToast('Failed to create announcement', 'error');
            return false;
        }
    }

    /**
     * Get active announcements.
     * @returns {Promise<Array<object>>}
     */
    async getAnnouncements() {
        if (!isFirebaseConfigured()) return [];
        try {
            const annRef = collection(db, 'announcements');
            const q = query(annRef, where('active', '==', true));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('AdminManagementService: getAnnouncements failed:', e);
            return [];
        }
    }

    /**
     * Deactivate announcement.
     * @param {string} announcementId
     * @returns {Promise<boolean>}
     */
    async deactivateAnnouncement(announcementId) {
        if (!isFirebaseConfigured() || !announcementId) return false;
        try {
            const annRef = doc(db, 'announcements', announcementId);
            await updateDoc(annRef, {
                active: false,
                updatedAt: serverTimestamp()
            });
            showToast('Announcement deactivated', 'success');
            return true;
        } catch (e) {
            console.warn('AdminManagementService: deactivateAnnouncement failed:', e);
            return false;
        }
    }

    // ================== HELPERS ==================

    /**
     * Get default analytics structure.
     * @returns {object}
     */
    _getDefaultAnalytics() {
        return {
            totalUsers: 0,
            activeUsers: 0,
            instructors: 0,
            totalCourses: 0,
            totalEnrollments: 0,
            totalRevenue: 0,
            platformGrowth: {
                newUsersThisMonth: 0,
                enrollmentGrowthRate: 0
            }
        };
    }

    /**
     * Get default system settings.
     * @returns {object}
     */
    _getDefaultSettings() {
        return {
            subscriptionPricing: {
                basic: { price: 9.99, features: ['Basic courses', 'Community support'] },
                pro: { price: 19.99, features: ['All basic', 'Advanced courses', 'Priority support'] },
                premium: { price: 49.99, features: ['Everything', 'Certificates', '1-on-1 mentoring'] }
            },
            promotionalBanner: {
                active: false,
                text: '',
                color: '#FF6B6B',
                url: ''
            },
            maintenanceMode: false,
            platformName: 'ProCode',
            updatedAt: new Date().toISOString()
        };
    }
}

export const adminManagementService = new AdminManagementService();
