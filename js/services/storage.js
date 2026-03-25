// ============================================
// ProCode EduPulse — localStorage Persistence
// ============================================

import { authService } from './auth-service.js';
import { firestoreService } from './firestore-service.js';

const STORAGE_PREFIX = 'procode_';

/**
 * localStorage persistence and sync service.
 */
class StorageService {
    /**
     * Create a StorageService instance.
     */
    constructor() {
        this._initDefaults();
    }

    // ── Core Operations ──

    /**
     * Build a namespaced storage key.
     * @param {string} name
     * @returns {string}
     */
    _key(name) {
        return `${STORAGE_PREFIX}${name}`;
    }

    /**
     * Read and parse a value from localStorage.
     * @param {string} key
     * @returns {any}
     */
    _get(key) {
        try {
            const raw = localStorage.getItem(this._key(key));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Serialize and store a value, then sync to cloud.
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    _set(key, value) {
        try {
            localStorage.setItem(this._key(key), JSON.stringify(value));
            this._syncToCloud(key, value);
        } catch (e) {
            console.warn('Storage write failed:', e);
        }
    }

    /**
     * Sync a local key to Firestore.
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    _syncToCloud(key, value) {
        const uid = authService.getUid();
        if (!uid) return;

        // Run sync asynchronously to not block UI
        setTimeout(() => {
            switch (key) {
                case 'profile':
                    firestoreService.saveUserProfile(uid, value);
                    break;
                case 'progress':
                    firestoreService.saveProgress(uid, value);
                    break;
                case 'notes':
                    firestoreService.saveNotes(uid, value);
                    break;
                case 'submissions':
                    firestoreService.saveSubmissions(uid, value);
                    break;
                case 'enrollments':
                    firestoreService.saveEnrollments(uid, value);
                    break;
                case 'certifications':
                    firestoreService.saveCertifications(uid, value);
                    break;
                case 'active_time':
                    firestoreService.saveActivityTime(uid, value);
                    break;
            }
        }, 0);
    }

    /**
     * Initialize default localStorage values.
     * @returns {void}
     */
    _initDefaults() {
        if (!this._get('profile')) {
            this._set('profile', {
                name: 'Student',
                avatar: '',
                bio: 'Passionate learner on ProCode.',
                role: 'Frontend Developer',
                joinDate: new Date().toISOString(),
                theme: 'dark',
                gems: 0
            });
        }
        if (!this._get('progress')) {
            this._set('progress', {});
        }
        if (!this._get('notes')) {
            this._set('notes', {});
        }
        if (!this._get('submissions')) {
            this._set('submissions', {});
        }
        if (!this._get('reviews')) {
            this._set('reviews', {});
        }
        if (!this._get('enrollments')) {
            this._set('enrollments', {});
        }
        if (!this._get('active_time')) {
            this._set('active_time', 0);
        }
        if (!this._get('daily_activity')) {
            this._set('daily_activity', {});
        }
        if (!this._get('first_access')) {
            this._set('first_access', new Date().toISOString());
        }
        if (!this._get('certifications')) {
            this._set('certifications', {});
        }
    }

    // ── Time Tracking & Activity Stats ──

    /**
     * Add active time in seconds.
     * @param {number} seconds
     * @returns {void}
     */
    addActiveTime(seconds) {
        const current = this._get('active_time') || 0;
        this._set('active_time', current + seconds);
    }

    /**
     * Get total learning hours.
     * @returns {number}
     */
    getTotalLearningHours() {
        // Return actual recorded time in hours
        const seconds = this._get('active_time') || 0;
        return Math.round((seconds / 3600) * 10) / 10;
    }

    /**
     * Record activity for a day.
     * @param {'lesson'|'challenge'} type
     * @returns {void}
     */
    recordActivity(type) { // type can be 'lesson' or 'challenge'
        const act = this._get('daily_activity') || {};
        
        // Ensure local timezone accuracy to match user days (YYYY-MM-DD local)
        const d = new Date();
        const today = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
        
        if (!act[today] || typeof act[today] === 'number') {
            // Backward compatibility: If an old entry was a number, carry it over as lesson count
            act[today] = { 
                lessons: typeof act[today] === 'number' ? act[today] : 0, 
                challenges: 0 
            };
        }
        
        if (type === 'lesson') {
            act[today].lessons += 1;
        } else if (type === 'challenge') {
            act[today].challenges += 1;
        }
        
        this._set('daily_activity', act);
    }

    /**
     * Get aggregated activity for the last 7 days.
     * @returns {{labels: string[], datasets: {lessons: number[], challenges: number[]}}}
     */
    getActivityLast7Days() {
        const act = this._get('daily_activity') || {};
        const labels = [];
        const datasets = { lessons: [], challenges: [] };
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            const dateStr = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0')
            ].join('-');
            
            const displayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            labels.push(displayStr);
            const dayData = act[dateStr] || { lessons: 0, challenges: 0 };
            
            // Backward compatibility for when dayData was just a raw number
            datasets.lessons.push(typeof dayData === 'number' ? dayData : (dayData.lessons || 0));
            datasets.challenges.push(dayData.challenges || 0);
        }
        
        return { labels, datasets };
    }

