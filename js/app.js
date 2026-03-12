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

async function loadData() {
    const base = getBasePath();
    const [courses, lessons, quizzes, challenges, roadmaps, docs] = await Promise.all([
        fetch(`${base}data/courses.json`).then(r => r.json()),
        fetch(`${base}data/lessons.json`).then(r => r.json()),
        fetch(`${base}data/quizzes.json`).then(r => r.json()),
        fetch(`${base}data/challenges.json`).then(r => r.json()),
        fetch(`${base}data/roadmaps.json`).then(r => r.json()).catch(() => ({ roadmaps: [] })),
        fetch(`${base}data/docs.json`).then(r => r.json()).catch(() => ({ categories: [] }))
    ]);
    coursesData = courses.courses;
    lessonsData = lessons.lessons;
    quizzesData = quizzes.quizzes;
    challengesData = challenges.challenges;
    roadmapsData = roadmaps.roadmaps || [];
    docsData = docs.categories || [];
}

function transitionPage(renderFn) {
    const app = $('#app');
    app.style.opacity = 0;
    setTimeout(() => {
        renderFn();
        app.style.opacity = 1;
    }, 200);
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
                }
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
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
                    notes: storage._get('notes') || {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
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
                    submissions: {},
                    notes: {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            localStorage.setItem('procode_user_name', name);
            await startMainApp();
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
                    submissions: storage.getSubmissions(),
                    notes: storage._get('notes') || {}
                });
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            await startMainApp();
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
            icon: '<i class="fa-solid fa-rocket fa-3x"></i>',
            title: "Welcome to ProCode EduPulse",
            text: "Learn web development with structured lessons, projects, and interactive coding."
        },
        {
            icon: '<i class="fa-solid fa-laptop-code fa-3x"></i>',
            title: "Interactive Coding",
            text: "Practice directly in the browser using the built-in code editor with live preview."
        },
        {
            icon: '<i class="fa-solid fa-user-graduate fa-3x"></i>',
            title: "Build Your Portfolio",
            text: "Every challenge you complete becomes part of your developer portfolio."
        }
    ];

    function renderSlide() {
        const s = slides[slide];
        const isLast = slide === slides.length - 1;
        
        app.innerHTML = `
      <div class="wizard-overlay">
        <div class="wizard-left">
          <div class="wizard-left-content">
            <h1 style="font-size:3rem;margin-bottom:var(--space-6);line-height:1.2;">Your Journey<br>Starts Here.</h1>
            <p style="font-size:1.2rem;opacity:0.9">Join thousands of students building real-world projects and mastering modern web technologies.</p>
          </div>
        </div>
        <div class="wizard-right">
          <div style="max-width:400px;margin:0 auto;width:100%">
            <div class="wizard-dots">
              ${slides.map((_, i) => `<div class="wizard-dot ${i === slide ? 'active' : ''}"></div>`).join('')}
            </div>
            
            <div class="wizard-slide active">
              <div style="color:var(--brand-primary);margin-bottom:var(--space-6)">${s.icon}</div>
              <h2 style="font-size:2rem;margin-bottom:var(--space-4)">${s.title}</h2>
              <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:var(--space-8);line-height:1.6">${s.text}</p>
              
              ${isLast ? `
                <div class="input-group" style="margin-bottom:var(--space-8)">
                  <label>What should we call you?</label>
                  <div style="position:relative">
                    <i class="fa-solid fa-user" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-muted)"></i>
                    <input id="welcome-name" class="input" style="padding-left:48px;font-size:1.1rem" placeholder="Enter your display name" type="text" required />
                  </div>
                </div>
              ` : ''}

              <div style="display:flex;gap:var(--space-4);align-items:center">
                ${slide > 0 ? `<button id="welcome-prev" class="btn btn-ghost" style="padding:var(--space-3)">Back</button>` : ''}
                <button id="welcome-next" class="btn btn-primary" style="flex:1;padding:var(--space-3) var(--space-6);font-size:1.1rem">
                  ${isLast ? 'Complete Setup <i class="fa-solid fa-check" style="margin-left:8px"></i>' : 'Continue <i class="fa-solid fa-arrow-right" style="margin-left:8px"></i>'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
        `;

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
                await startMainApp();
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
        return `
            <div class="course-card" data-animate onclick="location.hash='/course/${course.id}'">
              ${course.thumbnail ? `<div class="course-thumb"><img src="${base}${course.thumbnail}" alt="${course.title}" onerror="this.parentElement.innerHTML='<div class=\\'course-thumb-placeholder\\'><i class=\\'${course.icon}\\'></i></div>'"></div>` : `<div class="course-thumb-placeholder"><i class="${course.icon}"></i></div>`}
              <div class="course-body">
                <div class="course-meta">
                  <span class="badge badge-primary">${course.difficulty}</span>
                  <span class="text-sm text-muted">${course.estimatedHours}h estimated</span>
                </div>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-desc">${course.description}</p>
                ${percent > 0 ? `
                <div style="margin-bottom:var(--space-3)">
                  <div class="progress-track" style="height:4px">
                    <div class="progress-fill" style="width:${percent}%"></div>
                  </div>
                  <span class="text-sm text-muted">${percent}% complete</span>
                </div>
                ` : ''}
                <div class="course-footer">
                  <span class="course-lessons-count"><i class="fa-solid fa-book"></i> ${course.totalLessons} lessons</span>
                  <span class="btn btn-sm btn-ghost">Start <i class="fa-solid fa-arrow-right"></i></span>
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
        return `
            <div class="course-card" onclick="location.hash='/course/${course.id}'" data-animate>
              ${course.thumbnail ? `<div class="course-thumb"><img src="${base}${course.thumbnail}" alt="${course.title}" onerror="this.parentElement.innerHTML='<div class=\\'course-thumb-placeholder\\'><i class=\\'${course.icon}\\'></i></div>'"></div>` : `<div class="course-thumb-placeholder"><i class="${course.icon}"></i></div>`}
              <div class="course-body">
                <div class="course-meta">
                  <span class="badge badge-primary">${course.difficulty}</span>
                  <span class="text-sm text-muted">${course.estimatedHours}h</span>
                </div>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-desc">${course.description}</p>
                ${percent > 0 ? `
                <div style="margin-bottom:var(--space-3)">
                  <div class="progress-track" style="height:4px">
                    <div class="progress-fill" style="width:${percent}%"></div>
                  </div>
                  <span class="text-sm text-muted">${percent}% complete</span>
                </div>` : ''}
                <div class="course-footer">
                  <span class="course-lessons-count"><i class="fa-solid fa-book"></i> ${course.totalLessons} lessons</span>
                  <span class="btn btn-sm btn-primary">${percent > 0 ? 'Continue' : 'Start'} <i class="fa-solid fa-arrow-right"></i></span>
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

