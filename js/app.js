// ============================================
// ProCode EduPulse — Main Application
// ============================================

import { Router } from './utils/router.js';
import { $, animateOnScroll, showToast } from './utils/dom.js';
import { storage } from './services/storage.js';
import { renderNavbar } from './components/navbar.js';
import { initTheme } from './components/theme-toggle.js';
import { PortfolioComponent } from './components/portfolio.js';
import { authService } from './services/auth-service.js';
import { firestoreService } from './services/firestore-service.js';
import { isFirebaseConfigured } from './services/firebase-config.js';
import 'https://cdn.jsdelivr.net/npm/chart.js';

// ── Base Path Helper (GitHub Pages compatibility) ──
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

// ── Data Cache ──
let coursesData = null;
let lessonsData = null;
let quizzesData = null;
let challengesData = null;
let roadmapsData = null;
let docsData = null;
let modulesData = null;

async function loadData() {
    const base = getBasePath();
    const [courses, lessons, quizzes, challenges, roadmaps, docs, modules] = await Promise.all([
        fetch(`${base}data/courses.json`).then(r => r.json()),
        fetch(`${base}data/lessons.json`).then(r => r.json()),
        fetch(`${base}data/quizzes.json`).then(r => r.json()),
        fetch(`${base}data/challenges.json`).then(r => r.json()),
        fetch(`${base}data/roadmaps.json`).then(r => r.json()).catch(() => ({ roadmaps: [] })),
        fetch(`${base}data/docs.json`).then(r => r.json()).catch(() => ({ categories: [] })),
        fetch(`${base}data/modules.json`).then(r => r.json()).catch(() => ({ modules: [] }))
    ]);
    coursesData = courses.courses;
    lessonsData = lessons.lessons;
    quizzesData = quizzes.quizzes;
    challengesData = challenges.challenges;
    roadmapsData = roadmaps.roadmaps || [];
    docsData = docs.categories || [];
    modulesData = modules.modules || [];

    // Sync reviews from cloud to local storage for all courses
    try {
        if (isFirebaseConfigured()) {
            const allReviews = {};
            for (const course of coursesData) {
                const reviews = await firestoreService.getCourseReviews(course.id);
                if (reviews && reviews.length > 0) {
                    allReviews[course.id] = reviews;
                }
            }
            if (Object.keys(allReviews).length > 0) {
                const existingReviews = storage._get('reviews') || {};
                storage._set('reviews', { ...existingReviews, ...allReviews });
            }
        }
    } catch (e) {
        console.warn('Failed to sync reviews:', e);
    }
}

function transitionPage(renderFn, path = window.location.hash) {
    const app = $('#app');
    app.style.opacity = 0;
    
    // Inject skeleton based on route immediately while fading out
    setTimeout(() => {
        if (path.startsWith('#/course/')) {
            app.innerHTML = renderCourseSkeleton();
        } else if (path.startsWith('#/lesson/')) {
            app.innerHTML = renderLessonSkeleton();
        } else if (path === '#/courses') {
            app.innerHTML = renderCoursesPageSkeleton();
        } else if (path === '#/portfolio') {
            app.innerHTML = renderPortfolioSkeleton();
        }
        
        // After briefly showing skeleton, render real content and fade in
        setTimeout(() => {
            renderFn();
            app.style.opacity = 1;
        }, 150); // brief skeleton display
        
    }, 200); // Wait for fade out
}

// ══════════════════════════════════════════════
// SKELETON LOADERS
// ══════════════════════════════════════════════

function renderCoursesPageSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div style="margin-bottom:var(--space-10)">
            <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 250px; height: 20px; border-radius: 4px;"></div>
        </div>
        <div class="grid grid-3 gap-6">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
               <div class="skeleton" style="height: 180px; width: 100%; border-radius: 0;"></div>
               <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); flex: 1;">
                  <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-2)">
                     <div class="skeleton" style="width: 60px; height: 20px; border-radius: 10px;"></div>
                     <div class="skeleton" style="width: 80px; height: 20px; border-radius: 10px;"></div>
                  </div>
                  <div class="skeleton" style="width: 90%; height: 24px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 100%; height: 60px; border-radius: 4px; margin-top: 8px;"></div>
                  <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-4);">
                     <div class="skeleton" style="width: 80px; height: 20px; border-radius: 4px;"></div>
                     <div class="skeleton" style="width: 80px; height: 32px; border-radius: 4px;"></div>
                  </div>
               </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

function renderCourseSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); max-width:800px;">
        <div style="margin-bottom:var(--space-8); display:flex; flex-direction:column; align-items:center;">
          <div class="skeleton" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 80%; height: 60px; border-radius: 8px; margin-bottom: var(--space-4);"></div>
        </div>
        
        <div class="card" style="margin-bottom:var(--space-8); display: flex; flex-direction: column; gap: var(--space-4);">
           <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="skeleton" style="width: 180px; height: 28px; border-radius: 4px;"></div>
              <div class="skeleton" style="width: 80px; height: 20px; border-radius: 4px;"></div>
           </div>
           ${[1, 2, 3, 4, 5].map(() => `
             <div class="skeleton" style="width: 100%; height: 72px; border-radius: var(--radius-lg);"></div>
           `).join('')}
           <div class="skeleton" style="width: 100%; height: 50px; border-radius: var(--radius-lg); margin-top: var(--space-4);"></div>
        </div>
      </div>
    </div>`;
}

function renderLessonSkeleton() {
    return `
    <div class="lesson-layout">
      <aside class="course-sidebar" style="padding: var(--space-4); border-right: 1px solid var(--border-subtle);">
        <div class="skeleton" style="width: 100%; height: 30px; border-radius: 4px; margin-bottom: var(--space-4);"></div>
        <div class="skeleton" style="width: 100%; height: 8px; border-radius: 4px; margin-bottom: var(--space-6);"></div>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
           ${[1,2,3,4].map(() => `<div class="skeleton" style="width: 100%; height: 40px; border-radius: var(--radius-md);"></div>`).join('')}
        </div>
      </aside>
      <main class="lesson-main">
        <div class="lesson-header" style="padding-bottom: var(--space-4);">
           <div class="skeleton" style="width: 200px; height: 16px; border-radius: 4px; margin-bottom: var(--space-2);"></div>
           <div class="skeleton" style="width: 300px; height: 36px; border-radius: 4px; margin-bottom: var(--space-4);"></div>
           <div style="display: flex; gap: var(--space-2);">
              <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
              <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
           </div>
        </div>
        <div class="split-view">
           <div class="video-section">
              <div class="skeleton" style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-lg);"></div>
              <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4);">
                 <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-md);"></div>
                 <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-md);"></div>
              </div>
           </div>
           <div class="editor-section" style="display: flex; flex-direction: column; gap: var(--space-4);">
              <div class="skeleton" style="width: 100%; height: 50%; border-radius: var(--radius-lg);"></div>
              <div class="skeleton" style="width: 100%; height: 50%; border-radius: var(--radius-lg);"></div>
           </div>
        </div>
      </main>
    </div>`;
}

function renderPortfolioSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div style="margin-bottom:var(--space-10); text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 400px; height: 24px; border-radius: 4px; margin-bottom: var(--space-6);"></div>
            <div style="display: flex; gap: var(--space-2);">
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
            </div>
        </div>
        <div class="grid grid-3 gap-6">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
               <div class="skeleton" style="height: 200px; width: 100%; border-radius: 0;"></div>
               <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); flex: 1;">
                  <div class="skeleton" style="width: 80%; height: 24px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 100%; height: 16px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 90%; height: 16px; border-radius: 4px;"></div>
                  <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2)">
                     <div class="skeleton" style="width: 50px; height: 20px; border-radius: 4px;"></div>
                     <div class="skeleton" style="width: 50px; height: 20px; border-radius: 4px;"></div>
                  </div>
               </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}


// ══════════════════════════════════════════════
// AUTH PAGES
// ══════════════════════════════════════════════

function renderLoginPage() {
    const app = $('#app');
    const base = getBasePath();
    app.innerHTML = `
    <div class="auth-page bg-dots-pattern">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">
            <img src="${base}logo.png" alt="ProCode" onerror="this.style.display='none'">
            <span class="auth-logo-text"><span class="pro">Pro</span>Code</span>
          </div>
          <h2 class="auth-card-title">Welcome Back</h2>
          <p class="auth-card-subtitle">Sign in to continue your learning journey</p>
        </div>

        <div class="auth-alert" id="auth-alert"></div>

        <form class="auth-form" id="login-form">
          <div class="input-group">
            <label><i class="fa-solid fa-envelope"></i> Email</label>
            <input type="email" class="input" id="login-email" placeholder="your@email.com" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-lock"></i> Password</label>
            <input type="password" class="input" id="login-password" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="auth-submit-btn" id="login-submit">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In
          </button>
        </form>

        <div class="auth-divider">or</div>

        <button class="auth-google-btn" id="google-signin-btn">
          <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div class="auth-footer">
          Don't have an account? <a href="#/signup">Create one</a>
        </div>
      </div>
    </div>
    `;

    // Form submit
    $('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const btn = $('#login-submit');
        const alert = $('#auth-alert');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Signing in...';
        alert.className = 'auth-alert';
        alert.style.display = 'none';

        try {
            await authService.signIn(email, password);
            // Sync cloud data
            const uid = authService.getUid();
            if (uid) {
                const cloudData = await firestoreService.loadCloudData(uid);
                if (cloudData) {
                    if (cloudData.progress) storage._set('progress', cloudData.progress);
                    if (cloudData.profile) storage._set('profile', cloudData.profile);
                    if (cloudData.enrollments) storage._set('enrollments', cloudData.enrollments);
                }
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
            window.location.hash = '/';
        } catch (err) {
            alert.className = 'auth-alert error visible';
            alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code)}`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }
    });

    // Google sign-in
    $('#google-signin-btn').addEventListener('click', async () => {
        const alert = $('#auth-alert');
        try {
            await authService.signInWithGoogle();
            const uid = authService.getUid();
            const name = authService.getDisplayName();
            if (uid) {
                storage.updateProfile({ name });
                await firestoreService.syncLocalToCloud(uid, {
                    profile: storage.getProfile(),
                    progress: storage.getProgress(),
                    submissions: storage.getSubmissions(),
                    enrollments: storage.getEnrollments(),
                    notes: storage._get('notes') || {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
            window.location.hash = '/';
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                alert.className = 'auth-alert error visible';
                alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code)}`;
            }
        }
    });
}

function renderSignupPage() {
    const app = $('#app');
    const base = getBasePath();
    app.innerHTML = `
    <div class="auth-page bg-dots-pattern">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">
            <img src="${base}logo.png" alt="ProCode" onerror="this.style.display='none'">
            <span class="auth-logo-text"><span class="pro">Pro</span>Code</span>
          </div>
          <h2 class="auth-card-title">Create Account</h2>
          <p class="auth-card-subtitle">Start your coding journey today</p>
        </div>

        <div class="auth-alert" id="auth-alert"></div>

        <form class="auth-form" id="signup-form">
          <div class="input-group">
            <label><i class="fa-solid fa-user"></i> Display Name</label>
            <input type="text" class="input" id="signup-name" placeholder="Your name" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-envelope"></i> Email</label>
            <input type="email" class="input" id="signup-email" placeholder="your@email.com" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-lock"></i> Password</label>
            <input type="password" class="input" id="signup-password" placeholder="Minimum 6 characters" required minlength="6">
          </div>
          <button type="submit" class="auth-submit-btn" id="signup-submit">
            <i class="fa-solid fa-user-plus"></i> Create Account
          </button>
        </form>

        <div class="auth-divider">or</div>

        <button class="auth-google-btn" id="google-signup-btn">
          <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>
    `;

    // Form submit
    $('#signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#signup-name').value.trim();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value;
        const btn = $('#signup-submit');
        const alert = $('#auth-alert');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Creating account...';
        alert.className = 'auth-alert';
        alert.style.display = 'none';

        try {
            await authService.signUp(email, password, name);
            const uid = authService.getUid();
            // Set profile
            storage.updateProfile({ name, joinDate: new Date().toISOString() });
            if (uid) {
                await firestoreService.saveUserProfile(uid, {
                    name, email,
                    profile: storage.getProfile(),
                    progress: {},
                    enrollments: {},
                    submissions: {},
                    notes: {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            localStorage.setItem('procode_user_name', name);
            await startMainApp();
            window.location.hash = '/';
        } catch (err) {
            alert.className = 'auth-alert error visible';
            alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code)}`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
        }
    });

    // Google sign-up
    $('#google-signup-btn').addEventListener('click', async () => {
        const alert = $('#auth-alert');
        try {
            await authService.signInWithGoogle();
            const uid = authService.getUid();
            const name = authService.getDisplayName();
            if (uid) {
                storage.updateProfile({ name });
                await firestoreService.syncLocalToCloud(uid, {
                    profile: storage.getProfile(),
                    progress: storage.getProgress(),
                    enrollments: storage.getEnrollments(),
                    submissions: storage.getSubmissions(),
                    notes: storage._get('notes') || {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
            window.location.hash = '/';
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                alert.className = 'auth-alert error visible';
                alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code)}`;
            }
        }
    });
}

function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// ══════════════════════════════════════════════
// WELCOME ONBOARDING
// ══════════════════════════════════════════════

function showWelcomeModel() {
    const app = $('#app');
    if (localStorage.getItem('procode_onboarding_done') === 'true') return;

    let slide = 0;
    const slides = [
        {
            icon: '<i class="fa-solid fa-code fa-3x"></i>',
            title: "Unlock Your Potential",
            text: "Welcome to ProCode EduPulse. Journey from a beginner to an expert web developer with our immersive, interactive curriculum."
        },
        {
            icon: '<i class="fa-solid fa-laptop-code fa-3x"></i>',
            title: "Browser-Based IDE",
            text: "No setup required. Write, test, and preview real code directly in your browser with our integrated development environment."
        },
        {
            icon: '<i class="fa-solid fa-bolt fa-3x"></i>',
            title: "Build & Showcase",
            text: "Complete hands-on projects, earn gems, and automatically build a professional portfolio to show off your new skills."
        }
    ];

    function renderSlide() {
        const s = slides[slide];
        const isLast = slide === slides.length - 1;
        
        app.innerHTML = `
      <style>
        @keyframes wizFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wizFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
        @keyframes wizSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .wizard-container { flex-direction: column !important; }
          .wizard-left { padding: 2rem !important; }
          .wizard-right { padding: 2rem !important; }
        }
      </style>
      <div class="wizard-overlay" style="position:fixed;inset:0;z-index:9999;background:rgba(15,15,26,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;animation:wizFadeIn 0.5s ease-out;">
        <div class="wizard-container" style="display:flex;width:90%;max-width:1100px;min-height:600px;background:var(--bg-card);border:1px solid rgba(255,255,255,0.1);border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            
            <div class="wizard-left" style="flex:1;background:linear-gradient(135deg, var(--brand-primary) 0%, #302b63 100%);padding:var(--space-10);display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;">
                <!-- Decorative elements -->
                <div style="position:absolute;top:-50px;left:-50px;width:200px;height:200px;background:rgba(255,255,255,0.1);border-radius:50%;filter:blur(40px);pointer-events:none;"></div>
                <div style="position:absolute;bottom:-100px;right:-50px;width:300px;height:300px;background:rgba(0,0,0,0.2);border-radius:50%;filter:blur(50px);pointer-events:none;"></div>
                
                <div style="position:relative;z-index:1;">
                    <h1 style="font-size:3.5rem;font-weight:800;color:white;line-height:1.2;margin-bottom:var(--space-6);letter-spacing:-1px;">Start Building<br/><span style="color:#a8c0ff;">The Future.</span></h1>
                    <p style="font-size:1.1rem;color:rgba(255,255,255,0.8);max-width:400px;line-height:1.6;">Join our fast-growing community of learners mastering the art of coding, one line at a time.</p>
                </div>
            </div>

            <div class="wizard-right" style="flex:1;background:var(--bg-secondary);padding:var(--space-10);display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;">
                <div style="width:100%;max-width:400px;">
                    <div class="wizard-dots" style="display:flex;gap:8px;margin-bottom:var(--space-10);justify-content:center;">
                        ${slides.map((_, i) => `<div style="width:${i === slide ? '24px' : '8px'};height:8px;border-radius:4px;background:${i === slide ? 'var(--brand-primary)' : 'var(--border-subtle)'};transition:all 0.3s ease;"></div>`).join('')}
                    </div>
                    
                    <div class="wizard-slide" style="text-align:center;animation:wizSlideUp 0.5s ease-out;">
                        <div style="width:80px;height:80px;background:rgba(108,92,231,0.1);color:var(--brand-primary);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-6);box-shadow:inset 0 0 0 1px rgba(108,92,231,0.2);">
                            ${s.icon}
                        </div>
                        <h2 style="font-size:2rem;font-weight:700;margin-bottom:var(--space-4);color:var(--text-primary);">${s.title}</h2>
                        <p style="color:var(--text-secondary);font-size:1.1rem;line-height:1.6;margin-bottom:var(--space-8);">
                            ${s.text}
                        </p>

                        ${isLast ? `
                        <div style="text-align:left;margin-bottom:var(--space-8);">
                            <label style="display:block;margin-bottom:8px;font-size:0.9rem;color:var(--text-muted);font-weight:500;">How should we address you?</label>
                            <div style="position:relative;">
                                <i class="fa-solid fa-user" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-muted);"></i>
                                <input id="welcome-name" class="input" style="width:100%;padding:14px 16px 14px 48px;font-size:1.05rem;background:var(--bg-input);border:2px solid transparent;border-radius:12px;transition:all 0.2s;outline:none;" placeholder="John Doe" type="text" autocomplete="off" />
                            </div>
                        </div>
                        ` : ''}

                        <div style="display:flex;gap:var(--space-4);width:100%;">
                            ${slide > 0 ? `<button id="welcome-prev" class="btn btn-ghost" style="padding:12px 24px;border-radius:12px;font-weight:600;">Back</button>` : ''}
                            <button id="welcome-next" class="btn btn-primary" style="flex:1;padding:14px 0;font-size:1.1rem;border-radius:12px;font-weight:600;box-shadow:0 8px 16px rgba(108,92,231,0.25);transition:transform 0.2s, box-shadow 0.2s;">
                                ${isLast ? 'Enter Platform <i class="fa-solid fa-arrow-right" style="margin-left:8px;"></i>' : 'Continue <i class="fa-solid fa-arrow-right" style="margin-left:8px;"></i>'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
        `;

        const input = document.getElementById('welcome-name');
        if (input) {
            input.addEventListener('focus', () => input.style.borderColor = 'var(--brand-primary)');
            input.addEventListener('blur', () => input.style.borderColor = 'transparent');
            input.focus();
        }

        const next = $('#welcome-next');
        const prev = $('#welcome-prev');

        if (prev) {
            prev.onclick = () => { slide--; renderSlide(); };
        }

        next.onclick = async () => {
            if (isLast) {
                const name = $('#welcome-name')?.value?.trim();
                if (name) {
                    localStorage.setItem('procode_user_name', name);
                    storage.updateProfile({ name });
                    const uid = authService.getUid();
                    if (uid) {
                        await authService.updateDisplayName(name);
                        await firestoreService.saveUserProfile(uid, { name });
                    }
                }
                localStorage.setItem('procode_onboarding_done', 'true');
                
                const overlay = app.querySelector('.wizard-overlay');
                overlay.style.animation = 'wizFadeOut 0.4s ease-in forwards';
                setTimeout(async () => {
                    await startMainApp();
                }, 400);
            } else {
                slide++;
                renderSlide();
            }
        };
    }

    renderSlide();
}

// ══════════════════════════════════════════════
// PAGE RENDERERS
// ══════════════════════════════════════════════

function renderLanding() {
    const app = $('#app');
    const base = getBasePath();
    const totalLessons = coursesData.reduce((sum, c) => sum + c.totalLessons, 0);
    const userName = authService.getDisplayName();

    app.innerHTML = `
    <section class="hero bg-dots-pattern">
      <div class="container flex items-center">
        <div class="hero-content">
          <div class="hero-badge">
            <i class="fa-solid fa-rocket"></i> Learn to Code, Build Real Projects
          </div>
          <h1 class="hero-title">
            ${userName !== 'Student' ? `Hey ${userName}! ` : ''}Master Web Development with
            <span class="text-gradient">ProCode</span>
          </h1>
          <p class="hero-subtitle">
            Transform from a passive YouTube viewer into an active developer. 
            Structured courses, interactive coding challenges, and AI-powered assistance — all in one platform.
          </p>
          <div class="hero-actions">
            <a href="#/courses" class="btn btn-primary btn-lg">
              Start Learning <i class="fa-solid fa-arrow-right"></i>
            </a>
            <a href="#/portfolio" class="btn btn-outline btn-lg">
              View Portfolio
            </a>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-code-card">
            <div class="code-window-dots">
              <span></span><span></span><span></span>
            </div>
            <pre class="hero-code"><span class="comment">// Your coding journey starts here</span>
<span class="keyword">const</span> <span class="function">student</span> = {
  <span class="attr">name</span>: <span class="string">"${userName}"</span>,
  <span class="attr">level</span>: <span class="string">"Beginner → Pro"</span>,
  <span class="attr">skills</span>: [<span class="string">"HTML"</span>, <span class="string">"CSS"</span>, <span class="string">"JS"</span>],
  <span class="attr">projects</span>: <span class="function">portfolio</span>.<span class="function">getAll</span>()
};

<span class="keyword">function</span> <span class="function">startLearning</span>() {
  <span class="keyword">return</span> <span class="string">"Let's build!"</span>;
}</pre>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-bar" data-animate>
      <div class="stat-item">
        <div class="stat-number">${coursesData.length}</div>
        <div class="stat-label">Courses</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${totalLessons}+</div>
        <div class="stat-label">Lessons</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">∞</div>
        <div class="stat-label">Practice Problems</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">AI</div>
        <div class="stat-label">Powered Hints</div>
      </div>
    </section>

    <section class="features-section" data-animate>
      <div class="container">
        <div class="section-header">
          <span class="section-badge"><i class="fa-solid fa-sparkles"></i> Features</span>
          <h2 class="section-title">Everything You Need to Learn Code</h2>
          <p class="section-subtitle">A complete ecosystem designed for aspiring developers</p>
        </div>

        <div class="features-grid">
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-brands fa-youtube"></i></div>
            <h3 class="feature-title">YouTube Integration</h3>
            <p class="feature-desc">Watch lessons with YouTube videos embedded alongside notes, cheat sheets, and downloadable resources.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-solid fa-laptop-code"></i></div>
            <h3 class="feature-title">Interactive Code Editor</h3>
            <p class="feature-desc">Write and preview HTML/CSS/JS directly in the browser with syntax highlighting and live preview.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-solid fa-chart-bar"></i></div>
            <h3 class="feature-title">Progress Tracking</h3>
            <p class="feature-desc">Visual progress bars, completion tracking, and quiz scores saved across sessions.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-solid fa-bullseye"></i></div>
            <h3 class="feature-title">Coding Challenges</h3>
            <p class="feature-desc">Automated validation checks your code in real-time. Pass challenges to unlock the next lesson.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-solid fa-robot"></i></div>
            <h3 class="feature-title">AI-Powered Hints</h3>
            <p class="feature-desc">Stuck? Get context-aware hints from an AI tutor that guides you without giving away the answer.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon"><i class="fa-solid fa-folder-open"></i></div>
            <h3 class="feature-title">Project Portfolio</h3>
            <p class="feature-desc">Every completed challenge builds your portfolio. Download your work as a ZIP or preview it live.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="courses-section" data-animate>
      <div class="container">
        <div class="section-header">
          <span class="section-badge"><i class="fa-solid fa-book-open"></i> Courses</span>
          <h2 class="section-title">Start Your Learning Path</h2>
          <p class="section-subtitle">Structured courses from beginner to advanced</p>
        </div>

        <div class="grid grid-3 gap-6">
          ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        const avgRating = storage.getCourseAverageRating(course.id);
        const reviews = storage.getReviews(course.id);
        const isEnrolled = storage.isEnrolled(course.id);
        return `
            <div class="course-card" data-animate onclick="location.hash='/course/${course.id}'">
              ${course.thumbnail ? `<div class="course-thumb"><img src="${base}${course.thumbnail}" alt="${course.title}" onerror="this.parentElement.innerHTML='<div class=\\'course-thumb-placeholder\\'><i class=\\'${course.icon}\\'></i></div>'"></div>` : `<div class="course-thumb-placeholder"><i class="${course.icon}"></i></div>`}
              <div class="course-body">
                <div class="course-meta">
                  <span class="badge badge-primary">${course.difficulty}</span>
                  ${percent === 100 ? '<span class="badge badge-success" style="margin-left:8px"><i class="fa-solid fa-check"></i> Completed</span>' : `<span class="text-sm text-muted">${course.estimatedHours}h estimated</span>`}
                </div>
                <h3 class="course-title">${course.title}</h3>
                ${avgRating > 0 ? `
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);font-size:var(--text-sm)">
                  <div style="display:flex;gap:2px">${Array(5).fill(0).map((_, i) => `<i class="${i < Math.round(avgRating) ? 'fa-solid' : 'fa-regular'} fa-star" style="color:#f1c40f;font-size:0.75rem"></i>`).join('')}</div>
                  <span style="font-weight:600;color:var(--text-primary)">${avgRating}</span>
                  <span style="color:var(--text-muted)">(${reviews.length})</span>
                </div>
                ` : ''}
                <p class="course-desc">${course.description}</p>
                ${percent > 0 && percent < 100 ? `
                <div style="margin-bottom:var(--space-3)">
                  <div class="progress-track" style="height:4px">
                    <div class="progress-fill" style="width:${percent}%"></div>
                  </div>
                  <span class="text-sm text-muted">${percent}% complete</span>
                </div>
                ` : ''}
                <div class="course-footer">
                  <span class="course-lessons-count"><i class="fa-solid fa-book"></i> ${course.totalLessons} lessons</span>
                  ${percent === 100 ? '<span class="btn btn-sm btn-ghost text-success">Review <i class="fa-solid fa-rotate-right"></i></span>' : (isEnrolled ? '<span class="btn btn-sm btn-primary">Continue <i class="fa-solid fa-play"></i></span>' : '<span class="btn btn-sm btn-ghost">Start <i class="fa-solid fa-arrow-right"></i></span>')}
                </div>
              </div>
            </div>
            `;
    }).join('')}
        </div>
      </div>
    </section>

    <section class="cta-section" data-animate>
      <div class="container">
        <div class="cta-card">
          <h2 class="cta-title">Ready to Start Your <span class="text-gradient">Coding Journey</span>?</h2>
          <p class="cta-text">Jump in and start building real projects today. No setup required — everything runs in your browser.</p>
          <a href="#/courses" class="btn btn-primary btn-lg" style="position:relative;z-index:1">
            Get Started for Free <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="${base}logo.png" alt="ProCode" onerror="this.style.display='none'">
              <span><span style="color:var(--brand-primary-light)">Pro</span>Code</span>
            </div>
            <p class="footer-desc">
              Transform from a YouTube viewer into a confident developer with structured courses, 
              interactive challenges, and AI-powered guidance.
            </p>
          </div>
          <div class="footer-column">
            <h4>Platform</h4>
            <div class="footer-links">
              <a href="#/courses">Courses</a>
              <a href="#/portfolio">Portfolio</a>
              <a href="#/profile">Profile</a>
            </div>
          </div>
          <div class="footer-column">
            <h4>Resources</h4>
            <div class="footer-links">
              <a href="https://developer.mozilla.org" target="_blank">MDN Docs</a>
              <a href="https://www.w3schools.com" target="_blank">W3Schools</a>
              <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank">GitHub</a>
            </div>
          </div>
          <div class="footer-column">
            <h4>Connect</h4>
            <div class="footer-links">
              <a href="https://youtube.com/@procode4u" target="_blank"><i class="fa-brands fa-youtube"></i> @procode4u</a>
              <a href="https://github.com/soghayarmahmoud" target="_blank"><i class="fa-brands fa-github"></i> GitHub</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ProCode EduPulse. Built with <i class="fa-solid fa-heart" style="color:var(--color-error)"></i> for learners.</span>
          <div class="footer-social">
            <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank" title="GitHub"><i class="fa-brands fa-github"></i></a>
            <a href="https://youtube.com/@procode4u" target="_blank" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
          </div>
        </div>
      </div>
    </footer>
  `;

    animateOnScroll();
}

function renderCoursesPage() {
    const app = $('#app');
    const base = getBasePath();

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left;margin-bottom:var(--space-10)">
          <span class="section-badge"><i class="fa-solid fa-book-open"></i> All Courses</span>
          <h1 class="section-title">Course Catalog</h1>
          <p class="section-subtitle" style="margin:0">Choose a course and start your learning journey</p>
        </div>

        <div class="grid grid-3 gap-6">
          ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        const avgRating = storage.getCourseAverageRating(course.id);
        const reviews = storage.getReviews(course.id);
        const isEnrolled = storage.isEnrolled(course.id);
        return `
            <div class="course-card" onclick="location.hash='/course/${course.id}'" data-animate>
              ${course.thumbnail ? `<div class="course-thumb"><img src="${base}${course.thumbnail}" alt="${course.title}" onerror="this.parentElement.innerHTML='<div class=\\'course-thumb-placeholder\\'><i class=\\'${course.icon}\\'></i></div>'"></div>` : `<div class="course-thumb-placeholder"><i class="${course.icon}"></i></div>`}
              <div class="course-body">
                <div class="course-meta">
                  <span class="badge badge-primary">${course.difficulty}</span>
                  ${percent === 100 ? '<span class="badge badge-success" style="margin-left:8px"><i class="fa-solid fa-check"></i> Completed</span>' : `<span class="text-sm text-muted">${course.estimatedHours}h</span>`}
                </div>
                <h3 class="course-title">${course.title}</h3>
                ${avgRating > 0 ? `
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);font-size:var(--text-sm)">
                  <div style="display:flex;gap:2px">${Array(5).fill(0).map((_, i) => `<i class="${i < Math.round(avgRating) ? 'fa-solid' : 'fa-regular'} fa-star" style="color:#f1c40f;font-size:0.75rem"></i>`).join('')}</div>
                  <span style="font-weight:600;color:var(--text-primary)">${avgRating}</span>
                  <span style="color:var(--text-muted)">(${reviews.length})</span>
                </div>
                ` : ''}
                <p class="course-desc">${course.description}</p>
                ${percent > 0 && percent < 100 ? `
                <div style="margin-bottom:var(--space-3)">
                  <div class="progress-track" style="height:4px">
                    <div class="progress-fill" style="width:${percent}%"></div>
                  </div>
                  <span class="text-sm text-muted">${percent}% complete</span>
                </div>` : ''}
                <div class="course-footer">
                  <span class="course-lessons-count"><i class="fa-solid fa-book"></i> ${course.totalLessons} lessons</span>
                  ${percent === 100 ? '<span class="btn btn-sm btn-ghost text-success">Review <i class="fa-solid fa-rotate-right"></i></span>' : (isEnrolled ? `<span class="btn btn-sm btn-primary">Continue <i class="fa-solid fa-play"></i></span>` : `<span class="btn btn-sm btn-primary">Start <i class="fa-solid fa-arrow-right"></i></span>`)}
                </div>
              </div>
            </div>`;
    }).join('')}
        </div>
      </div>
    </div>
  `;

    animateOnScroll();
}

async function renderCourse(params) {
    const app = $('#app');
    const base = getBasePath();
    const course = coursesData.find(c => c.id === params.courseId);
    
    if (!course) {
        app.innerHTML = '<div class="container" style="padding:var(--space-16)"><h1>Course not found</h1><a href="#/courses"><i class="fa-solid fa-arrow-left"></i> Back to courses</a></div>';
        return;
    }

    const courseLessons = lessonsData.filter(l => l.courseId === course.id).sort((a, b) => a.order - b.order);
    const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
    const isEnrolled = storage.isEnrolled(course.id);
    const isCompleted = percent === 100;
    
    // Find the next lesson to continue with
    const nextLessonToLearn = courseLessons.find(l => !storage.isLessonCompleted(course.id, l.id)) || courseLessons[0];
    const continueUrl = `#/lesson/${course.id}/${nextLessonToLearn.id}`;
    
    // Fetch reviews
    const { firestoreService } = await import('./services/firestore-service.js');
    let reviews = await firestoreService.getCourseReviews(course.id);
    
    // Fallback to local
    if (reviews.length === 0) {
        reviews = storage.getReviews(course.id);
    }

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); max-width:800px;">
        
        <!-- Course Meta Header -->
        <div style="margin-bottom:var(--space-8); text-align:center;">
          <div class="avatar avatar-lg" style="margin: 0 auto var(--space-4); background:var(--bg-tertiary); color:var(--brand-primary); font-size:3rem; width:100px; height:100px;">
            <i class="${course.icon}"></i>
          </div>
          <span class="badge ${isCompleted ? 'badge-success' : 'badge-primary'}" style="margin-bottom:var(--space-4)">
            ${isCompleted ? '<i class="fa-solid fa-check"></i> Course Completed' : isEnrolled ? 'In Progress' : course.difficulty}
          </span>
          <h1 style="font-size:2.5rem; margin-bottom:var(--space-2)">${course.title}</h1>
          <p class="text-muted" style="font-size:1.1rem; max-width:600px; margin:0 auto;">${course.description}</p>
        </div>

        <!-- Progress Overview -->
        ${isEnrolled ? `
        <div class="card" style="margin-bottom:var(--space-8);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
            <h3 style="font-size:var(--text-md)"><i class="fa-solid fa-chart-line"></i> Your Progress</h3>
            <span style="font-weight:bold; color:var(--brand-primary);">${percent}%</span>
          </div>
          <div class="progress-track" style="height:8px; border-radius:4px; overflow:hidden;">
             <div class="progress-fill" style="width:${percent}%; background:var(--brand-primary); box-shadow:0 0 10px var(--brand-primary-light);"></div>
          </div>
        </div>
        ` : ''}

        <!-- Course Syllabus -->
        <div class="card" style="margin-bottom:var(--space-8);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
            <h3 style="font-size:var(--text-lg)"><i class="fa-solid fa-list-ol"></i> Curriculum Overview</h3>
            <span class="text-sm text-muted">${course.totalLessons} Lessons</span>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:var(--space-3);">
            ${courseLessons.map((lesson, idx) => {
              const lessonCompleted = storage.isLessonCompleted(course.id, lesson.id);
              return `
              <a href="#/lesson/${course.id}/${lesson.id}" class="card-glass" style="display:flex; align-items:center; padding:var(--space-4); text-decoration:none; color:inherit; transition:transform 0.2s border-color 0.2s;">
                <div style="width:32px; height:32px; border-radius:50%; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center; margin-right:var(--space-4); flex-shrink:0;">
                  ${lessonCompleted ? '<i class="fa-solid fa-check" style="color:var(--color-success)"></i>' : `<span style="font-weight:600; font-size:0.9rem;">${idx + 1}</span>`}
                </div>
                <div style="flex:1;">
                  <h4 style="font-size:1rem; margin-bottom:4px; ${lessonCompleted ? 'color:var(--text-primary);' : ''}">${lesson.title}</h4>
                  <div style="font-size:0.8rem; color:var(--text-muted); display:flex; gap:12px;">
                    <span>${lesson.type === 'theory' ? '<i class="fa-solid fa-book"></i> Theory' : lesson.type === 'practice' ? '<i class="fa-solid fa-laptop-code"></i> Practice' : '<i class="fa-solid fa-bullseye"></i> Challenge'}</span>
                    <span><i class="fa-regular fa-clock"></i> ${lesson.duration || 'N/A'}</span>
                  </div>
                </div>
                <div style="color:var(--text-muted);">
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </a>`;
            }).join('')}
          </div>
          
          <div style="margin-top:var(--space-6); text-align:center;">
            ${isEnrolled ? 
              `<a href="${continueUrl}" class="btn btn-primary btn-lg" style="width:100%">${isCompleted ? 'Review Material <i class="fa-solid fa-rotate-right"></i>' : 'Continue Learning <i class="fa-solid fa-play"></i>'}</a>` :
              `<button id="enroll-course-btn" class="btn btn-primary btn-lg" style="width:100%">Enroll in Course <i class="fa-solid fa-user-plus"></i></button>`
            }
          </div>
        </div>

        <!-- Course Reviews -->
        <div class="card">
          <h3 style="font-size:var(--text-lg); margin-bottom:var(--space-6);"><i class="fa-solid fa-star"></i> Student Reviews</h3>
          
          ${isEnrolled ? `
          <div class="review-form-container" style="margin-bottom:var(--space-8); padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md);">
            <h4 style="margin-bottom:var(--space-3); font-size:var(--text-sm);">Leave a Review</h4>
            <div style="display:flex; gap:10px; margin-bottom:var(--space-3);" id="review-stars-input">
                <i class="fa-regular fa-star cursor-pointer star-input" data-rating="1"></i>
                <i class="fa-regular fa-star cursor-pointer star-input" data-rating="2"></i>
                <i class="fa-regular fa-star cursor-pointer star-input" data-rating="3"></i>
                <i class="fa-regular fa-star cursor-pointer star-input" data-rating="4"></i>
                <i class="fa-regular fa-star cursor-pointer star-input" data-rating="5"></i>
            </div>
            <textarea id="review-text-input" class="input textarea" placeholder="What did you think of the course?" rows="3" style="width:100%; margin-bottom:var(--space-4);"></textarea>
            <button id="submit-review-btn" class="btn btn-primary btn-sm">Submit Review</button>
            <input type="hidden" id="current-rating" value="0">
          </div>
          ` : `<div style="text-align:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); margin-bottom:var(--space-8); font-size:0.9rem; color:var(--text-muted);">Enroll in this course to leave a review.</div>`}
          
          <div id="reviews-list" style="display:flex; flex-direction:column; gap:var(--space-4);">
            ${reviews.length > 0 ? reviews.map(r => {
              const userReaction = storage.getUserReaction(course.id, r.id, authService.getDisplayName());
              return `
                <div class="review-card" data-review-id="${r.id}" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:var(--space-5); transition:all 0.2s;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:var(--space-4)">
                       <div style="display:flex; align-items:center; gap:var(--space-3); flex:1;">
                           <div class="avatar avatar-lg" style="background:var(--brand-gradient); color:#fff; font-weight:600; font-size:1.2rem; width:48px; height:48px; display:flex; align-items:center; justify-content:center; border-radius:50%;">
                               ${(r.userName || 'U')[0].toUpperCase()}
                           </div>
                           <div style="flex:1;">
                               <div style="font-weight:700; font-size:var(--text-base); color:var(--text-primary); margin-bottom:4px">${r.userName || 'Anonymous'}</div>
                               <div style="display:flex; align-items:center; gap:var(--space-3); font-size:0.85rem; color:var(--text-muted);">
                                   <div style="display:flex; gap:2px;">${Array(5).fill(0).map((_, i) => `<i class="${i < r.rating ? 'fa-solid' : 'fa-regular'} fa-star" style="color:#f1c40f; font-size:0.8rem;"></i>`).join('')}</div>
                                   <span>${new Date(r.createdAt).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}</span>
                               </div>
                           </div>
                       </div>
                    </div>
                    <p style="font-size:1rem; color:var(--text-secondary); line-height:1.6; margin:0 0 var(--space-4) 0; word-wrap:break-word;">"${r.text}"</p>
                    <div style="display:flex; gap:var(--space-2); padding-top:var(--space-3); border-top:1px solid var(--border-subtle); flex-wrap:wrap;">
                        <button class="reaction-btn like-btn" data-course-id="${course.id}" data-review-id="${r.id}" data-reaction="like" style="display:flex; align-items:center; gap:6px; padding:8px 12px; background:${userReaction === 'like' ? 'rgba(108, 92, 231, 0.15)' : 'var(--bg-tertiary)'}; border:1px solid var(--border-subtle); border-radius:20px; cursor:pointer; font-size:0.9rem; transition:all 0.2s; color:${userReaction === 'like' ? 'var(--brand-primary)' : 'var(--text-secondary)'};">
                            <span>👍</span>
                            <span style="font-size:0.8rem; font-weight:600">${(r.reactions?.like?.length || 0)}</span>
                        </button>
                        <button class="reaction-btn love-btn" data-course-id="${course.id}" data-review-id="${r.id}" data-reaction="love" style="display:flex; align-items:center; gap:6px; padding:8px 12px; background:${userReaction === 'love' ? 'rgba(255, 107, 107, 0.15)' : 'var(--bg-tertiary)'}; border:1px solid var(--border-subtle); border-radius:20px; cursor:pointer; font-size:0.9rem; transition:all 0.2s; color:${userReaction === 'love' ? '#ff6b6b' : 'var(--text-secondary)'};">
                            <span>❤️</span>
                            <span style="font-size:0.8rem; font-weight:600">${(r.reactions?.love?.length || 0)}</span>
                        </button>
                        <button class="reaction-btn helpful-btn" data-course-id="${course.id}" data-review-id="${r.id}" data-reaction="helpful" style="display:flex; align-items:center; gap:6px; padding:8px 12px; background:${userReaction === 'helpful' ? 'rgba(255, 193, 7, 0.15)' : 'var(--bg-tertiary)'}; border:1px solid var(--border-subtle); border-radius:20px; cursor:pointer; font-size:0.9rem; transition:all 0.2s; color:${userReaction === 'helpful' ? '#ffc107' : 'var(--text-secondary)'};">
                            <span>🔥</span>
                            <span style="font-size:0.8rem; font-weight:600">${(r.reactions?.helpful?.length || 0)}</span>
                        </button>
                    </div>
                    <div class="review-replies" style="margin-top:var(--space-4); padding-left:var(--space-4); border-left:2px solid var(--border-subtle);">
                      ${r.replies && r.replies.length > 0 ? r.replies.map(reply => `
                            <div class="reply-item" data-reply-id="${reply.id}" style="margin-bottom:var(--space-3);">
                               <div style="display:flex; align-items:center; gap:var(--space-2); font-size:0.85rem; color:var(--text-muted);">
                                   <span style="font-weight:600;color:var(--text-primary)">${reply.userName}</span>
                                   <span>${new Date(reply.createdAt).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}</span>
                               </div>
                               <p style="margin:4px 0 0 0; color:var(--text-secondary);">${reply.text}</p>
                            </div>
                          `).join('') : ''}
                    </div>
                    <div class="reply-form" data-review-id="${r.id}" style="margin-top:var(--space-4);">
                      <textarea class="input textarea reply-text" rows="2" placeholder="Write a reply..." style="width:100%;"></textarea>
                      <button class="btn btn-sm btn-outline reply-submit" style="margin-top:var(--space-2);">Reply</button>
                    </div>
                </div>
            `}).join('') : '<div class="text-center" style="padding:var(--space-8); background:var(--bg-input); border-radius:var(--radius-lg); border: 1px dashed var(--border-subtle);"><i class="fa-regular fa-comments text-muted" style="font-size:2rem; margin-bottom:var(--space-3);"></i><p class="text-muted" style="margin:0;">No reviews yet. Be the first to share your thoughts!</p></div>'}
          </div>
        </div>

      </div>
    </div>`;

    // Attach Review Handlers
    if (isEnrolled) {
        const stars = app.querySelectorAll('.star-input');
        const ratingInput = document.getElementById('current-rating');
        const textInput = document.getElementById('review-text-input');
        const submitBtn = document.getElementById('submit-review-btn');

        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const r = parseInt(e.target.dataset.rating, 10);
                ratingInput.value = r;
                stars.forEach(s => {
                    const sr = parseInt(s.dataset.rating, 10);
                    s.className = `${sr <= r ? 'fa-solid' : 'fa-regular'} fa-star cursor-pointer star-input`;
                    s.style.color = sr <= r ? '#f1c40f' : '';
                });
            });
        });

        submitBtn?.addEventListener('click', async () => {
            const rating = parseInt(ratingInput.value, 10);
            const text = textInput.value.trim();
            const userName = authService.getDisplayName();

            if (rating === 0) return showToast('Please select a star rating.', 'error');
            if (!text) return showToast('Please write a review.', 'error');

            const updatedReviews = storage.saveReview(course.id, rating, text, userName);
             const myReview = updatedReviews.find(r => r.userName === userName);
            
             if (myReview) {
                 await firestoreService.saveReview(course.id, myReview);
             }

            showToast('Review submitted successfully!', 'success');
            renderCourse(params); // re-render to show new review
        });

        // Attach Reaction Handlers
        const reactionBtns = app.querySelectorAll('.reaction-btn');
        reactionBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const courseId = btn.dataset.courseId;
                const reviewId = btn.dataset.reviewId;
                const reactionType = btn.dataset.reaction;
                const userName = authService.getDisplayName();
                const currentReaction = storage.getUserReaction(courseId, reviewId, userName);

                // Toggle reaction
                if (currentReaction === reactionType) {
                    storage.removeReaction(courseId, reviewId, reactionType, userName);
                } else {
                    storage.addReaction(courseId, reviewId, reactionType, userName);
                }

                // Sync to Firestore
                const reviews = storage.getReviews(courseId);
                const review = reviews.find(r => r.id === reviewId);
                if (review) {
                    await firestoreService.saveReview(courseId, review);
                }

                // Re-render course to show updated reactions
                renderCourse(params);
            });
        });

        // Attach Reply Handlers
        const replyForms = app.querySelectorAll('.reply-form');
        replyForms.forEach(form => {
            const reviewId = form.dataset.reviewId;
            const textarea = form.querySelector('.reply-text');
            const btn = form.querySelector('.reply-submit');
            btn.addEventListener('click', async () => {
                const text = textarea.value.trim();
                const userName = authService.getDisplayName();
                if (!text) return;
                const reply = storage.addReply(course.id, reviewId, userName, text);
                if (reply) {
                    await firestoreService.addReply(course.id, reviewId, reply);
                }
                renderCourse(params);
            });
        });
    }

    // Attach Enrollment Handler
    const enrollBtn = document.getElementById('enroll-course-btn');
    if (enrollBtn) {
        enrollBtn.addEventListener('click', async () => {
             const user = authService.getCurrentUser();
             if (!user) {
                 window.location.hash = '/login';
                 showToast('Please sign in to enroll in this course.', 'info');
                 return;
             }
             
             enrollBtn.disabled = true;
             enrollBtn.innerHTML = '<div class="spinner-sm"></div> Enrolling...';
             
             storage.enrollCourse(course.id);
             
             await firestoreService.syncLocalToCloud(user.uid, {
                 enrollments: storage.getEnrollments()
             });
             
             showToast('Successfully enrolled in the course!', 'success');
             renderCourse(params);
        });
    }
}

async function renderLesson(params) {
    const { courseId, lessonId } = params;
    const course = coursesData.find(c => c.id === courseId);
    const lesson = lessonsData.find(l => l.id === lessonId);

    if (!course || !lesson) {
        $('#app').innerHTML = '<div class="container" style="padding:var(--space-16)"><h1>Lesson not found</h1><a href="#/courses"><i class="fa-solid fa-arrow-left"></i> Back to courses</a></div>';
        return;
    }

    const courseLessons = lessonsData.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
    const currentIndex = courseLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;
    const isCompleted = storage.isLessonCompleted(courseId, lessonId);

    const lessonTypeIcon = lesson.type === 'theory' ? '<i class="fa-solid fa-book"></i> Theory' : lesson.type === 'practice' ? '<i class="fa-solid fa-laptop-code"></i> Practice' : '<i class="fa-solid fa-bullseye"></i> Project';

    const app = $('#app');
    app.innerHTML = `
    <div class="lesson-layout">
      <aside class="course-sidebar" id="course-sidebar"></aside>
      
      <main class="lesson-main">
        <div class="lesson-header">
          <div class="lesson-breadcrumb">
            <a href="#/courses">Courses</a>
            <span>›</span>
            <a href="#/course/${courseId}">${course.title}</a>
            <span>›</span>
            <span style="color:var(--text-primary)">${lesson.title}</span>
          </div>
          <h1 class="lesson-title">${lesson.title}</h1>
          <div class="lesson-meta">
            <span class="lesson-meta-item">${lessonTypeIcon}</span>
            <span class="lesson-meta-item"><i class="fa-regular fa-clock"></i> ${lesson.duration || 'N/A'}</span>
            <span class="lesson-meta-item" id="lesson-status-badge">
              ${isCompleted ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Completed</span>' : '<span class="badge badge-warning">In Progress</span>'}
            </span>
          </div>
        </div>

        <div class="split-view">
          <!-- Video + Tabs -->
          <div class="video-section">
            <div class="video-container">
              <div id="yt-player"></div>
            </div>
            
            <div class="content-tabs-container">
              <div class="content-tabs">
                <div class="content-tab active" data-tab="notes"><i class="fa-solid fa-book"></i> Lesson Notes</div>
                <div class="content-tab" data-tab="cheatsheet"><i class="fa-solid fa-clipboard"></i> Cheat Sheet</div>
                <div class="content-tab" data-tab="resources"><i class="fa-solid fa-link"></i> Resources</div>
              </div>
              <div class="content-tab-panel active" data-panel="notes">
                <div class="lesson-notes-content">${lesson.content}</div>
              </div>
              <div class="content-tab-panel" data-panel="cheatsheet">
                <div class="lesson-notes-content">
                  ${lesson.cheatSheet ? `<pre style="white-space:pre-wrap">${lesson.cheatSheet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : '<p class="text-muted">No cheat sheet available for this lesson.</p>'}
                </div>
              </div>
              <div class="content-tab-panel" data-panel="resources">
                ${lesson.resources && lesson.resources.length > 0 ? `
                  <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                    ${lesson.resources.map(r => `
                      <a href="${r.url}" target="_blank" class="card" style="padding:var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
                        <i class="fa-solid fa-link"></i>
                        <span>${r.name}</span>
                        <span style="margin-left:auto;color:var(--text-muted)"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                      </a>
                    `).join('')}
                  </div>
                ` : '<p class="text-muted">No external resources for this lesson.</p>'}
              </div>
            </div>
          </div>

          <!-- Code Editor + Preview -->
          <div class="editor-section">
            <div class="editor-wrapper">
              <div class="editor-header">
                <div class="editor-tabs">
                  <span class="editor-tab active">index.html</span>
                </div>
                <div class="editor-actions">
                  <button class="editor-action-btn" id="lesson-run-code"><i class="fa-solid fa-play"></i> Run</button>
                  <button class="editor-action-btn" id="lesson-reset-code"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                  <button class="editor-action-btn" id="lesson-copy-code"><i class="fa-solid fa-clipboard"></i> Copy</button>
                  <button class="editor-action-btn" id="shortcuts-help-btn" title="Keyboard Shortcuts"><i class="fa-solid fa-keyboard"></i></button>
                  <div class="shortcuts-tooltip" id="shortcuts-tooltip">
                    <div class="shortcuts-tooltip-title"><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</div>
                    <div class="shortcuts-tooltip-row"><kbd>Ctrl+Enter</kbd><span>Run code</span></div>
                    <div class="shortcuts-tooltip-row"><kbd>Ctrl+S</kbd><span>Save (prevented)</span></div>
                    <div class="shortcuts-tooltip-row"><kbd>Ctrl+Shift+C</kbd><span>Copy code</span></div>
                    <div class="shortcuts-tooltip-row"><kbd>Ctrl+Shift+R</kbd><span>Reset code</span></div>
                    <div class="shortcuts-tooltip-row"><kbd>Escape</kbd><span>Close modal/hint</span></div>
                  </div>
                </div>
              </div>
              <div class="editor-body" id="lesson-editor"></div>
            </div>

            <div class="preview-panel">
              <div class="preview-header">
                <span class="preview-title"><i class="fa-solid fa-eye"></i> Live Preview</span>
              </div>
              <iframe class="preview-iframe" id="lesson-preview" sandbox="allow-scripts allow-same-origin" title="Live preview"></iframe>
            </div>
          </div>
        </div>

        <!-- Assessment -->
        <div id="assessment-container"></div>

        <!-- Timestamped Notes -->
        <div id="notes-container"></div>

        <!-- Lesson Navigation -->
        <div class="lesson-nav">
          ${prevLesson ? `
            <a href="#/lesson/${courseId}/${prevLesson.id}" class="lesson-nav-btn">
              <i class="fa-solid fa-arrow-left"></i> ${prevLesson.title}
            </a>
          ` : '<div></div>'}
          
          ${!isCompleted ? `
            <button class="btn btn-primary complete-lesson-btn" id="mark-complete-btn">
              <i class="fa-solid fa-check"></i> Mark as Complete
            </button>
          ` : ''}

          ${nextLesson ? `
            <a href="#/lesson/${courseId}/${nextLesson.id}" class="lesson-nav-btn">
              ${nextLesson.title} <i class="fa-solid fa-arrow-right"></i>
            </a>
          ` : '<div></div>'}
        </div>
      </main>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle"><i class="fa-solid fa-bars"></i></button>
  `;

    // ── Init Sidebar ──
    const { SidebarComponent } = await import('./components/sidebar.js');
    const courseModules = modulesData ? modulesData.filter(m => m.courseId === course.id) : [];
    new SidebarComponent('#course-sidebar', course, courseLessons, lessonId, courseModules);

    // ── Init Video Player ──
    const { VideoPlayer } = await import('./components/video-player.js');
    new VideoPlayer('yt-player', lesson.youtubeId);

    // ── Init Code Editor ──
    const { CodeEditor, updatePreview } = await import('./components/code-editor.js');
    const defaultCode = '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Start coding here...</p>\n</body>\n</html>';

    const editor = new CodeEditor('#lesson-editor', {
        language: 'html',
        initialCode: defaultCode,
        onChange: (code) => updatePreview('#lesson-preview', code)
    });

    setTimeout(() => updatePreview('#lesson-preview', defaultCode), 600);

    // Editor actions
    $('#lesson-run-code')?.addEventListener('click', () => {
        updatePreview('#lesson-preview', editor.getCode());
    });
    $('#lesson-reset-code')?.addEventListener('click', () => {
        editor.setCode(defaultCode);
        updatePreview('#lesson-preview', defaultCode);
    });
    $('#lesson-copy-code')?.addEventListener('click', () => {
        navigator.clipboard.writeText(editor.getCode())
            .then(() => showToast('Copied!', 'success'));
    });

    // ── Init Assessment ──
    if (lesson.assessment) {
        if (lesson.assessment.type === 'quiz' && quizzesData[lesson.assessment.id]) {
            const { QuizComponent } = await import('./components/quiz.js');
            new QuizComponent('#assessment-container', quizzesData[lesson.assessment.id], courseId, lessonId);
        } else if (lesson.assessment.type === 'challenge' && challengesData[lesson.assessment.id]) {
            const { ChallengeComponent } = await import('./components/challenge.js');
            new ChallengeComponent('#assessment-container', challengesData[lesson.assessment.id], courseId, lessonId);
        }
    }

    // ── Init Notes ──
    const { NotesComponent } = await import('./components/notes.js');
    new NotesComponent('#notes-container', lessonId);

    // ── Content Tabs ──
    const contentTabs = app.querySelectorAll('.content-tab');
    const contentPanels = app.querySelectorAll('.content-tab-panel');
    contentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            contentTabs.forEach(t => t.classList.remove('active'));
            contentPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            app.querySelector(`[data-panel="${tab.dataset.tab}"]`)?.classList.add('active');
        });
    });

    // ── Mark Complete ──
    $('#mark-complete-btn')?.addEventListener('click', () => {
        if (!storage.isLessonCompleted(courseId, lessonId)) {
            storage.addGems(10);
            storage.completeLesson(courseId, lessonId);

            // check module completion
            const currentModule = modulesData && modulesData.find(m => m.courseId === courseId && m.lessons.includes(lessonId));
            if (currentModule) {
                const allDone = currentModule.lessons.every(lid => storage.isLessonCompleted(courseId, lid));
                if (allDone) {
                    storage.completeModule(courseId, currentModule.id);
                    showToast(`Module "${currentModule.title}" completed!`, 'success');
                }
            }

            showToast('Lesson marked as complete! +10 Gems 💎', 'success');
            
            // Sync to cloud
            const uid = authService.getUid();
            if (uid) {
                firestoreService.saveProgress(uid, storage.getProgress());
                firestoreService.saveUserProfile(uid, { gems: storage.getGems() });
            }
            
            // Re-render navbar to update gems display
            import('./components/navbar.js').then(m => m.renderNavbar());
        }
        
        new SidebarComponent('#course-sidebar', course, courseLessons, lessonId);
        $('#mark-complete-btn').style.display = 'none';
        const badge = $('#lesson-status-badge');
        if (badge) badge.innerHTML = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Completed</span>';
    });

    // ── Sidebar Toggle (Mobile) ──
    $('#sidebar-toggle')?.addEventListener('click', () => {
        $('#course-sidebar').classList.toggle('open');
    });

    // ── Shortcuts Help Button ──
    $('#shortcuts-help-btn')?.addEventListener('click', () => {
        const tooltip = document.getElementById('shortcuts-tooltip');
        if (tooltip) tooltip.classList.toggle('visible');
    });
}