    // ── Profile ──

    /**
     * Get user profile.
     * @returns {object}
     */
    getProfile() {
        return this._get('profile') || {};
    }

    /**
     * Update user profile.
     * @param {object} updates
     * @returns {object}
     */
    updateProfile(updates) {
        const profile = this.getProfile();
        this._set('profile', { ...profile, ...updates });
        return this.getProfile();
    }

    // ── Gems ──

    /**
     * Get current gems.
     * @returns {number}
     */
    getGems() {
        return this.getProfile().gems || 0;
    }

    /**
     * Add gems.
     * @param {number} amount
     * @returns {number}
     */
    addGems(amount) {
        const current = this.getGems();
        this.updateProfile({ gems: current + amount });
        return this.getGems();
    }

    // ── Theme ──

    /**
     * Get theme.
     * @returns {string}
     */
    getTheme() {
        return this.getProfile().theme || 'dark';
    }

    /**
     * Set theme.
     * @param {string} theme
     * @returns {void}
     */
    setTheme(theme) {
        this.updateProfile({ theme });
        document.documentElement.setAttribute('data-theme', theme);
    }

    // ── Enrollments ──

    /**
     * Enroll in a course.
     * @param {string} courseId
     * @returns {void}
     */
    enrollCourse(courseId) {
        const enrollments = this._get('enrollments') || {};
        if (!enrollments[courseId]) {
            enrollments[courseId] = {
                enrolledAt: new Date().toISOString()
            };
            this._set('enrollments', enrollments);
        }
    }

    /**
     * Check enrollment.
     * @param {string} courseId
     * @returns {boolean}
     */
    isEnrolled(courseId) {
        const enrollments = this._get('enrollments') || {};
        return !!enrollments[courseId];
    }

    /**
     * Get enrollments map.
     * @returns {object}
     */
    getEnrollments() {
        return this._get('enrollments') || {};
    }

    // ── Progress ──

    /**
     * Get progress map.
     * @returns {object}
     */
    getProgress() {
        return this._get('progress') || {};
    }

    /**
     * Get progress object for a course.
     * @param {string} courseId
     * @returns {object}
     */
    getCourseProgress(courseId) {
        const progress = this.getProgress();
        return progress[courseId] || {
            completedLessons: [],
            completedModules: [],
            quizScores: {},
            lastAccessed: null
        };
    }

