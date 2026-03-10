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
                joinDate: new Date().toISOString(),
                theme: 'dark'
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

    // ── Theme ──

    getTheme() {
        return this.getProfile().theme || 'dark';
    }

    setTheme(theme) {
        this.updateProfile({ theme });
        document.documentElement.setAttribute('data-theme', theme);
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

    // ── Reset ──

    resetAll() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
        this._initDefaults();
    }
}

export const storage = new StorageService();