function renderPortfolio() {
    const app = $('#app');
    app.innerHTML = '<div class="page-wrapper bg-dots-pattern" id="portfolio-mount"></div>';
    new PortfolioComponent('#portfolio-mount');
}

function renderProfile() {
    const app = $('#app');
    const profile = storage.getProfile();
    const totalCompleted = storage.getTotalCompletedLessons();
    const totalChallenges = storage.getTotalChallengesPassed();
    const totalLearningHours = storage.getTotalLearningHours();
    const totalReviews = storage.getTotalReviewsCount(profile.name);
    const theme = storage.getTheme();
    const email = authService.getEmail();

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left;margin-bottom:var(--space-10); display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <span class="section-badge"><i class="fa-solid fa-user"></i> Dashboard</span>
            <h1 class="section-title">Developer Profile</h1>
          </div>
          <div style="display:flex; gap:var(--space-3);">
             <button class="btn btn-primary btn-sm" id="share-progress-btn"><i class="fa-solid fa-share-nodes"></i> Share Progress</button>
             <button class="btn btn-outline btn-sm" id="edit-profile-btn"><i class="fa-solid fa-pen"></i> Edit Profile</button>
          </div>
        </div>

        <!-- Top Overview -->
        <div class="grid" style="grid-template-columns: 350px 1fr; gap:var(--space-6); margin-bottom:var(--space-6);">
          
          <!-- Identity Card -->
          <div class="card" style="text-align:center; padding:var(--space-8) var(--space-6); display:flex; flex-direction:column;">
            <div class="avatar avatar-lg" style="margin: 0 auto var(--space-4); width: 100px; height: 100px; font-size: 2.5rem; box-shadow: var(--shadow-glow);">
              ${profile.name.charAt(0).toUpperCase()}
            </div>
            <h3 style="font-size:var(--text-xl); margin-bottom:var(--space-1)">${profile.name}</h3>
            <p class="text-sm" style="color:var(--brand-primary-light); font-weight:600; margin-bottom:var(--space-2)">${profile.role || 'Frontend Developer'}</p>
            ${email ? `<p class="text-sm text-muted" style="margin-bottom:var(--space-4)">${email}</p>` : ''}
            
            <p class="text-sm text-secondary" style="margin-bottom:var(--space-6); line-height:1.6; padding:0 var(--space-2)">
              ${profile.bio || 'Passionate learner building projects on ProCode EduPulse.'}
            </p>
            
            <div class="badge badge-primary" style="margin:auto auto var(--space-6)">ProCode Student</div>
            
            <div class="divider" style="width:100%"></div>
            
            <div style="display:flex; justify-content:space-between; text-align:left; font-size:var(--text-sm); width:100%">
                <span class="text-muted">Member Since</span>
                <span style="font-weight:600">${new Date(profile.joinDate).toLocaleDateString([], {month: 'short', year: 'numeric'})}</span>
            </div>
            <div style="display:flex; justify-content:space-between; text-align:left; font-size:var(--text-sm); margin-top:var(--space-3); width:100%">
                <span class="text-muted">Global Rank</span>
                <span style="font-weight:600; color:var(--brand-primary-light);">Top 15%</span>
            </div>
            <div style="display:flex; gap:var(--space-3); justify-content:center; margin-top:var(--space-6); width:100%">
                <a href="https://github.com" target="_blank" class="btn btn-icon btn-secondary" title="GitHub Profile"><i class="fa-brands fa-github"></i></a>
                <a href="https://linkedin.com" target="_blank" class="btn btn-icon btn-secondary" title="LinkedIn Profile"><i class="fa-brands fa-linkedin"></i></a>
            </div>
          </div>

          <!-- Highlight Metric Cards -->
          <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); align-items:start;">
            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Learning Hours</span>
                   <i class="fa-solid fa-hourglass-end text-gradient"></i>
                </div>
                <div class="text-gradient" style="font-size: 2.5rem; font-weight:800; line-height:1; display:inline-block;">${totalLearningHours}</div>
                <div class="text-sm text-muted">Active site time</div>
            </div>
            
            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Challenge Pass Rate</span>
                   <i class="fa-solid fa-bullseye text-gradient"></i>
                </div>
                <div class="text-gradient" style="font-size: 2.5rem; font-weight:800; line-height:1; display:inline-block;">${storage.getChallengePassRate()}%</div>
                <div class="text-sm text-muted">Accuracy rate</div>
            </div>

            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Current Streak</span>
                   <i class="fa-solid fa-fire text-gradient" style="color:#fd9644;"></i>
                </div>
                <div class="text-gradient" style="font-size: 2.5rem; font-weight:800; line-height:1; display:inline-block;">${storage.getCurrentStreak()}</div>
                <div class="text-sm text-muted">Consecutive days</div>
            </div>

            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Most Active Course</span>
                   <i class="fa-solid fa-book-open text-gradient"></i>
                </div>
                <div class="text-gradient" style="font-size: 1.5rem; font-weight:800; line-height:1.2; display:inline-block;">${storage.getMostActiveCourse(coursesData)}</div>
                <div class="text-sm text-muted">Highest completions</div>
            </div>

            <!-- Chart Section span full width -->
            <div class="card" style="grid-column: span 4; padding:var(--space-6);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <h3 style="font-size:var(--text-lg);"><i class="fa-solid fa-chart-column"></i> Lessons per Week</h3>
                </div>
                <div class="css-chart-container" style="position: relative; height: 260px; width: 100%;">
                    ${(() => {
                        const activityData = storage.getActivityLast7Days();
                        let maxVal = Math.max(...activityData.datasets.lessons, 1); // Avoid div by 0
                        return '<div class="css-bar-chart">';
                        return activityData.datasets.lessons.map((val, i) => {
                            const percent = (val / maxVal) * 100;
                            return `
                              <div class="css-chart-col">
                                <div class="css-bar" style="height: ${Math.max(percent, 5)}%">
                                  <div class="css-bar-tooltip">${val} lessons</div>
                                </div>
                                <div class="css-label">${activityData.labels[i]}</div>
                              </div>
                            `;
                        }).join('') + '</div>';
                    })()}
                </div>
            </div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns:1fr;gap:var(--space-6)">
          <!-- User Reviews section -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-star"></i> My Reviews</h3>
            ${(() => {
                const userReviews = storage.getUserReviews(profile.name);
                if (userReviews.length === 0) {
                    return '<p class="text-muted text-sm" style="padding:var(--space-4); text-align:center; background:var(--bg-input); border-radius:var(--radius-md);">You haven\'t written any reviews yet. <a href="#/courses">Enroll in a course</a> to share your feedback!</p>';
                }
                return userReviews.map(review => {
                    const course = coursesData.find(c => c.id === review.courseId);
                    const courseName = course ? course.title : 'Unknown Course';
                    return `
                      <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--space-4); margin-bottom:var(--space-3); transition:all 0.2s;">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:var(--space-3);">
                          <div>
                            <div style="font-weight:600; color:var(--text-primary); margin-bottom:4px; font-size:1rem;"><a href="#/course/${review.courseId}" style="color:var(--brand-primary-light); text-decoration:none;">${courseName}</a></div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">${new Date(review.createdAt).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}</div>
                          </div>
                          <div style="display:flex; gap:2px;">${Array(5).fill(0).map((_, i) => `<i class="${i < review.rating ? 'fa-solid' : 'fa-regular'} fa-star\" style=\"color:#f1c40f; font-size:0.85rem;\"></i>`).join('')}</div>
                        </div>
                        <p style="font-size:0.95rem; color:var(--text-secondary); line-height:1.5; margin:0;">"${review.text}"</p>
                      </div>
                    `;
                }).join('');
            })()}
          </div>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-6)">
          <!-- Course Progress section -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-book-open"></i> Current Courses</h3>
            ${(() => {
                const enrolledCourses = coursesData.filter(course => storage.isEnrolled(course.id) || storage.getCourseCompletionPercent(course.id, course.totalLessons) > 0);
                if (enrolledCourses.length === 0) {
                    return '<p class="text-muted text-sm" style="padding:var(--space-4); text-align:center; background:var(--bg-input); border-radius:var(--radius-md);">You haven\'t enrolled in any courses yet. <a href="#/courses">Browse courses</a> to get started!</p>';
                }
                return enrolledCourses.map(course => {
                    const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
                    const isCompleted = percent === 100;
                    return `
                      <div style="margin-bottom:var(--space-5)">
                        <div class="flex justify-between text-sm mb-2">
                          <span style="font-weight:600;"><i class="${course.icon}" style="margin-right:8px; color:var(--brand-primary-light);"></i> ${course.title} ${isCompleted ? '<span class="badge badge-success" style="font-size:0.7rem; margin-left:8px;"><i class="fa-solid fa-check"></i> Completed</span>' : ''}</span>
                          <span class="text-muted">${percent}%</span>
                        </div>
                        <div class="progress-track" style="height:6px; background:var(--bg-input);">
                          <div class="progress-fill" style="width:${percent}%; box-shadow: 0 0 10px var(--brand-primary-light);"></div>
                        </div>
                      </div>`;
                }).join('');
            })()}
          </div>

          <!-- Settings -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-gear"></i> Preferences</h3>
            <div style="display:flex; flex-direction:column; gap:var(--space-6);">
              <div>
                <h4 style="margin-bottom:var(--space-4); font-size:var(--text-sm); color:var(--text-muted);">Appearance</h4>
                <div class="flex items-center justify-between" style="padding:var(--space-4); background:var(--bg-input); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                  <span style="font-weight:500;">Interface Theme</span>
                  <div class="tabs" style="background:var(--bg-secondary)">
                    <span class="tab ${theme === 'dark' ? 'active' : ''}" data-theme-option="dark"><i class="fa-solid fa-moon"></i> Dark</span>
                    <span class="tab ${theme === 'light' ? 'active' : ''}" data-theme-option="light"><i class="fa-solid fa-sun"></i> Light</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style="margin-bottom:var(--space-4); font-size:var(--text-sm); color:var(--text-muted);">AI Integration</h4>
                <div style="padding:var(--space-4); background:var(--bg-input); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                  <div class="input-group mb-4">
                    <label>Gemini API Key</label>
                    <input type="password" class="input" id="ai-api-key" placeholder="Enter your API key">
                  </div>
                  <button class="btn btn-secondary btn-sm" id="save-api-key" style="width:100%"><i class="fa-solid fa-robot"></i> Save AI Configuration</button>
                </div>
              </div>
            </div>
            
            <div class="divider" style="margin:var(--space-8) 0 var(--space-6);"></div>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <h4 style="color:var(--color-error); margin-bottom:4px;">Danger Zone</h4>
                  <p class="text-xs text-muted">Irreversibly delete all your local data.</p>
              </div>
              <button class="btn btn-outline btn-sm" style="border-color:var(--color-error);color:var(--color-error)" id="reset-data-btn">
                <i class="fa-solid fa-trash"></i> Reset Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Profile Modal -->
    <div class="modal-overlay" id="edit-profile-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Edit Profile</h3>
                <button class="modal-close" id="close-profile-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="input-group mb-4">
                <label>Display Name</label>
                <input type="text" class="input" id="profile-name" value="${profile.name}" placeholder="Your name">
            </div>
            <div class="input-group mb-4">
                <label>Professional Role</label>
                <input type="text" class="input" id="profile-role" value="${profile.role || ''}" placeholder="e.g. Frontend Developer">
            </div>
            <div class="input-group mb-6">
                <label>Bio</label>
                <textarea class="input textarea" id="profile-bio" placeholder="Tell us about yourself...">${profile.bio || ''}</textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button class="btn btn-ghost" id="cancel-profile-modal">Cancel</button>
                <button class="btn btn-primary" id="save-profile">Save Changes</button>
            </div>
        </div>
    </div>

    <!-- Share Modal Fallback -->
    <div class="modal-overlay" id="share-modal">
        <div class="modal">
            <div class="modal-header" style="border-bottom:none; padding-bottom:0;">
                <h3 class="modal-title">Share Your Progress</h3>
                <button class="modal-close" id="close-share-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding:var(--space-4); text-align:center;">
                <p class="text-secondary" style="margin-bottom:var(--space-6);">Let your network know you're leveling up!</p>
                <div style="background:var(--bg-input); padding:var(--space-4); border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:var(--space-6); font-family:monospace; color:var(--text-primary); text-align:left;" id="share-preview-text">
                </div>
                
                <div class="grid grid-2" style="gap:var(--space-4);">
                    <button class="btn btn-primary share-btn-twitter" id="share-btn-twitter" style="background:#1DA1F2; border-color:#1DA1F2;"><i class="fa-brands fa-twitter"></i> Twitter / X</button>
                    <button class="btn btn-primary share-btn-linkedin" id="share-btn-linkedin" style="background:#0A66C2; border-color:#0A66C2;"><i class="fa-brands fa-linkedin"></i> LinkedIn</button>
                    <button class="btn btn-outline share-btn-copy" id="share-btn-copy" style="grid-column: span 2;"><i class="fa-solid fa-copy"></i> Copy to Clipboard</button>
                </div>
            </div>
        </div>
    </div>
  `;

    // Share Progress Logic
    const shareProgressBtn = $('#share-progress-btn');
    const shareModal = $('#share-modal');
    
    // Build share text
    const totalLessonsText = storage.getTotalCompletedLessons();
    const shareText = `I completed ${totalLessonsText} lessons on ProCode EduPulse! Building my portfolio and leveling up my dev skills! 🚀 #LearnToCode #WebDev #ProCode`;
    
    if(shareProgressBtn) {
        shareProgressBtn.addEventListener('click', () => {
             if (navigator.share) {
                 navigator.share({ 
                     title: 'ProCode Progress', 
                     text: shareText
                 }).catch(console.error);
             } else {
                 if(shareModal) {
                     $('#share-preview-text').innerText = shareText;
                     shareModal.classList.add('active');
                 } else {
                     navigator.clipboard.writeText(shareText);
                     showToast('Progress copied!', 'success');
                 }
             }
        });
    }

    $('#close-share-modal')?.addEventListener('click', () => shareModal.classList.remove('active'));
    
    $('#share-btn-twitter')?.addEventListener('click', () => {
         window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
         shareModal.classList.remove('active');
    });
    
    $('#share-btn-linkedin')?.addEventListener('click', () => {
         // LinkedIn doesn't easily accept prefilled text without a URL, but we pass it anyway. Usually best to use generic share endpoint.
         window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(shareText)}`, '_blank');
         shareModal.classList.remove('active');
    });

    $('#share-btn-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(shareText);
        showToast('Progress copied to clipboard!', 'success');
        shareModal.classList.remove('active');
    });

    // Edit Profile Modal Logic
    const modal = document.getElementById('edit-profile-modal');
    $('#edit-profile-btn')?.addEventListener('click', () => modal.classList.add('active'));
    $('#close-profile-modal')?.addEventListener('click', () => modal.classList.remove('active'));
    $('#cancel-profile-modal')?.addEventListener('click', () => modal.classList.remove('active'));

    // Save Profile
    $('#save-profile')?.addEventListener('click', async () => {
        const name = $('#profile-name').value.trim();
        const role = $('#profile-role').value.trim();
        const bio = $('#profile-bio').value.trim();
        
        if (name) {
            storage.updateProfile({ name, role, bio });
            showToast('Profile updated!', 'success');
            renderNavbar();
            modal.classList.remove('active');
            renderProfile(); // re-render to update the ui
            
            // Sync to Firebase
            const uid = authService.getUid();
            if (uid) {
                await authService.updateDisplayName(name);
                await firestoreService.saveUserProfile(uid, { name, role, bio });
            }
        }
    });

    // Theme tabs
    app.querySelectorAll('[data-theme-option]').forEach(tab => {
        tab.addEventListener('click', () => {
            app.querySelectorAll('[data-theme-option]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const newTheme = tab.dataset.themeOption;
            storage.setTheme(newTheme);
            
            const toggle = document.getElementById('theme-toggle');
            if (toggle) {
                const icon = toggle.querySelector('i');
                icon.className = `fa-solid ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
            }
            
            // Re-render chart to pick up theme colors
            renderProfile();
        });
    });

    // Save API Key
    $('#save-api-key')?.addEventListener('click', () => {
        const key = $('#ai-api-key').value.trim();
        if (key) {
            import('./services/ai-service.js').then(m => {
                m.aiService.configure({ apiKey: key });
            });
            showToast('API key saved successfully!', 'success');
        }
    });

    // Reset data
    $('#reset-data-btn')?.addEventListener('click', () => {
        if (confirm('Are you absolutely sure? This will permanently delete all your local progress, notes, and submissions.')) {
            storage.resetAll();
            showToast('All data reset locally.', 'info');
            renderProfile();
        }
    });
}