    /**
     * Mark a lesson as complete.
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {void}
     */
    completeLesson(courseId, lessonId) {
        const progress = this.getProgress();
        if (!progress[courseId]) {
            progress[courseId] = { completedLessons: [], quizScores: {}, lastAccessed: null };
        }
        if (!progress[courseId].completedLessons.includes(lessonId)) {
            progress[courseId].completedLessons.push(lessonId);
            this.addGems(5); // Reward for lesson
            this.recordActivity('lesson'); // Record activity for chart
        }
        progress[courseId].lastAccessed = new Date().toISOString();
        this._set('progress', progress);
    }

    /**
     * Check if a lesson is completed.
     * @param {string} courseId
     * @param {string} lessonId
     * @returns {boolean}
     */
    isLessonCompleted(courseId, lessonId) {
        const cp = this.getCourseProgress(courseId);
        return cp.completedLessons.includes(lessonId);
    }

    // Module helpers
    /**
     * Mark a module as complete.
     * @param {string} courseId
     * @param {string} moduleId
     * @returns {void}
     */
    completeModule(courseId, moduleId) {
        const progress = this.getProgress();
        if (!progress[courseId]) {
            progress[courseId] = { completedLessons: [], completedModules: [], quizScores: {}, lastAccessed: null };
        }
        if (!progress[courseId].completedModules) {
            progress[courseId].completedModules = [];
        }
        if (!progress[courseId].completedModules.includes(moduleId)) {
            progress[courseId].completedModules.push(moduleId);
        }
        this._set('progress', progress);
    }

    /**
     * Check if a module is completed.
     * @param {string} courseId
     * @param {string} moduleId
     * @returns {boolean}
     */
    isModuleCompleted(courseId, moduleId) {
        const cp = this.getCourseProgress(courseId);
        return cp.completedModules && cp.completedModules.includes(moduleId);
    }

    /**
     * Compute course completion percent.
     * @param {string} courseId
     * @param {number} totalLessons
     * @returns {number}
     */
    getCourseCompletionPercent(courseId, totalLessons) {
        const cp = this.getCourseProgress(courseId);
        if (totalLessons === 0) return 0;
        const rawPercent = Math.round((cp.completedLessons.length / totalLessons) * 100);
        return Math.min(100, rawPercent);
    }

    // ── Quiz Scores ──

    /**
     * Save quiz score.
     * @param {string} courseId
     * @param {string} quizId
     * @param {number} score
     * @returns {void}
     */
    saveQuizScore(courseId, quizId, score) {
        const progress = this.getProgress();
        if (!progress[courseId]) {
            progress[courseId] = { completedLessons: [], quizScores: {}, lastAccessed: null };
        }
        
        const wasAlreadyPassed = progress[courseId].quizScores[quizId];

        progress[courseId].quizScores[quizId] = {
            score,
            date: new Date().toISOString()
        };
        this._set('progress', progress);

        if (!wasAlreadyPassed && score >= 70) {
            this.addGems(20);
            this.recordActivity('challenge');
        }
    }

    /**
     * Get quiz score.
     * @param {string} courseId
     * @param {string} quizId
     * @returns {object|null}
     */
    getQuizScore(courseId, quizId) {
        const cp = this.getCourseProgress(courseId);
        return cp.quizScores[quizId] || null;
    }

    // ── Notes ──

    /**
     * Get notes for a lesson.
     * @param {string} lessonId
     * @returns {Array<object>}
     */
    getNotes(lessonId) {
        const notes = this._get('notes') || {};
        return notes[lessonId] || [];
    }

    /**
     * Add a note to a lesson.
     * @param {string} lessonId
     * @param {number} timestamp
     * @param {string} text
     * @returns {Array<object>}
     */
    addNote(lessonId, timestamp, text) {
        const notes = this._get('notes') || {};
        if (!notes[lessonId]) notes[lessonId] = [];
        notes[lessonId].push({
            id: Date.now().toString(),
            timestamp,
            text,
            createdAt: new Date().toISOString()
        });
        // Sort by timestamp
        notes[lessonId].sort((a, b) => a.timestamp - b.timestamp);
        this._set('notes', notes);
        return notes[lessonId];
    }

