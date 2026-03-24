// ============================================
// ProCode EduPulse — Discussion & Q&A Service
// ============================================

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
    collection, doc, setDoc, getDocs, query, where, orderBy, 
    updateDoc, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { authService } from './auth-service.js';

class DiscussionService {
    constructor() {
        this.collectionName = 'discussions';
    }

    /**
     * Fetch discussion threads for a specific context (lesson or challenge ID)
     * @param {string} contextId
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
            querySnapshot.forEach((doc) => {
                threads.push({ id: doc.id, ...doc.data() });
            });
            return threads;
        } catch (e) {
            console.warn('Firestore discussion fetch error. Ensure index exists for contextId and createdAt.', e);
            // Fallback if indexes fail (common in new firebase setups)
            try {
                const q2 = query(collection(db, this.collectionName), where('contextId', '==', contextId));
                const snap = await getDocs(q2);
                const threads = [];
                snap.forEach(d => threads.push({ id: d.id, ...d.data() }));
                return threads.sort((a, b) => b.createdAt - a.createdAt);
            } catch (fallbackError) {
                return this._getMockThreads(contextId);
            }
        }
    }

    /**
     * Create a new thread (Q&A or Code Review)
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
            createdAt: Date.now(), // timestamp for sorting
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
     * Add a reply to a thread
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
            isInstructor: user && user.email && user.email.includes('instructor') // simplistic heuristic
        };

        if (!isFirebaseConfigured()) {
            this._saveMockReply(threadId, reply);
            return reply;
        }

        try {
            const ref = doc(db, this.collectionName, threadId);
            await updateDoc(ref, {
                replies: arrayUnion(reply)
            });
            return reply;
        } catch (e) {
            console.error('Error adding reply:', e);
            return null;
        }
    }

    /**
     * Upvote a thread
     */
    async toggleUpvote(threadId, isCurrentlyUpvoted) {
        const user = authService.getCurrentUser();
        if (!user || !isFirebaseConfigured()) {
            this._toggleMockUpvote(threadId, (user ? user.uid : 'anon'), isCurrentlyUpvoted);
            return;
        }
        
        // Complex logic (transaction) can be avoided using simpler logic if we just assume standard operation for MVP
        // Left as an exercise or placeholder. Updating an array takes more exact data tracking. 
    }

    // --- Mock Fallbacks for Local Development without Firebase ---
    
    _getMockThreads(contextId) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        return all.filter(t => t.contextId === contextId).sort((a,b) => b.createdAt - a.createdAt);
    }

    _saveMockThread(thread) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        all.push(thread);
        localStorage.setItem('procode_mock_discussions', JSON.stringify(all));
    }

    _saveMockReply(threadId, reply) {
        const all = JSON.parse(localStorage.getItem('procode_mock_discussions') || '[]');
        const thread = all.find(t => t.id === threadId);
        if (thread) {
            if(!thread.replies) thread.replies = [];
            thread.replies.push(reply);
            localStorage.setItem('procode_mock_discussions', JSON.stringify(all));
        }
    }
    
    _toggleMockUpvote(threadId, uid, isCurrentlyUpvoted) {
        // Mock method for UI testing
    }
}

export const discussionService = new DiscussionService();