// ══════════════════════════════════════════════
// ADMIN & UTILITY PAGES
// ══════════════════════════════════════════════

async function renderAdminDashboard() {
    const app = $('#app');
    app.innerHTML = `<div class="page-wrapper bg-dots-pattern" style="padding:var(--space-16);">
        <div class="container" style="max-width:800px;">
            <h1 class="section-title">Admin Dashboard</h1>
            <div id="admin-stats" class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-6);"></div>
        </div>
    </div>`;

    const stats = await firestoreService.getAdminStats();
    const container = $('#admin-stats');
    if (!stats) {
        container.innerHTML = '<p class="text-muted">Unable to load statistics.</p>';
        return;
    }

    const cards = [];
    cards.push(`<div class="card">
        <h3>Total Users</h3>
        <div style="font-size:2rem;font-weight:800">${stats.totalUsers}</div>
    </div>`);
    cards.push(`<div class="card">
        <h3>Total Courses</h3>
        <div style="font-size:2rem;font-weight:800">${stats.totalCourses || 'N/A'}</div>
    </div>`);
    cards.push(`<div class="card">
        <h3>Total Enrollments</h3>
        <div style="font-size:2rem;font-weight:800">${stats.totalEnrollments}</div>
    </div>`);
    if (stats.mostPopularCourses && stats.mostPopularCourses.length) {
        cards.push(`<div class="card">
            <h3>Top Courses</h3>
            <ul style="padding-left:1rem; margin:0;">
                ${stats.mostPopularCourses.slice(0,5).map(c=>`<li>${c.courseId} (${c.count})</li>`).join('')}
            </ul>
        </div>`);
    }
    container.innerHTML = cards.join('');
}