    /**
     * Delete a note by ID.
     * @param {string} lessonId
     * @param {string} noteId
     * @returns {Array<object>}
     */
    deleteNote(lessonId, noteId) {
        const notes = this._get('notes') || {};
        if (notes[lessonId]) {
            notes[lessonId] = notes[lessonId].filter(n => n.id !== noteId);
            this._set('notes', notes);
        }
        return notes[lessonId] || [];
    }

    // ── Challenge Submissions ──

    /**
     * Get challenge submissions.
     * @returns {object}
     */
    getSubmissions() {
        return this._get('submissions') || {};
    }

    /**
     * Get a submission by challenge ID.
     * @param {string} challengeId
     * @returns {object|null}
     */
    getSubmission(challengeId) {
        const subs = this.getSubmissions();
        return subs[challengeId] || null;
    }

    /**
     * Save a challenge submission.
     * @param {string} challengeId
     * @param {string} code
     * @param {boolean} passed
     * @returns {void}
     */
    saveSubmission(challengeId, code, passed) {
        const subs = this.getSubmissions();
        const wasAlreadyPassed = subs[challengeId]?.passed;
        
        subs[challengeId] = {
            code,
            passed,
            submittedAt: new Date().toISOString()
        };
        this._set('submissions', subs);

        if (passed && !wasAlreadyPassed) {
            this.addGems(10); // Reward for challenge
            this.recordActivity('challenge'); // Record activity for chart
        }
    }

    /**
     * Get passed submissions list.
     * @returns {Array<object>}
     */
    getPassedSubmissions() {
        const subs = this.getSubmissions();
        return Object.entries(subs)
            .filter(([_, s]) => s.passed)
            .map(([id, s]) => ({ challengeId: id, ...s }));
    }

    // ── Editor Preferences ──

    /**
     * Get editor preferences.
     * @returns {object}
     */
    getEditorPrefs() {
        return this._get('editor_prefs') || {
            fontSize: 14,
            tabSize: 2,
            wordWrap: true,
            minimap: false
        };
    }

    /**
     * Set editor preferences.
     * @param {object} prefs
     * @returns {void}
     */
    setEditorPrefs(prefs) {
        this._set('editor_prefs', { ...this.getEditorPrefs(), ...prefs });
    }

    // ── Review Replies ──

