// ============================================
// ProCode EduPulse — App Hydration Service
// Bug #117: Initialize app state from Firestore
// ============================================

import { firestoreService } from './firestore-service.js';
import { progressSyncService } from './progress-sync.js';
import { authService } from './auth-service.js';
import { storage } from './storage.js';

/**
 * App hydration service for loading state from Firestore on initialization.
 * Ensures single source of truth is Firestore, not localStorage.
 */
class AppHydrationService {
    /**
     * Hydrate app state: load from Firestore first, then fall back to localStorage.
     * Called on app initialization after user login.
     * @param {string} uid
     * @returns {Promise<object>}
     */
    async hydrateAppState(uid) {
        if (!uid) return null;

        try {
            console.debug('🔄 Hydrating app state from Firestore...');

            // 1. Load user progress from Firestore (source of truth)
            const firestoreData = await firestoreService.getUserProgress(uid);

            if (firestoreData) {
                console.debug('✓ Loaded progress from Firestore');

                // 2. Merge with localStorage and update localStorage with Firestore data
                const localData = this._getLocalStorageData();
                const mergedData = this._mergeStates(firestoreData, localData);

                // 3. Update localStorage with Firestore data (Firestore is source of truth)
                this._updateLocalStorage(firestoreData);

                // 4. Initialize the sync service
                progressSyncService.init(uid);

                return mergedData;
            } else {
                // No Firestore data yet (new user)
                console.debug('No progress in Firestore, using localStorage');
                const localData = this._getLocalStorageData();
                
                // Initialize sync service
                progressSyncService.init(uid);
                
                return localData;
            }
        } catch (e) {
            console.warn('Hydration failed, falling back to localStorage:', e);
            const localData = this._getLocalStorageData();
            progressSyncService.init(uid);
            return localData;
        }
    }

    /**
     * Get all local storage data.
     * @private
     */
    _getLocalStorageData() {
        return {
            profile: this._getFromStorage('profile') || {},
            progress: this._getFromStorage('progress') || {},
            enrollments: this._getFromStorage('enrollments') || {},
            notes: this._getFromStorage('notes') || {},
            submissions: this._getFromStorage('submissions') || {},
            bookmarks: this._getFromStorage('bookmarks') || [],
            certifications: this._getFromStorage('certifications') || {},
            active_time: this._getFromStorage('active_time') || 0,
            daily_activity: this._getFromStorage('daily_activity') || {}
        };
    }

    /**
     * Get from localStorage.
     * @private
     */
    _getFromStorage(key) {
        try {
            const raw = localStorage.getItem(`procode_${key}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Merge Firestore data with local data.
     * Firestore data takes precedence (source of truth).
     * @private
     */
    _mergeStates(firestoreData, localData) {
        return {
            profile: { ...localData.profile, ...firestoreData.profile },
            progress: { ...localData.progress, ...firestoreData.progress },
            enrollments: { ...localData.enrollments, ...firestoreData.enrollments },
            notes: { ...localData.notes, ...firestoreData.notes },
            submissions: { ...localData.submissions, ...firestoreData.submissions },
            bookmarks: Array.isArray(firestoreData.bookmarks) ? firestoreData.bookmarks : localData.bookmarks,
            certifications: { ...localData.certifications, ...firestoreData.certifications },
            active_time: firestoreData.active_time || localData.active_time || 0,
            daily_activity: { ...localData.daily_activity, ...firestoreData.daily_activity }
        };
    }

    /**
     * Update localStorage with Firestore data (source of truth).
     * @private
     */
    _updateLocalStorage(firestoreData) {
        if (firestoreData.profile) {
            localStorage.setItem('procode_profile', JSON.stringify(firestoreData.profile));
        }
        if (firestoreData.progress) {
            localStorage.setItem('procode_progress', JSON.stringify(firestoreData.progress));
        }
        if (firestoreData.enrollments) {
            localStorage.setItem('procode_enrollments', JSON.stringify(firestoreData.enrollments));
        }
        if (firestoreData.notes) {
            localStorage.setItem('procode_notes', JSON.stringify(firestoreData.notes));
        }
        if (firestoreData.submissions) {
            localStorage.setItem('procode_submissions', JSON.stringify(firestoreData.submissions));
        }
        if (firestoreData.bookmarks) {
            localStorage.setItem('procode_bookmarks', JSON.stringify(firestoreData.bookmarks));
        }
        if (firestoreData.certifications) {
            localStorage.setItem('procode_certifications', JSON.stringify(firestoreData.certifications));
        }
        if (firestoreData.active_time !== undefined) {
            localStorage.setItem('procode_active_time', JSON.stringify(firestoreData.active_time));
        }
        if (firestoreData.daily_activity) {
            localStorage.setItem('procode_daily_activity', JSON.stringify(firestoreData.daily_activity));
        }
    }

    /**
     * Perform final sync before logout.
     * @param {string} uid
     */
    async finalizeBeforeLogout(uid) {
        if (!uid) return;
        
        try {
            console.debug('💾 Finalizing data sync before logout...');
            
            // Force any pending updates to sync
            await progressSyncService.forceSyncNow();
            
            // Stop the sync service
            progressSyncService.stop();
            
            console.debug('✓ Data synchronized and sync service stopped');
        } catch (e) {
            console.warn('Error during logout finalization:', e);
        }
    }

    /**
     * Check if device switched (logged in another device).
     * Used to trigger sync conflicts resolution.
     * @param {string} uid
     * @returns {Promise<boolean>}
     */
    async hasDeviceSwitched(uid) {
        if (!uid) return false;

        try {
            const deviceId = localStorage.getItem('procode_device_id');
            const currentDeviceId = this._generateDeviceId();

            if (!deviceId) {
                // First time on this device
                localStorage.setItem('procode_device_id', currentDeviceId);
                return false;
            }

            if (deviceId !== currentDeviceId) {
                console.debug('🔀 Device switch detected!');
                return true;
            }

            return false;
        } catch (e) {
            console.warn('Error checking device switch:', e);
            return false;
        }
    }

    /**
     * Generate a unique device ID (localStorage + user agent).
     * @private
     */
    _generateDeviceId() {
        const userAgent = navigator.userAgent;
        const storedId = localStorage.getItem('procode_device_secret') || Math.random().toString(36);
        localStorage.setItem('procode_device_secret', storedId);
        
        // Simple hash
        return btoa(`${userAgent}:${storedId}`).substring(0, 32);
    }
}

export const appHydrationService = new AppHydrationService();
