// ============================================
// ProCode EduPulse — Progress Sync Service
// Bug #117: Broken Data Persistence - Migrate State to Cloud Firestore
// Handles throttled/debounced writes to Firestore
// ============================================

import { firestoreService } from './firestore-service.js';
import { authService } from './auth-service.js';

/**
 * Progress sync service with debouncing and throttling.
 * Prevents excessive Firestore writes while ensuring data persistence.
 */
class ProgressSyncService {
    constructor() {
        this.uid = null;
        this.pendingUpdates = {};
        this.debounceTimer = null;
        this.lastSyncTime = 0;
        this.syncInterval = 15000; // 15 seconds between syncs
        this.debounceDelay = 3000; // 3 seconds debounce
        this.isOnline = navigator.onLine;

        // Listen for online/offline changes
        window.addEventListener('online', () => {
            this.isOnline = true;
            this._flushPendingUpdates();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Initialize the sync service with user ID.
     * @param {string} uid
     */
    init(uid) {
        this.uid = uid;
        if (!uid) {
            this.stop();
            return;
        }
        // Start periodic sync
        this._scheduleSync();
    }

    /**
     * Stop the sync service.
     */
    stop() {
        this.uid = null;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.pendingUpdates = {};
    }

    /**
     * Schedule periodic sync.
     */
    _scheduleSync() {
        if (!this.uid || !this.isOnline) return;
        
        // Check if we need to sync based on time interval
        const now = Date.now();
        if (now - this.lastSyncTime >= this.syncInterval) {
            this._flushPendingUpdates();
        }
    }

    /**
     * Add a progress update to pending queue.
     * Debounced to avoid excessive writes.
     * @param {string} key - 'progress', 'notes', 'submissions', etc.
     * @param {object} data
     */
    queueUpdate(key, data) {
        if (!this.uid) return;

        // Accumulate updates
        this.pendingUpdates[key] = data;

        // Debounce the flush
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this._flushPendingUpdates();
        }, this.debounceDelay);
    }

    /**
     * Sync video timestamp with throttling.
     * Called frequently but only writes every 15 seconds.
     * @param {string} courseId
     * @param {string} lessonId
     * @param {number} currentTime
     * @param {number} duration
     */
    async syncVideoTimestamp(courseId, lessonId, currentTime, duration) {
        if (!this.uid || !this.isOnline) return;

        // Queue the update
        const key = `video_${courseId}_${lessonId}`;
        this.pendingUpdates[key] = {
            type: 'video_timestamp',
            courseId,
            lessonId,
            currentTime,
            duration,
            timestamp: Date.now()
        };

        // Check if we should do an immediate flush based on time
        const now = Date.now();
        if (now - this.lastSyncTime >= this.syncInterval) {
            this._flushPendingUpdates();
        }
    }

    /**
     * Flush all pending updates to Firestore.
     * @private
     */
    async _flushPendingUpdates() {
        if (!this.uid || Object.keys(this.pendingUpdates).length === 0) return;

        const now = Date.now();
        if (now - this.lastSyncTime < this.syncInterval && Object.keys(this.pendingUpdates).length < 5) {
            // Throttle: only flush if enough time passed OR we have many pending updates
            return;
        }

        const updates = { ...this.pendingUpdates };
        this.pendingUpdates = {};

        try {
            // Separate updates by type for efficient processing
            const progressUpdates = {};
            const timestamp = new Date();

            for (const [key, data] of Object.entries(updates)) {
                if (key === 'progress' || key.startsWith('video_')) {
                    if (key.startsWith('video_')) {
                        // Handle video timestamp
                        const { courseId, lessonId, currentTime, duration } = data;
                        if (!progressUpdates[courseId]) {
                            progressUpdates[courseId] = { lessons: {} };
                        }
                        progressUpdates[courseId].lessons[lessonId] = {
                            currentTime,
                            duration,
                            lastUpdated: timestamp
                        };
                    } else {
                        // Merge progress data
                        Object.assign(progressUpdates, data);
                    }
                } else {
                    // Handle other data types directly
                    await this._syncDataType(key, data);
                }
            }

            // Sync all progress updates together
            if (Object.keys(progressUpdates).length > 0) {
                for (const [courseId, courseData] of Object.entries(progressUpdates)) {
                    await firestoreService.syncVideoTimestamp(
                        this.uid,
                        courseId,
                        courseData.lessons[Object.keys(courseData.lessons)[0]]?.currentTime || 0,
                        courseData.lessons[Object.keys(courseData.lessons)[0]]?.duration || 0
                    );
                }
            }

            this.lastSyncTime = now;
            console.debug('✓ Progress synced to Firestore');
        } catch (e) {
            console.warn('Failed to flush pending updates:', e);
            // Re-queue updates on failure
            this.pendingUpdates = { ...updates, ...this.pendingUpdates };
        }

        // Schedule next sync
        this._scheduleSync();
    }

    /**
     * Sync specific data type to Firestore.
     * @private
     */
    async _syncDataType(key, data) {
        if (!this.uid) return;

        try {
            switch (key) {
                case 'progress':
                    await firestoreService.mergeUserProgress(this.uid, { progress: data });
                    break;
                case 'notes':
                    await firestoreService.saveNotes(this.uid, data);
                    break;
                case 'submissions':
                    await firestoreService.saveSubmissions(this.uid, data);
                    break;
                case 'enrollments':
                    await firestoreService.saveEnrollments(this.uid, data);
                    break;
                case 'bookmarks':
                    await firestoreService.saveBookmarks(this.uid, data);
                    break;
                case 'certifications':
                    await firestoreService.saveCertifications(this.uid, data);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.warn(`Failed to sync ${key}:`, e);
        }
    }

    /**
     * Force immediate sync (for critical updates).
     */
    async forceSyncNow() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        await this._flushPendingUpdates();
    }

    /**
     * Get current pending update count (for debugging).
     */
    getPendingCount() {
        return Object.keys(this.pendingUpdates).length;
    }
}

export const progressSyncService = new ProgressSyncService();
