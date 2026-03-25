// ============================================
// ProCode EduPulse — Discussion & Q&A Service
// ============================================

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
    collection, doc, setDoc, getDocs, query, where, orderBy,
    updateDoc, arrayUnion, getDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { authService } from './auth-service.js';

/**
 * Service for discussion threads, replies, and lesson comments.
 */
class DiscussionService {
    /**
     * Create a discussion service instance.
     */
    constructor() {
        this.collectionName = 'discussions';
    }

    /**
     * Fetch discussion threads for a context.
     * @param {string} contextId
     * @returns {Promise<Array<object>>}
     */
    async getThreads(contextId) {
        if (!isFirebaseConfigured()) return this._getMockThreads(contextId);

        try {
            const q = query(
                collection(db, this.collectionName),
                where('contextId', '==', contextId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const threads = [];
            querySnapshot.forEach((docSnap) => {
                threads.push({ id: docSnap.id, ...docSnap.data() });
            });
            return threads;
        } catch (e) {
            console.warn('Firestore discussion fetch error. Ensure index exists for contextId and createdAt.', e);
            try {
                const q2 = query(collection(db, this.collectionName), where('contextId', '==', contextId));
                const snap = await getDocs(q2);
                const threads = [];
                snap.forEach(d => threads.push({ id: d.id, ...d.data() }));
                return threads.sort((a, b) => b.createdAt - a.createdAt);
            } catch {
                return this._getMockThreads(contextId);
            }
        }
    }

    /**
     * Create a new discussion thread.
     * @param {string} contextId
     * @param {string} title
     * @param {string} content
     * @param {string|null} [codeSnippet=null]
     * @returns {Promise<object|null>}
     */
    async createThread(contextId, title, content, codeSnippet = null) {
        const user = authService.getCurrentUser();
        const userName = authService.getDisplayName() || 'Anonymous Student';

        const threadData = {
            id: 'thread_' + Date.now(),
            contextId,
            authorId: user ? user.uid : 'anon',
            authorName: userName,
            title,
            content,
            codeSnippet,
            createdAt: Date.now(),
            replies: [],
            upvotes: 0,
            upvotedBy: []
        };

        if (!isFirebaseConfigured()) {
            this._saveMockThread(threadData);
            return threadData;
        }

        try {
            const ref = doc(collection(db, this.collectionName));
            threadData.id = ref.id;
            await setDoc(ref, threadData);
            return threadData;
        } catch (e) {
            console.error('Error creating thread:', e);
            return null;
        }
    }

    /**
     * Add a reply to a thread and emit a notification when applicable.
     * @param {string} threadId
     * @param {string} content
     * @returns {Promise<object|null>}
     */
    async addReply(threadId, content) {
        const user = authService.getCurrentUser();
        const userName = authService.getDisplayName() || 'Anonymous Student';

        const reply = {
            id: 'rt_' + Date.now().toString() + Math.floor(Math.random() * 1000),
            authorId: user ? user.uid : 'anon',
            authorName: userName,
            content,
            createdAt: Date.now(),
            isInstructor: user && user.email && user.email.includes('instructor')
        };

        if (!isFirebaseConfigured()) {
            this._saveMockReply(threadId, reply);
            return reply;
        }

        try {
            const ref = doc(db, this.collectionName, threadId);
            const threadSnap = await getDoc(ref);
            const threadData = threadSnap.exists() ? threadSnap.data() : null;

            await updateDoc(ref, {
                replies: arrayUnion(reply)
            });

            const authorId = threadData?.authorId;
            const currentUserId = user ? user.uid : 'anon';
            if (authorId && authorId !== currentUserId) {
                const notifRef = doc(collection(db, 'users', authorId, 'notifications'));
                await setDoc(notifRef, {
                    id: notifRef.id,
                    threadId,
                    contextId: threadData?.contextId || null,
                    fromUserId: currentUserId,
                    fromUserName: userName,
                    message: reply.content.slice(0, 140),
                    createdAt: Date.now(),
                    read: false,
                    type: 'reply'
                });
            }

            return reply;
        } catch (e) {
            console.error('Error adding reply:', e);
            return null;
        }
    }

    /**
     * Toggle upvote state for a thread (MVP placeholder).
     * @param {string} threadId
     * @param {boolean} isCurrentlyUpvoted
     * @returns {Promise<void>}
     */
    async toggleUpvote(threadId, isCurrentlyUpvoted) {
        const user = authService.getCurrentUser();
        if (!user || !isFirebaseConfigured()) {
            this._toggleMockUpvote(threadId, (user ? user.uid : 'anon'), isCurrentlyUpvoted);
            return;
        }
    }

    // ------------------------------------------
    // Lesson Comments
    // ------------------------------------------

    /**
     * Get locally stored comments for a lesson.
     * @param {string} lessonId
     * @returns {Array<object>}
     */
    _getLocalComments(lessonId) {
        const all = JSON.parse(localStorage.getItem('procode_lesson_comments') || '{}');
        return all[lessonId] || [];
    }

    /**
     * Save a local comment for a lesson.
     * @param {string} lessonId
     * @param {object} comment
     * @returns {void}
     */
    _saveLocalComment(lessonId, comment) {
        const all = JSON.parse(localStorage.getItem('procode_lesson_comments') || '{}');
        if (!all[lessonId]) all[lessonId] = [];
        all[lessonId].push(comment);
        localStorage.setItem('procode_lesson_comments', JSON.stringify(all));
    }

    /**
     * Add a lesson comment (local or cloud).
     * @param {string} lessonId
     * @param {string} content
     * @returns {Promise<boolean>}
     */
    async addLessonComment(lessonId, content) {
        const user = authService.getCurrentUser();
        const userName = authService.getDisplayName() || 'Student';
        const comment = {
            id: 'lc_' + Date.now().toString() + Math.floor(Math.random() * 1000),
            lessonId,
            authorId: user ? user.uid : 'anon',
            authorName: userName,
            content,
            createdAt: Date.now()
        };

        if (!isFirebaseConfigured() || !user) {
            this._saveLocalComment(lessonId, comment);
            return true;
        }

        try {
            const ref = doc(collection(db, 'lesson_comments'));
            comment.id = ref.id;
            await setDoc(ref, comment);
            return true;
        } catch (e) {
            console.error('Error adding lesson comment:', e);
            return false;
        }
    }

    /**
     * Subscribe to lesson comments with realtime updates.
     * @param {string} lessonId
     * @param {(comments: Array<object>) => void} callback
     * @returns {() => void}
     */
    subscribeLessonComments(lessonId, callback) {
        if (!isFirebaseConfigured()) {
            callback(this._getLocalComments(lessonId));
            return () => {};
        }

        const q = query(
            collection(db, 'lesson_comments'),
            where('lessonId', '==', lessonId)
        );

        return onSnapshot(q, (snap) => {
            const comments = [];
            snap.forEach(d => comments.push(d.data()));
            callback(comments);
        }, () => {
            callback(this._getLocalComments(lessonId));
        });
    }

    // --- Mock Fallbacks for Local Development without Firebase ---

    /**
     * Get mock threads from local storage.
     * @param {string} contextId
     * @returns {Array<object>}
     */
    _getMockThreads(contextId) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        return all.filter(t => t.contextId === contextId).sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Save a mock thread to local storage.
     * @param {object} thread
     * @returns {void}
     */
    _saveMockThread(thread) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        all.push(thread);
        localStorage.setItem('procode_mock_discussions', JSON.stringify(all));
    }

    /**
     * Save a mock reply to local storage.
     * @param {string} threadId
     * @param {object} reply
     * @returns {void}
     */
    _saveMockReply(threadId, reply) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        const thread = all.find(t => t.id === threadId);
        if (thread) {
            if (!thread.replies) thread.replies = [];
            thread.replies.push(reply);
            localStorage.setItem('procode_mock_discussions', JSON.stringify(all));
        }
    }

    /**
     * Mock upvote toggle handler.
     * @param {string} threadId
     * @param {string} uid
     * @param {boolean} isCurrentlyUpvoted
     * @returns {void}
     */
    _toggleMockUpvote(threadId, uid, isCurrentlyUpvoted) {
        // Mock method for UI testing
    }
}

export const discussionService = new DiscussionService();