    /**
     * Add a reply to a course review.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} userName
     * @param {string} text
     * @returns {object|null}
     */
    addReply(courseId, reviewId, userName, text) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) return null;
        const review = reviews[courseId].find(r => r.id === reviewId);
        if (!review) return null;
        if (!review.replies) review.replies = [];
        const reply = {
            id: Date.now().toString(),
            userName,
            text,
            createdAt: new Date().toISOString(),
            reactions: {
                like: [],
                love: [],
                helpful: []
            }
        };
        review.replies.push(reply);
        this._set('reviews', reviews);
        return reply;
    }

    /**
     * Add reaction to a review reply.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} replyId
     * @param {string} reactionType
     * @param {string} userName
     * @returns {object|null}
     */
    addReplyReaction(courseId, reviewId, replyId, reactionType, userName) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) return null;
        const review = reviews[courseId].find(r => r.id === reviewId);
        if (!review || !review.replies) return null;
        const reply = review.replies.find(r => r.id === replyId);
        if (!reply) return null;
        if (!reply.reactions) reply.reactions = { like: [], love: [], helpful: [] };
        // remove prev by user
        Object.keys(reply.reactions).forEach(type => {
            reply.reactions[type] = reply.reactions[type].filter(u => u !== userName);
        });
        if (!reply.reactions[reactionType]) reply.reactions[reactionType] = [];
        if (!reply.reactions[reactionType].includes(userName)) reply.reactions[reactionType].push(userName);
        this._set('reviews', reviews);
        return reply;
    }

    // ── Stats ──

    /**
     * Get total completed lessons.
     * @returns {number}
     */
    getTotalCompletedLessons() {
        const progress = this.getProgress();
        let total = 0;
        for (const course of Object.values(progress)) {
            total += (course.completedLessons || []).length;
        }
        return total;
    }

    /**
     * Get total challenges passed.
     * @returns {number}
     */
    getTotalChallengesPassed() {
        return this.getPassedSubmissions().length;
    }

    /**
     * Get reviews written by a user.
     * @param {string} userName
     * @returns {Array<object>}
     */
    getUserReviews(userName) {
        const reviews = this._get('reviews') || {};
        const userReviews = [];
        
        for (const [courseId, courseReviews] of Object.entries(reviews)) {
            courseReviews.forEach(review => {
                if (review.userName === userName) {
                    userReviews.push({
                        ...review,
                        courseId
                    });
                }
            });
        }
        
        return userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Get total reviews count for a user.
     * @param {string} userName
     * @returns {number}
     */
    getTotalReviewsCount(userName) {
        return this.getUserReviews(userName).length;
    }

    // New dashboard stats methods

    /**
     * Get challenge pass rate percentage.
     * @returns {number}
     */
    getChallengePassRate() {
        const subs = this.getSubmissions();
        const total = Object.keys(subs).length;
        if (total === 0) return 0;
        const passedCount = this.getPassedSubmissions().length;
        return Math.round((passedCount / total) * 100);
    }

    /**
     * Get current activity streak in days.
     * @returns {number}
     */
    getCurrentStreak() {
        const act = this._get('daily_activity') || {};
        let streak = 0;
        let d = new Date();
        
        while (true) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = act[dateStr];
            
            if (dayData && (dayData.lessons > 0 || dayData.challenges > 0)) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                // If today has no activity, check yesterday before breaking streak to 0
                if (streak === 0) {
                    let yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = yesterday.toISOString().split('T')[0];
                    const yData = act[yStr];
                    if (yData && (yData.lessons > 0 || yData.challenges > 0)) {
                        streak++;
                        d.setDate(d.getDate() - 1);
                        continue;
                    }
                }
                break;
            }
        }
        return streak;
    }

    /**
     * Get most active course title.
     * @param {Array<object>} coursesData
     * @returns {string}
     */
    getMostActiveCourse(coursesData) {
        const progress = this.getProgress();
        let maxLessons = -1;
        let mostActiveId = null;

        for (const [courseId, data] of Object.entries(progress)) {
             const completed = (data.completedLessons || []).length;
             if (completed > maxLessons) {
                 maxLessons = completed;
                 mostActiveId = courseId;
             }
        }

        if (mostActiveId && coursesData) {
            const course = coursesData.find(c => c.id === mostActiveId);
            return course ? course.title : 'N/A';
        }
        
        return 'N/A';
    }

    // ── Reviews ──

    /**
     * Get reviews for a course.
     * @param {string} courseId
     * @returns {Array<object>}
     */
    getReviews(courseId) {
        const reviews = this._get('reviews') || {};
        return reviews[courseId] || [];
    }

    /**
     * Get average rating for a course.
     * @param {string} courseId
     * @returns {number|string}
     */
    getCourseAverageRating(courseId) {
        const reviews = this.getReviews(courseId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }

    /**
     * Save or update a review.
     * @param {string} courseId
     * @param {number} rating
     * @param {string} text
     * @param {string} userName
     * @returns {Array<object>}
     */
    saveReview(courseId, rating, text, userName) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) reviews[courseId] = [];
        
        // Check if user already reviewed
        const existingIndex = reviews[courseId].findIndex(r => r.userName === userName);
        const reviewData = {
            id: Date.now().toString(),
            userName,
            rating,
            text,
            createdAt: new Date().toISOString(),
            reactions: {
                like: [],
                love: [],
                helpful: []
            },
            replies: []
        };
        
        if (existingIndex >= 0) {
            // Preserve existing reactions and replies when updating review
            const existing = reviews[courseId][existingIndex];
            reviewData.reactions = existing.reactions || { like: [], love: [], helpful: [] };
            reviewData.replies = existing.replies || [];
            reviews[courseId][existingIndex] = reviewData;
        } else {
            reviews[courseId].push(reviewData);
        }
        
        this._set('reviews', reviews);
        return reviews[courseId];
    }

    // ── Review Reactions ──

    /**
     * Add a reaction to a review.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} reactionType
     * @param {string} userName
     * @returns {void}
     */
    addReaction(courseId, reviewId, reactionType, userName) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) return;

        const review = reviews[courseId].find(r => r.id === reviewId);
        if (!review) return;

        if (!review.reactions) {
            review.reactions = { like: [], love: [], helpful: [] };
        }

        // Remove previous reaction of any type by this user
        Object.keys(review.reactions).forEach(type => {
            review.reactions[type] = (review.reactions[type] || []).filter(u => u !== userName);
        });

        // Add new reaction if not already present
        if (!review.reactions[reactionType]) {
            review.reactions[reactionType] = [];
        }
        if (!review.reactions[reactionType].includes(userName)) {
            review.reactions[reactionType].push(userName);
        }

        this._set('reviews', reviews);
        return review;
    }

    /**
     * Remove a reaction from a review.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} reactionType
     * @param {string} userName
     * @returns {object|undefined}
     */
    removeReaction(courseId, reviewId, reactionType, userName) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) return;

        const review = reviews[courseId].find(r => r.id === reviewId);
        if (!review || !review.reactions) return;

        if (review.reactions[reactionType]) {
            review.reactions[reactionType] = review.reactions[reactionType].filter(u => u !== userName);
        }

        this._set('reviews', reviews);
        return review;
    }

    /**
     * Get a user's reaction type for a review.
     * @param {string} courseId
     * @param {string} reviewId
     * @param {string} userName
     * @returns {string|null}
     */
    getUserReaction(courseId, reviewId, userName) {
        const reviews = this._get('reviews') || {};
        if (!reviews[courseId]) return null;

        const review = reviews[courseId].find(r => r.id === reviewId);
        if (!review || !review.reactions) return null;

        for (const [type, users] of Object.entries(review.reactions)) {
            if (users && users.includes(userName)) {
                return type;
            }
        }
        return null;
    }

    // ── Certifications ──

    /**
     * Record a certificate download.
     * @param {string} courseId
     * @param {string} courseName
     * @returns {object}
     */
    downloadCertificate(courseId, courseName) {
        const certifications = this._get('certifications') || {};
        const certificate = {
            id: Date.now().toString(),
            courseId,
            courseName,
            studentName: this.getProfile().name,
            completionDate: new Date().toISOString(),
            downloadedAt: new Date().toISOString()
        };
        
        if (!certifications[courseId]) {
            certifications[courseId] = [];
        }
        
        certifications[courseId].push(certificate);
        this._set('certifications', certifications);
        return certificate;
    }

    /**
     * Get certifications map.
     * @returns {object}
     */
    getCertifications() {
        return this._get('certifications') || {};
    }

    /**
     * Get total certificate count.
     * @returns {number}
     */
    getCertificateCount() {
        const certs = this.getCertifications();
        let count = 0;
        for (const courseInfo of Object.values(certs)) {
            count += (Array.isArray(courseInfo) ? courseInfo.length : 0);
        }
        return count;
    }

    // ── First Access Tracking ──

    /**
     * Get first access date.
     * @returns {string}
     */
    getFirstAccessDate() {
        return this._get('first_access') || new Date().toISOString();
    }

    // Reset ──

    /**
     * Reset all local storage data.
     * @returns {void}
     */
    resetAll() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
        this._initDefaults();
    }
}

export const storage = new StorageService();