function renderErrorPage() {
    const app = $('#app');
    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern" style="padding:var(--space-16);text-align:center">
        <div class="error-offline-icon" style="font-size:6rem;">😕</div>
        <h1 style="margin-top:var(--space-6)">404 - Page Not Found</h1>
        <p class="text-muted" style="margin-bottom:var(--space-6);">Sorry, the page you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary">Go to Home</a>
    </div>
    `;
}

function renderOfflinePage() {
    const app = $('#app');
    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern" style="padding:var(--space-16);text-align:center">
        <div class="error-offline-icon" style="font-size:6rem;">📡</div>
        <h1 style="margin-top:var(--space-6)">No Internet Connection</h1>
        <p class="text-muted" style="margin-bottom:var(--space-6);">Please check your network and try again.</p>
        <button id="retry-connection" class="btn btn-primary">Retry</button>
    </div>
    `;
    $('#retry-connection').addEventListener('click', () => window.location.reload());
}

// ══════════════════════════════════════════════
// NEW PAGES (Roadmaps, Docs, About, Careers)
// ══════════════════════════════════════════════

function renderRoadmapsPage() {
    const app = $('#app');
    
    app.innerHTML = `
      <div class="container roadmap-container">
        <div class="text-center" style="margin-bottom:var(--space-10)">
          <span class="badge badge-primary mb-4">Learning Paths</span>
          <h1 style="font-size:2.5rem;margin-bottom:var(--space-4)">Developer Roadmaps</h1>
          <p class="text-muted" style="font-size:1.1rem;max-width:600px;margin:0 auto">
            Follow our structured learning tracks to go from absolute beginner to job-ready professional.
          </p>
        </div>

        <div>
          ${roadmapsData.map(track => {
              const allCoursesText = track.courses.map(c => {
                  const courseData = coursesData.find(cd => cd.id === c.id);
                  const title = courseData ? courseData.title : c.title;
                  const isAvailable = c.status === 'available';
                  return `
                    <div class="roadmap-node ${isAvailable ? 'available' : 'locked'}" ${isAvailable ? `onclick="window.location.hash='/course/${c.id}'"` : ''}>
                      <div class="node-dot"><i class="fa-solid ${isAvailable ? 'fa-check' : 'fa-lock'}"></i></div>
                      <div style="flex:1">
                        <strong style="color:var(--text-primary)">${title}</strong>
                        ${!isAvailable ? '<span class="badge badge-error" style="font-size:10px;margin-left:8px">Coming Soon</span>' : ''}
                      </div>
                      ${isAvailable ? '<i class="fa-solid fa-chevron-right text-muted"></i>' : ''}
                    </div>
                  `;
              }).join('');

              return `
                <div class="roadmap-track animate-scaleIn">
                  <div class="roadmap-header">
                    <div class="roadmap-icon"><i class="${track.icon}"></i></div>
                    <div>
                      <h2>${track.title}</h2>
                      <p class="text-muted" style="margin-top:var(--space-2)">${track.description}</p>
                    </div>
                  </div>
                  <div class="roadmap-nodes">
                    ${allCoursesText}
                  </div>
                </div>
              `;
          }).join('')}
        </div>
      </div>
    `;
}

