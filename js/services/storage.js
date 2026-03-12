// ============================================
// ProCode EduPulse — localStorage Persistence
// ============================================

const STORAGE_PREFIX = 'procode_';

class StorageService {
    constructor() {
        this._initDefaults();
    }

    // ── Core Operations ──

    _key(name) {
        return `${STORAGE_PREFIX}${name}`;
    }

    _get(key) {
        try {
            const raw = localStorage.getItem(this._key(key));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    _set(key, value) {
        try {
            localStorage.setItem(this._key(key), JSON.stringify(value));
        } catch (e) {
            console.warn('Storage write failed:', e);
        }
    }

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
    }

    // ── Profile ──

    getProfile() {
        return this._get('profile') || {};
    }

    updateProfile(updates) {
        const profile = this.getProfile();
        this._set('profile', { ...profile, ...updates });
        return this.getProfile();
    }

    // ── Gems ──

    getGems() {
        return this.getProfile().gems || 0;
    }

    addGems(amount) {
        const current = this.getGems();
        this.updateProfile({ gems: current + amount });
        return this.getGems();
    }

    // ── Theme ──

    getTheme() {
        return this.getProfile().theme || 'dark';
    }

    setTheme(theme) {
        this.updateProfile({ theme });
        document.documentElement.setAttribute('data-theme', theme);
    }

    // ── Enrollments ──

    enrollCourse(courseId) {
        const enrollments = this._get('enrollments') || {};
        if (!enrollments[courseId]) {
            enrollments[courseId] = {
                enrolledAt: new Date().toISOString()
            };
            this._set('enrollments', enrollments);
        }
    }

    isEnrolled(courseId) {
        const enrollments = this._get('enrollments') || {};
        return !!enrollments[courseId];
    }

    getEnrollments() {
        return this._get('enrollments') || {};
    }

    // ── Progress ──

    getProgress() {
        return this._get('progress') || {};
    }

    getCourseProgress(courseId) {
        const progress = this.getProgress();
        return progress[courseId] || {
            completedLessons: [],
            quizScores: {},
            lastAccessed: null
        };
    }

    completeLesson(courseId, lessonId) {
        const progress = this.getProgress();
        if (!progress[courseId]) {
            progress[courseId] = { completedLessons: [], quizScores: {}, lastAccessed: null };
        }
        if (!progress[courseId].completedLessons.includes(lessonId)) {
            progress[courseId].completedLessons.push(lessonId);
        }
        progress[courseId].lastAccessed = new Date().toISOString();
        this._set('progress', progress);
    }

    isLessonCompleted(courseId, lessonId) {
        const cp = this.getCourseProgress(courseId);
        return cp.completedLessons.includes(lessonId);
    }

    getCourseCompletionPercent(courseId, totalLessons) {
        const cp = this.getCourseProgress(courseId);
        if (totalLessons === 0) return 0;
        return Math.round((cp.completedLessons.length / totalLessons) * 100);
    }

    // ── Quiz Scores ──

    saveQuizScore(courseId, quizId, score) {
        const progress = this.getProgress();
        if (!progress[courseId]) {
            progress[courseId] = { completedLessons: [], quizScores: {}, lastAccessed: null };
        }
        progress[courseId].quizScores[quizId] = {
            score,
            date: new Date().toISOString()
        };
        this._set('progress', progress);
    }

    getQuizScore(courseId, quizId) {
        const cp = this.getCourseProgress(courseId);
        return cp.quizScores[quizId] || null;
    }

    // ── Notes ──

    getNotes(lessonId) {
        const notes = this._get('notes') || {};
        return notes[lessonId] || [];
    }

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

    deleteNote(lessonId, noteId) {
        const notes = this._get('notes') || {};
        if (notes[lessonId]) {
            notes[lessonId] = notes[lessonId].filter(n => n.id !== noteId);
            this._set('notes', notes);
        }
        return notes[lessonId] || [];
    }

    // ── Challenge Submissions ──

    getSubmissions() {
        return this._get('submissions') || {};
    }

    getSubmission(challengeId) {
        const subs = this.getSubmissions();
        return subs[challengeId] || null;
    }

    saveSubmission(challengeId, code, passed) {
        const subs = this.getSubmissions();
        subs[challengeId] = {
            code,
            passed,
            submittedAt: new Date().toISOString()
        };
        this._set('submissions', subs);
    }

    getPassedSubmissions() {
        const subs = this.getSubmissions();
        return Object.entries(subs)
            .filter(([_, s]) => s.passed)
            .map(([id, s]) => ({ challengeId: id, ...s }));
    }

    // ── Editor Preferences ──

    getEditorPrefs() {
        return this._get('editor_prefs') || {
            fontSize: 14,
            tabSize: 2,
            wordWrap: true,
            minimap: false
        };
    }

    setEditorPrefs(prefs) {
        this._set('editor_prefs', { ...this.getEditorPrefs(), ...prefs });
    }

    // ── Stats ──

    getTotalCompletedLessons() {
        const progress = this.getProgress();
        let total = 0;
        for (const course of Object.values(progress)) {
            total += (course.completedLessons || []).length;
        }
        return total;
    }

    getTotalChallengesPassed() {
        return this.getPassedSubmissions().length;
    }

    getTotalLearningHours() {
        const progress = this.getProgress();
        let totalHours = 0;
        for (const [courseId, courseProgress] of Object.entries(progress)) {
            const completedCount = (courseProgress.completedLessons || []).length;
            // Assume ~15 min per lesson on average = 0.25 hours
            totalHours += completedCount * 0.25;
        }
        return Math.round(totalHours * 10) / 10; // Round to 1 decimal
    }

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

    getTotalReviewsCount(userName) {
        return this.getUserReviews(userName).length;
    }

    // ── Reviews ──

    getReviews(courseId) {
        const reviews = this._get('reviews') || {};
        return reviews[courseId] || [];
    }

    getCourseAverageRating(courseId) {
        const reviews = this.getReviews(courseId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }

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
            }
        };
        
        if (existingIndex >= 0) {
            // Preserve existing reactions when updating review
            const existing = reviews[courseId][existingIndex];
            reviewData.reactions = existing.reactions || { like: [], love: [], helpful: [] };
            reviews[courseId][existingIndex] = reviewData;
        } else {
            reviews[courseId].push(reviewData);
        }
        
        this._set('reviews', reviews);
        return reviews[courseId];
    }

    // ── Review Reactions ──

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

    // ── Reset ──

    resetAll() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
        this._initDefaults();
    }
}

export const storage = new StorageService();
