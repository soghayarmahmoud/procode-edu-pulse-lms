// src/api/data.js
import { store } from '../store/store.js';
import { firestoreService } from '../../js/services/firestore-service.js';
import { isFirebaseConfigured } from '../../js/services/firebase-config.js';
import { storage } from '../../js/services/storage.js';

function getBasePath() {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html') {
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0 && segments[0] !== 'index.html') {
            return '/' + segments[0] + '/';
        }
    }
    return './';
}

export async function loadData() {
    const base = getBasePath();
    const manifest = [
        { key: 'courses', file: 'courses.json' },
        { key: 'lessons', file: 'lessons.json' },
        { key: 'quizzes', file: 'quizzes.json' },
        { key: 'challenges', file: 'challenges.json' },
        { key: 'roadmaps', file: 'roadmaps.json' },
        { key: 'docs', file: 'docs.json' },
        { key: 'modules', file: 'modules.json' }
    ];

    const fetchWithTimeout = (url, timeout = 5000) => {
        return Promise.race([
            fetch(url).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    };

    try {
        console.log('Loading manifest data...');
        const results = await Promise.allSettled(
            manifest.map(item => fetchWithTimeout(`${base}data/${item.file}`))
        );

        const data = {};
        results.forEach((res, i) => {
            const key = manifest[i].key;
            if (res.status === 'fulfilled') {
                data[key] = res.value;
                console.log(`Loaded ${key}`);
            } else {
                console.warn(`Failed to load ${key}:`, res.reason);
                // Assign sensible defaults
                if (key === 'docs') data[key] = { categories: [] };
                else if (key === 'roadmaps') data[key] = { roadmaps: [] };
                else if (key === 'modules') data[key] = { modules: [] };
                else data[key] = { [key]: [] };
            }
        });

        // Update store
        store.set({
            courses: data.courses.courses || [],
            lessons: data.lessons.lessons || [],
            quizzes: data.quizzes.quizzes || [],
            challenges: data.challenges.challenges || [],
            roadmaps: data.roadmaps.roadmaps || [],
            docs: data.docs.categories || [],
            modules: data.modules.modules || []
        });

        // Merge CMS Dynamic Content (Parallelized with Timeout)
        if (isFirebaseConfigured()) {
            try {
                const firestoreTimeout = 8000; // 8 seconds
                const withTimeout = (promise) => Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore Timeout')), firestoreTimeout))
                ]);

                console.log('Fetching dynamic CMS content...');
                const [coursesRes, lessonsRes] = await Promise.allSettled([
                    withTimeout(firestoreService.getDynamicCourses()),
                    withTimeout(firestoreService.getDynamicLessons())
                ]);

                if (coursesRes.status === 'fulfilled' && coursesRes.value) {
                    store.set({ courses: [...store.state.courses, ...coursesRes.value] });
                }
                if (lessonsRes.status === 'fulfilled' && lessonsRes.value) {
                    store.set({ lessons: [...store.state.lessons, ...lessonsRes.value] });
                }
            } catch (err) {
                console.warn('Non-blocking error loading dynamic content:', err);
            }
        }

        // Start Review Sync in Background (Non-blocking)
        console.log('Manifest loading complete. Starting background sync...');
        setTimeout(() => syncReviewsInBackground(), 200);

    } catch (e) {
        console.error('Critical failure in loadData:', e);
        // Ensure some basic data structures exist even on failure
        store.set({
            courses: store.state.courses || [],
            lessons: store.state.lessons || [],
            roadmaps: store.state.roadmaps || [],
            modules: store.state.modules || []
        });
    }
}

async function syncReviewsInBackground() {
    if (!isFirebaseConfigured() || !store.state.courses || store.state.courses.length === 0) return;

    try {
        const allReviews = {};
        // Use a subset or limit parallel calls to avoid hitting quotas
        const limitedCourses = store.state.courses.slice(0, 15);

        console.log(`Background Sync: Fetching reviews for ${limitedCourses.length} courses...`);

        await Promise.allSettled(limitedCourses.map(async (course) => {
            try {
                // Add a local timeout per course review fetch
                const reviews = await Promise.race([
                    firestoreService.getCourseReviews(course.id),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]);

                if (reviews && reviews.length > 0) {
                    allReviews[course.id] = reviews;
                }
            } catch (err) {
                // Silently handle individual course permission/timeout errors
                if (err.code === 'permission-denied') {
                    console.debug(`Permission denied for reviews of course: ${course.id}`);
                }
            }
        }));

        if (Object.keys(allReviews).length > 0) {
            const existingReviews = storage._get('reviews') || {};
            storage._set('reviews', { ...existingReviews, ...allReviews });
            console.log('Background Sync: Reviews updated.');
        }
    } catch (e) {
        console.warn('Review background sync encountered a batch failure:', e);
    }
}