function renderDocsPage(params) {
    const app = $('#app');
    const docId = params?.docId || (docsData[0]?.docs[0]?.id);
    
    let activeDoc = null;
    let activeCategory = null;

    docsData.forEach(cat => {
        const found = cat.docs.find(d => d.id === docId);
        if (found) {
            activeDoc = found;
            activeCategory = cat;
        }
    });

    if (!activeDoc && docsData.length > 0) {
        activeDoc = docsData[0].docs[0];
        activeCategory = docsData[0];
    }

    const sidebarHtml = docsData.map(cat => `
        <div style="margin-bottom:var(--space-6);">
            <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:var(--space-3);display:flex;align-items:center;gap:8px;">
                <i class="${cat.icon}" style="color:var(--brand-primary-light);"></i> ${cat.title}
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px;">
            ${cat.docs.map(doc => `
                <a href="#/docs/${doc.id}" style="padding:8px 12px;border-radius:8px;font-size:0.95rem;color:${doc.id === activeDoc?.id ? 'var(--brand-primary)' : 'var(--text-secondary)'};background:${doc.id === activeDoc?.id ? 'rgba(108,92,231,0.1)' : 'transparent'};font-weight:${doc.id === activeDoc?.id ? '600' : '400'};text-decoration:none;transition:all 0.2s;border-left:${doc.id === activeDoc?.id ? '3px solid var(--brand-primary)' : '3px solid transparent'};">
                    ${doc.title}
                </a>
            `).join('')}
            </div>
        </div>
    `).join('');

    app.innerHTML = `
      <style>
        .docs-page-layout { display:flex; min-height:calc(100vh - 70px); background:var(--bg-primary); }
        .docs-left-sidebar { width:280px; flex-shrink:0; border-right:1px solid var(--border-subtle); background:var(--bg-secondary); padding:var(--space-6); position:sticky; top:70px; height:calc(100vh - 70px); overflow-y:auto; }
        .docs-main-content { flex:1; padding:var(--space-10) var(--space-8); max-width:850px; margin:0 auto; }
        .docs-content h2 { font-size:2rem; margin-top:0; margin-bottom:var(--space-6); color:var(--text-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:var(--space-3); }
        .docs-content h3 { font-size:1.5rem; margin-top:var(--space-8); margin-bottom:var(--space-4); color:var(--text-primary); }
        .docs-content p { font-size:1.1rem; line-height:1.7; color:var(--text-secondary); margin-bottom:var(--space-4); }
        .docs-content ul, .docs-content ol { font-size:1.1rem; line-height:1.7; color:var(--text-secondary); margin-bottom:var(--space-6); padding-left:1.5rem; }
        .docs-content li { margin-bottom:var(--space-2); }
        .docs-content code { background:var(--bg-input); padding:2px 6px; border-radius:4px; font-family:monospace; color:var(--brand-primary-light); font-size:0.95em; }
        .shortcuts-docs kbd { background:var(--bg-tertiary); border:1px solid var(--border-subtle); box-shadow:0 2px 0 var(--border-subtle); padding:2px 6px; border-radius:4px; font-size:0.9em; font-family:inherit; margin-right:4px; }
        .faq-item { background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:12px; padding:var(--space-5); margin-bottom:var(--space-4); transition:transform 0.2s; }
        .faq-item:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
        .faq-item strong { display:block; font-size:1.1rem; margin-bottom:var(--space-2); color:var(--brand-primary-light); }
        .faq-item p { margin:0; font-size:1rem; }
        @media (max-width: 900px) {
            .docs-page-layout { flex-direction:column; }
            .docs-left-sidebar { width:100%; position:relative; top:0; height:auto; border-right:none; border-bottom:1px solid var(--border-subtle); }
            .docs-main-content { padding:var(--space-6) var(--space-4); }
        }
      </style>
      <div class="docs-page-layout">
        <aside class="docs-left-sidebar">
          <div style="margin-bottom:var(--space-8)">
            <div style="position:relative;">
                <i class="fa-solid fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted)"></i>
                <input type="text" class="input" placeholder="Search documentation..." style="width:100%;padding-left:36px;border-radius:20px;background:var(--bg-input);border-color:transparent;" id="docs-search-local" autocomplete="off">
            </div>
          </div>
          <nav>
            ${sidebarHtml}
          </nav>
        </aside>
        <main class="docs-main-content animate-slideUp">
          ${activeDoc ? `
            <div style="display:flex;align-items:center;gap:8px;font-size:0.9rem;font-weight:600;color:var(--text-muted);margin-bottom:var(--space-6);letter-spacing:0.5px;text-transform:uppercase;">
              <span>${activeCategory?.title}</span>
              <i class="fa-solid fa-chevron-right" style="font-size:0.75rem;"></i>
              <span style="color:var(--brand-primary);">${activeDoc.title}</span>
            </div>
            <article class="docs-content">
              <h1 style="font-size:3rem;font-weight:800;letter-spacing:-1px;margin-bottom:var(--space-8);color:var(--text-primary);line-height:1.1;">
                ${activeDoc.title}
              </h1>
              ${activeDoc.content}
            </article>
            <div style="margin-top:var(--space-12);padding-top:var(--space-6);border-top:1px dashed var(--border-subtle);display:flex;justify-content:space-between;align-items:center;color:var(--text-muted);font-size:0.9rem;">
                <span>Was this page helpful? <i class="fa-regular fa-thumbs-up" style="margin-left:8px;cursor:pointer;"></i> <i class="fa-regular fa-thumbs-down" style="margin-left:8px;cursor:pointer;"></i></span>
                <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank" style="color:var(--text-muted);text-decoration:none;"><i class="fa-brands fa-github"></i> Edit this page</a>
            </div>
          ` : `
            <div class="empty-state text-center" style="padding:var(--space-16) 0">
              <div class="empty-state-icon" style="font-size:4rem;color:var(--border-subtle);margin-bottom:var(--space-4)"><i class="fa-regular fa-file-code"></i></div>
              <h3>Documentation Not Found</h3>
              <p class="text-muted">The requested document could not be found or has been moved.</p>
              <a href="#/docs" class="btn btn-primary mt-4">Return home</a>
            </div>
          `}
        </main>
      </div>
    `;

    // Quick local search filter functionality
    const searchInput = document.getElementById('docs-search-local');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const links = app.querySelectorAll('.docs-left-sidebar a');
            links.forEach(link => {
                if(link.innerText.toLowerCase().includes(val)) {
                    link.style.display = 'block';
                } else {
                    link.style.display = 'none';
                }
            });
        });
    }
}