function renderCourse(params) {
    const course = coursesData.find(c => c.id === params.courseId);
    if (!course) {
        $('#app').innerHTML = '<div class="container" style="padding:var(--space-16)"><h1>Course not found</h1><a href="#/courses"><i class="fa-solid fa-arrow-left"></i> Back to courses</a></div>';
        return;
    }

    const courseLessons = lessonsData.filter(l => l.courseId === course.id).sort((a, b) => a.order - b.order);
    const firstLesson = courseLessons[0];

    if (firstLesson) {
        window.location.hash = `/lesson/${course.id}/${firstLesson.id}`;
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
            <span class="lesson-meta-item">
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
    new SidebarComponent('#course-sidebar', course, courseLessons, lessonId);

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
        storage.completeLesson(courseId, lessonId);
        showToast('Lesson marked as complete!', 'success');
        // Sync to cloud
        const uid = authService.getUid();
        if (uid) firestoreService.saveProgress(uid, storage.getProgress());
        new SidebarComponent('#course-sidebar', course, courseLessons, lessonId);
        $('#mark-complete-btn').style.display = 'none';
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
          <button class="btn btn-outline btn-sm" id="edit-profile-btn"><i class="fa-solid fa-pen"></i> Edit Profile</button>
        </div>

        <!-- Top Overview -->
        <div class="grid" style="grid-template-columns: 300px 1fr; gap:var(--space-6); margin-bottom:var(--space-6);">
          
          <!-- Identity Card -->
          <div class="card" style="text-align:center; padding:var(--space-8) var(--space-6);">
            <div class="avatar avatar-lg" style="margin: 0 auto var(--space-4); width: 80px; height: 80px; font-size: 2rem; box-shadow: var(--shadow-glow);">
              ${profile.name.charAt(0).toUpperCase()}
            </div>
            <h3 style="font-size:var(--text-xl); margin-bottom:var(--space-1)">${profile.name}</h3>
            ${email ? `<p class="text-sm text-muted" style="margin-bottom:var(--space-4)">${email}</p>` : ''}
            
            <div class="badge badge-primary" style="margin-bottom:var(--space-6)">ProCode Student</div>
            
            <div class="divider"></div>
            
            <div style="display:flex; justify-content:space-between; text-align:left; font-size:var(--text-sm);">
                <span class="text-muted">Member Since</span>
                <span style="font-weight:600">${new Date(profile.joinDate).toLocaleDateString([], {month: 'short', year: 'numeric'})}</span>
            </div>
            <div style="display:flex; justify-content:space-between; text-align:left; font-size:var(--text-sm); margin-top:var(--space-2);">
                <span class="text-muted">Global Rank</span>
                <span style="font-weight:600; color:var(--brand-primary-light);">Top 15%</span>
            </div>
          </div>

          <!-- Highlight Metric Cards -->
          <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap:var(--space-4); align-items:start;">
            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Lessons Completed</span>
                   <i class="fa-solid fa-graduation-cap text-gradient"></i>
                </div>
                <div style="font-size: 2.5rem; font-weight:800; line-height:1;">${totalCompleted}</div>
                <div class="text-sm" style="color:var(--color-success);"><i class="fa-solid fa-arrow-trend-up"></i> +4 this week</div>
            </div>
            
            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Challenges Solved</span>
                   <i class="fa-solid fa-code text-gradient"></i>
                </div>
                <div style="font-size: 2.5rem; font-weight:800; line-height:1;">${totalChallenges}</div>
                <div class="text-sm" style="color:var(--color-success);"><i class="fa-solid fa-arrow-trend-up"></i> +2 this week</div>
            </div>

            <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                   <span>Learning Streak</span>
                   <i class="fa-solid fa-fire" style="color:#fdcb6e;"></i>
                </div>
                <div style="font-size: 2.5rem; font-weight:800; line-height:1;">3 <span style="font-size:1rem;font-weight:normal;color:var(--text-muted)">Days</span></div>
                <div class="text-sm text-muted">Keep it up!</div>
            </div>

            <!-- Chart Section span full width -->
            <div class="card" style="grid-column: span 3; padding:var(--space-6);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <h3 style="font-size:var(--text-lg);"><i class="fa-solid fa-chart-line"></i> Activity Overview</h3>
                </div>
                <div style="position: relative; height: 260px; width: 100%;">
                    <canvas id="activityChart"></canvas>
                </div>
            </div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-6)">
          <!-- Course Progress section -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-book-open"></i> Course Progress</h3>
            ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        return `
              <div style="margin-bottom:var(--space-5)">
                <div class="flex justify-between text-sm mb-2">
                  <span style="font-weight:600;"><i class="${course.icon}" style="margin-right:8px; color:var(--brand-primary-light);"></i> ${course.title}</span>
                  <span class="text-muted">${percent}%</span>
                </div>
                <div class="progress-track" style="height:6px; background:var(--bg-input);">
                  <div class="progress-fill" style="width:${percent}%; box-shadow: 0 0 10px var(--brand-primary-light);"></div>
                </div>
              </div>`;
    }).join('')}
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
            <div class="input-group mb-6">
                <label>Display Name</label>
                <input type="text" class="input" id="profile-name" value="${profile.name}" placeholder="Your name">
            </div>
            <div class="flex justify-end gap-3">
                <button class="btn btn-ghost" id="cancel-profile-modal">Cancel</button>
                <button class="btn btn-primary" id="save-profile">Save Changes</button>
            </div>
        </div>
    </div>
  `;

  // Render Charts
  setTimeout(() => {
        const ctx = document.getElementById('activityChart');
        if (ctx && window.Chart) {
            Chart.defaults.color = theme === 'dark' ? '#94a3b8' : '#64748b';
            Chart.defaults.font.family = "'Inter', sans-serif";
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Lessons',
                            data: [1, 2, 0, 3, 1, 4, 2],
                            backgroundColor: 'rgba(108, 92, 231, 0.8)',
                            borderRadius: 4,
                        },
                        {
                            label: 'Challenges',
                            data: [0, 1, 0, 2, 0, 3, 1],
                            backgroundColor: 'rgba(0, 206, 201, 0.8)',
                            borderRadius: 4,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: { boxWidth: 12, usePointStyle: true }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                            ticks: { precision: 0 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }, 100);

    // Edit Profile Modal Logic
    const modal = document.getElementById('edit-profile-modal');
    $('#edit-profile-btn')?.addEventListener('click', () => modal.classList.add('active'));
    $('#close-profile-modal')?.addEventListener('click', () => modal.classList.remove('active'));
    $('#cancel-profile-modal')?.addEventListener('click', () => modal.classList.remove('active'));

    // Save Profile
    $('#save-profile')?.addEventListener('click', async () => {
        const name = $('#profile-name').value.trim();
        if (name) {
            storage.updateProfile({ name });
            showToast('Profile updated!', 'success');
            renderNavbar();
            modal.classList.remove('active');
            renderProfile(); // re-render to update the ui
            
            // Sync to Firebase
            const uid = authService.getUid();
            if (uid) {
                await authService.updateDisplayName(name);
                await firestoreService.saveUserProfile(uid, { name });
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
    }

    const sidebarHtml = docsData.map(cat => `
        <div class="docs-category">
            <div class="docs-category-title"><i class="${cat.icon}"></i> ${cat.title}</div>
            ${cat.docs.map(doc => `
                <a href="#/docs/${doc.id}" class="docs-nav-link ${doc.id === activeDoc?.id ? 'active' : ''}">
                    ${doc.title}
                </a>
            `).join('')}
        </div>
    `).join('');

    app.innerHTML = `
      <div class="docs-layout">
        <aside class="docs-sidebar">
          <div style="margin-bottom:var(--space-6)">
            <input type="text" class="input" placeholder="Search docs..." style="width:100%" id="docs-search">
          </div>
          ${sidebarHtml}
        </aside>
        <main class="docs-main animate-slideUp">
          ${activeDoc ? `
            <div class="mb-4 text-muted" style="font-size:var(--text-sm)">
              ${activeCategory?.title} / <span style="color:var(--text-primary)">${activeDoc.title}</span>
            </div>
            <div class="docs-content">
              ${activeDoc.content}
            </div>
          ` : `
            <div class="empty-state text-center" style="padding:var(--space-16) 0">
              <div class="empty-state-icon"><i class="fa-solid fa-book-open"></i></div>
              <h3>Documentation Not Found</h3>
              <p class="text-muted">The requested document could not be found.</p>
            </div>
          `}
        </main>
      </div>
    `;
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
    
    app.innerHTML = `
      <div class="container" style="max-width:800px;padding:var(--space-16) 0">
        <div class="careers-banner animate-scaleIn">
          <i class="fa-solid fa-briefcase fa-3x" style="color:var(--brand-primary);margin-bottom:var(--space-6)"></i>
          <h1 style="margin-bottom:var(--space-4)">Join Our Mission</h1>
          <p style="font-size:1.1rem;color:var(--text-secondary);max-width:500px;margin:0 auto">
            We are building the future of interactive developer education.
          </p>
        </div>

        <div class="card animate-slideUp text-center" style="padding:var(--space-10)">
          <div style="font-size:4rem;color:var(--border-subtle);margin-bottom:var(--space-4)"><i class="fa-solid fa-mug-hot"></i></div>
          <h3 style="margin-bottom:var(--space-2)">No open roles right now</h3>
          <p class="text-muted" style="margin-bottom:var(--space-6)">
            We're currently a small, focused team. However, we're always on the lookout for passionate contributors to our open-source projects!
          </p>
          <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank" class="btn btn-outline">View GitHub Repo</a>
        </div>
      </div>
    `;
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
// APP INITIALIZATION
// ══════════════════════════════════════════════

async function startMainApp() {
    renderNavbar();
    await loadData();
    setupGlobalSearch();

    const router = new Router();
    router
        .on('/', () => transitionPage(renderLanding))
        .on('/courses', () => transitionPage(renderCoursesPage))
        .on('/course/:courseId', (params) => transitionPage(() => renderCourse(params)))
        .on('/lesson/:courseId/:lessonId', (params) => transitionPage(() => renderLesson(params)))
        .on('/roadmaps', () => transitionPage(renderRoadmapsPage))
        .on('/docs', () => transitionPage(renderDocsPage))
        .on('/docs/:docId', (params) => transitionPage(() => renderDocsPage(params)))
        .on('/portfolio', () => transitionPage(renderPortfolio))
        .on('/profile', () => transitionPage(renderProfile))
        .on('/about', () => transitionPage(renderAboutPage))
        .on('/careers', () => transitionPage(renderCareersPage))
        .on('/login', () => transitionPage(renderLoginPage))
        .on('/signup', () => transitionPage(renderSignupPage))
        .on('*', () => transitionPage(renderLanding));

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

    // If Firebase is configured but user is not logged in, show login
    if (isFirebaseConfigured() && !user && hash !== '/signup') {
        window.location.hash = '/login';
        // Set up a minimal router for auth pages only
        const router = new Router();
        router
            .on('/login', () => renderLoginPage())
            .on('/signup', () => renderSignupPage())
            .on('*', () => renderLoginPage());
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