function renderAboutPage() {
    const app = $('#app');
    const base = getBasePath();
    
    app.innerHTML = `
      <div class="container" style="max-width:800px;padding-bottom:var(--space-16)">
        <div class="about-hero animate-scaleIn">
          <div class="about-avatar">M</div>
          <h1 style="font-size:2.5rem;margin-bottom:var(--space-2)">Mahmoud ElSoghayar</h1>
          <p class="text-gradient" style="font-size:1.2rem;font-weight:600">Electrical & Electronics Engineer | Software Developer</p>
          
          <div class="tech-stack-tags">
            <span class="tech-tag">HTML5</span>
            <span class="tech-tag">CSS3</span>
            <span class="tech-tag">JavaScript</span>
            <span class="tech-tag">React.js</span>
            <span class="tech-tag">Next.js</span>
            <span class="tech-tag">SCSS</span>
            <span class="tech-tag">Flutter</span>
            <span class="tech-tag">Dart</span>
            <span class="tech-tag">Firebase</span>
            <span class="tech-tag">Databases</span>
            <span class="tech-tag">Linux</span>
            <span class="tech-tag">Testing (DEPI)</span>
          </div>
        </div>

        <div class="card animate-slideUp" style="padding:var(--space-8);font-size:1.1rem;line-height:1.8;color:var(--text-secondary)">
          <p style="margin-bottom:var(--space-4)">
            Hello! I'm <strong>Mahmoud ElSoghayar</strong>, an ambitious Electrical and Electronics Engineer with a deep passion for software development.
            Since starting my programming journey in 2021, I have dedicated myself to mastering both frontend web technologies and mobile application development.
          </p>
          <p style="margin-bottom:var(--space-4)">
            My technical foundation spans across modern web stacks (React, Next.js) and cross-platform mobile development (Flutter, Dart). Having completed rigorous training in software testing with DEPI, I approach every project with a "quality-first" mentality, striving to produce bug-free, highly optimized code for production environments.
          </p>
          <p>
            The <strong>ProCode EduPulse LMS</strong> is a testament to my commitment to education and building premium, professional user experiences.
          </p>
        </div>

        <h3 class="text-center" style="margin-top:var(--space-10)">Let's Connect</h3>
        <div class="social-links-grid animate-slideUp" style="animation-delay:0.1s">
          <a href="https://linkedin.com/in/elsoghayar" target="_blank" class="social-card">
            <i class="fa-brands fa-linkedin"></i>
            <div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">Connect on</div>
              <div style="font-weight:600">LinkedIn</div>
            </div>
          </a>
          <a href="https://github.com/soghayarmahmoud" target="_blank" class="social-card">
            <i class="fa-brands fa-github"></i>
            <div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">Follow on</div>
              <div style="font-weight:600">GitHub</div>
            </div>
          </a>
          <a href="https://youtube.com/@procode4u" target="_blank" class="social-card">
            <i class="fa-brands fa-youtube"></i>
            <div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">Subscribe to</div>
              <div style="font-weight:600">@procode4u</div>
            </div>
          </a>
          <a href="https://wa.me/201019593092" target="_blank" class="social-card">
            <i class="fa-brands fa-whatsapp"></i>
            <div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">Chat on</div>
              <div style="font-weight:600">+20 1019593092</div>
            </div>
          </a>
        </div>
      </div>
    `;
}

function renderCareersPage() {
    const app = $('#app');
    
    const jobs = [
        {
            title: "Frontend Instructor",
            category: "Education",
            type: "Volunteer",
            icon: "fa-brands fa-react",
            desc: "Create lessons, review code submissions, and mentor students in HTML, CSS, JavaScript, and React paths."
        },
        {
            title: "Backend / Systems Instructor",
            category: "Education",
            type: "Volunteer",
            icon: "fa-brands fa-node-js",
            desc: "Help students master Node.js, databases, Docker, and Linux by crafting real-world challenges."
        },
        {
            title: "Software Engineer (QA/Testing)",
            category: "Engineering",
            type: "Volunteer",
            icon: "fa-solid fa-bug",
            desc: "Ensure platform stability. Write automated tests in Jest/Playwright, review PRs, and squash bugs."
        },
        {
            title: "Technical Support Specialist",
            category: "Support",
            type: "Volunteer",
            icon: "fa-solid fa-headset",
            desc: "Be the hero our students need. Answer technical questions on Discord, help debug their IDE setups, and resolve login issues."
        },
        {
            title: "Social Media & Community Manager",
            category: "Marketing",
            type: "Volunteer",
            icon: "fa-brands fa-twitter",
            desc: "Grow our community! Manage our social channels, highlight student portfolios, and organize weekly coding events."
        }
    ];

    app.innerHTML = `
      <div class="container" style="max-width:1000px;padding:var(--space-16) 0">
        <div class="careers-banner animate-scaleIn text-center" style="margin-bottom:var(--space-16);">
          <div class="badge badge-primary" style="margin-bottom:var(--space-4);"><i class="fa-solid fa-hand-holding-heart"></i> Volunteer Force</div>
          <h1 style="font-size:3.5rem;font-weight:800;letter-spacing:-1px;margin-bottom:var(--space-4);">Help Us Build The Future</h1>
          <p style="font-size:1.2rem;color:var(--text-secondary);max-width:600px;margin:0 auto;line-height:1.6;">
            ProCode EduPulse is a community-driven, open-source organization. We don't have paid roles, but we offer a platform to make a massive impact on thousands of early-career developers.
          </p>
        </div>

        <div class="section-header" style="text-align:left;margin-bottom:var(--space-8);display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid var(--border-subtle);padding-bottom:var(--space-4);">
            <div>
                <h2 style="font-size:1.8rem;">Open Volunteer Positions</h2>
                <p class="text-muted" style="margin-top:4px;">Find a role that matches your skills and passion.</p>
            </div>
            <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank" class="btn btn-outline"><i class="fa-brands fa-github"></i> View Repository</a>
        </div>

        <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:var(--space-6);">
          ${jobs.map((job, idx) => `
            <div class="card animate-slideUp" style="animation-delay:${idx * 0.1}s;display:flex;flex-direction:column;height:100%;transition:all 0.3s;border:1px solid var(--border-subtle);background:var(--bg-secondary);">
                <div style="padding:var(--space-6);flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-4);">
                        <div style="width:48px;height:48px;border-radius:12px;background:rgba(108,92,231,0.1);color:var(--brand-primary);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
                            <i class="${job.icon}"></i>
                        </div>
                        <span class="badge ${job.category === 'Education' ? 'badge-primary' : job.category === 'Engineering' ? 'badge-warning' : 'badge-success'}">${job.type}</span>
                    </div>
                    <h3 style="font-size:1.2rem;margin-bottom:var(--space-2);color:var(--text-primary);">${job.title}</h3>
                    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.6;">
                        ${job.desc}
                    </p>
                </div>
                <div style="padding:var(--space-4) var(--space-6);border-top:1px solid var(--border-subtle);background:var(--bg-input);">
                    <button class="btn btn-primary btn-apply-volunteer" data-job="${job.title}" style="width:100%;">Apply Now <i class="fa-solid fa-arrow-right" style="margin-left:8px;"></i></button>
                </div>
            </div>
          `).join('')}
        </div>
        
        <div class="card mt-12 text-center" style="background:linear-gradient(135deg, rgba(108,92,231,0.1) 0%, rgba(0,2ce,201,0.1) 100%);padding:var(--space-10);border-radius:24px;">
            <h3 style="margin-bottom:var(--space-4);">Don't see a fit?</h3>
            <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-6);">If you have a unique skill set and want to help the project grow, we'd still love to hear from you. Join our discord or open a PR anyway!</p>
            <div style="display:flex;gap:var(--space-4);justify-content:center;">
                <button class="btn btn-outline" onclick="window.location.hash='/about'">Meet The Founder</button>
            </div>
        </div>
      </div>
      
      <!-- Application Modal -->
      <div class="modal-overlay" id="volunteer-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Volunteer Application</h3>
                <button class="modal-close" id="close-volunteer-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="text-muted" style="margin-bottom:var(--space-4);">Applying for: <strong style="color:var(--brand-primary-light);" id="volunteer-job-title"></strong></p>
            <form id="volunteer-form">
                <div class="input-group mb-4">
                    <label>Full Name</label>
                    <input type="text" class="input" id="vol-name" required placeholder="John Doe">
                </div>
                <div class="input-group mb-4">
                    <label>Email Address</label>
                    <input type="email" class="input" id="vol-email" required placeholder="john@example.com">
                </div>
                <div class="input-group mb-4">
                    <label>GitHub / LinkedIn URL</label>
                    <input type="url" class="input" id="vol-link" placeholder="https://github.com/..." required>
                </div>
                <div class="input-group mb-6">
                    <label>Why do you want to volunteer?</label>
                    <textarea class="input textarea" id="vol-reason" required placeholder="Tell us about your experience..."></textarea>
                </div>
                <div class="flex justify-end gap-3">
                    <button type="button" class="btn btn-ghost" id="cancel-volunteer-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Application</button>
                </div>
            </form>
        </div>
      </div>
    `;

    // Volunteer Logic
    const vModal = document.getElementById('volunteer-modal');
    const vTitle = document.getElementById('volunteer-job-title');
    
    $$('.btn-apply-volunteer').forEach(btn => {
        btn.onclick = () => {
            vTitle.innerText = btn.dataset.job;
            vModal.classList.add('active');
        };
    });

    $('#close-volunteer-modal').onclick = () => vModal.classList.remove('active');
    $('#cancel-volunteer-modal').onclick = () => vModal.classList.remove('active');

    $('#volunteer-form').onsubmit = (e) => {
        e.preventDefault();
        $('#volunteer-form').reset();
        vModal.classList.remove('active');
        showToast('Application submitted! We will email you shortly.', 'success');
    };
}

// ══════════════════════════════════════════════
// GLOBAL SEARCH (Ctrl+K)
// ══════════════════════════════════════════════

function setupGlobalSearch() {
    // Inject modal into body
    const modalHtml = `
        <div class="search-modal-overlay" id="global-search-overlay">
            <div class="search-modal">
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" class="global-search-input" id="global-search-input" placeholder="Search courses, lessons, docs..." autocomplete="off">
                    <button class="btn btn-ghost btn-sm" id="close-global-search"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="search-results" id="global-search-results"></div>
                <div class="search-footer">
                    <span><kbd style="background:var(--bg-primary);padding:2px 6px;border-radius:4px;border:1px solid var(--border-subtle)">↑↓</kbd> to navigate</span>
                    <span><kbd style="background:var(--bg-primary);padding:2px 6px;border-radius:4px;border:1px solid var(--border-subtle)">Enter</kbd> to select</span>
                    <span><kbd style="background:var(--bg-primary);padding:2px 6px;border-radius:4px;border:1px solid var(--border-subtle)">Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay = document.getElementById('global-search-overlay');
    const input = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('global-search-results');
    const closeBtn = document.getElementById('close-global-search');

    function openSearch() {
        overlay.classList.add('active');
        input.value = '';
        resultsContainer.innerHTML = '';
        setTimeout(() => input.focus(), 100);
    }

    function closeSearch() {
        overlay.classList.remove('active');
        input.blur();
    }

    closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    let selectedIndex = -1;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            resultsContainer.innerHTML = '';
            return;
        }

        const results = [];
        
        // Search Courses
        coursesData.forEach(c => {
            if (c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)) {
                results.push({ title: c.title, desc: 'Course', icon: c.icon, link: `#/course/${c.id}` });
            }
        });

        // Search Lessons
        lessonsData.forEach(l => {
            if (l.title.toLowerCase().includes(query)) {
                results.push({ title: l.title, desc: 'Lesson', icon: 'fa-solid fa-book-open', link: `#/lesson/${l.courseId}/${l.id}` });
            }
        });

        // Search Docs
        docsData.forEach(cat => {
            cat.docs.forEach(d => {
                if (d.title.toLowerCase().includes(query)) {
                    results.push({ title: d.title, desc: 'Documentation: ' + cat.title, icon: cat.icon, link: `#/docs/${d.id}` });
                }
            });
        });

        // Render limits
        const topResults = results.slice(0, 8);
        selectedIndex = -1;

        if (topResults.length === 0) {
            resultsContainer.innerHTML = `<div style="padding:var(--space-6) var(--space-4);text-align:center;color:var(--text-muted)">No results found for "${query}"</div>`;
        } else {
            resultsContainer.innerHTML = topResults.map((r, i) => `
                <a href="${r.link}" class="search-result-item" data-index="${i}" onclick="document.getElementById('global-search-overlay').classList.remove('active')">
                    <div class="search-result-title"><i class="${r.icon}" style="color:var(--brand-primary);width:20px;text-align:center"></i> ${r.title}</div>
                    <div class="search-result-desc">${r.desc}</div>
                </a>
            `).join('');
        }
    });

    input.addEventListener('keydown', (e) => {
        const items = resultsContainer.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
        }
    });

    function updateSelection(items) {
        items.forEach((item, i) => {
            if (i === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Attach to global keydown
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (overlay.classList.contains('active')) closeSearch();
            else openSearch();
        }
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeSearch();
        }
    });
}

// ══════════════════════════════════════════════
// ERROR & OFFLINE PAGES
// ══════════════════════════════════════════════

function renderErrorPage() {
    const app = $('#app');
    app.innerHTML = `
      <div class="container page-wrapper" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
        <div class="card text-center animate-scaleIn" style="max-width:500px;padding:var(--space-10);">
          <div class="error-offline-icon" style="font-size:5rem;color:var(--brand-primary);margin-bottom:var(--space-6);">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>
          <h1 style="font-size:2.5rem;margin-bottom:var(--space-2);">Lost in Space</h1>
          <p class="text-muted" style="margin-bottom:var(--space-8);font-size:1.1rem;line-height:1.6;">
            We can't seem to find the page you're looking for. It might have been moved or deleted.
          </p>
          <a href="#/" class="btn btn-primary btn-lg" style="width:100%;">Return to Mission Control</a>
        </div>
      </div>
    `;
}

function renderOfflinePage() {
    const app = $('#app');
    app.innerHTML = `
      <div class="container page-wrapper" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
        <div class="card text-center animate-scaleIn" style="max-width:500px;padding:var(--space-10);">
          <div class="error-offline-icon" style="font-size:5rem;color:var(--color-error);margin-bottom:var(--space-6);">
            <i class="fa-solid fa-wifi" style="position:relative;">
              <div style="position:absolute;top:50%;left:50%;width:120%;height:4px;background:var(--color-error);transform:translate(-50%,-50%) rotate(-45deg);border-radius:2px;"></div>
            </i>
          </div>
          <h1 style="font-size:2.5rem;margin-bottom:var(--space-2);">Connection Lost</h1>
          <p class="text-muted" style="margin-bottom:var(--space-8);font-size:1.1rem;line-height:1.6;">
            It seems you've lost your internet connection. Please check your network settings and try again.
          </p>
          <button class="btn btn-primary btn-lg" style="width:100%;" onclick="window.location.reload()">
            <i class="fa-solid fa-rotate-right"></i> Try Again
          </button>
        </div>
      </div>
    `;
}


// ══════════════════════════════════════════════
// APP INITIALIZATION
// ══════════════════════════════════════════════

async function startMainApp() {
    renderNavbar();
    await loadData();
    setupGlobalSearch();

    // Time tracking interval (only count when page is visible)
    setInterval(() => {
        if (!document.hidden) {
            storage.addActiveTime(60); // Add 60 seconds every minute
        }
    }, 60000);

    const router = new Router();
    router
        .on('/', () => transitionPage(renderLanding, '/'))
        .on('/courses', () => transitionPage(renderCoursesPage, '#/courses'))
        .on('/course/:courseId', (params) => transitionPage(() => renderCourse(params), `#/course/${params.courseId}`))
        .on('/lesson/:courseId/:lessonId', (params) => transitionPage(() => renderLesson(params), `#/lesson/${params.courseId}/${params.lessonId}`))
        .on('/roadmaps', () => transitionPage(renderRoadmapsPage, '#/roadmaps'))
        .on('/docs', () => transitionPage(renderDocsPage, '#/docs'))
        .on('/docs/:docId', (params) => transitionPage(() => renderDocsPage(params), `#/docs/${params.docId}`))
        .on('/portfolio', () => transitionPage(renderPortfolio, '#/portfolio'))
        .on('/profile', () => transitionPage(renderProfile, '#/profile'))
        .on('/admin', () => transitionPage(renderAdminDashboard, '#/admin'))
        .on('/about', () => transitionPage(renderAboutPage, '#/about'))
        .on('/careers', () => transitionPage(renderCareersPage, '#/careers'))
        .on('/login', () => transitionPage(renderLoginPage, '#/login'))
        .on('/signup', () => transitionPage(renderSignupPage, '#/signup'))
        .on('/404', () => transitionPage(renderErrorPage, '#/404'))
        .on('/offline', () => transitionPage(renderOfflinePage, '#/offline'))
        .on('*', () => transitionPage(renderErrorPage, window.location.hash));

    // network status handling
    window.addEventListener('offline', () => {
        router.navigate('/offline');
    });
    window.addEventListener('online', () => {
        // simply reload to re-attempt data fetches/navigation
        window.location.reload();
    });

    // Back to Top button
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('back-to-top');
        if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    });
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    // ── Global Keyboard Shortcuts ──
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
            e.preventDefault();
            showToast('Auto-saved!', 'success');
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const runBtn = document.getElementById('lesson-run-code');
            if (runBtn) { e.preventDefault(); runBtn.click(); }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            const copyBtn = document.getElementById('lesson-copy-code');
            if (copyBtn) { e.preventDefault(); copyBtn.click(); }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
            const resetBtn = document.getElementById('lesson-reset-code');
            if (resetBtn) { e.preventDefault(); resetBtn.click(); }
            return;
        }
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            const tooltip = document.querySelector('.shortcuts-tooltip.visible');
            if (tooltip) tooltip.classList.remove('visible');
        }
    }, true);
}

async function initApp() {
    initTheme();

    // Initialize auth
    try {
        await authService.init();
    } catch (e) {
        console.warn('Auth init failed (Firebase may not be configured):', e);
    }

    const user = authService.getCurrentUser();
    const hash = window.location.hash.slice(1) || '/';

    // Removing the forced redirect to login so unregistered users can browse courses.
    // Once they attempt to enroll, the app will prompt them to sign in.

    // If user is already logged in but trying to access auth pages, redirect to home
    if (user && (hash === '/login' || hash === '/signup')) {
        window.location.hash = '/';
        return;
    }

    // If Firebase is NOT configured, fall back to local-only mode
    const onboardingDone = localStorage.getItem('procode_onboarding_done') === 'true';
    if (!onboardingDone) {
        showWelcomeModel();
    } else {
        await startMainApp();
    }
}

// Boot
initApp().catch(err => {
    console.error('Failed to initialize app:', err);
    document.getElementById('app').innerHTML = `
    <div class="container" style="padding:var(--space-16);text-align:center">
      <h1><i class="fa-solid fa-triangle-exclamation"></i> Failed to load</h1>
      <p>Please check the console for errors and ensure data files are accessible.</p>
    </div>
  `;
});
