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

async function loadData() {
    const base = getBasePath();
    const [courses, lessons, quizzes, challenges] = await Promise.all([
        fetch(`${base}data/courses.json`).then(r => r.json()),
        fetch(`${base}data/lessons.json`).then(r => r.json()),
        fetch(`${base}data/quizzes.json`).then(r => r.json()),
        fetch(`${base}data/challenges.json`).then(r => r.json())
    ]);
    coursesData = courses.courses;
    lessonsData = lessons.lessons;
    quizzesData = quizzes.quizzes;
    challengesData = challenges.challenges;
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
            icon: '<i class="fa-solid fa-rocket fa-2x" style="color:var(--brand-primary)"></i>',
            title: "Welcome to ProCode",
            text: "Learn web development with structured lessons, projects, and interactive coding."
        },
        {
            icon: '<i class="fa-solid fa-laptop-code fa-2x" style="color:var(--brand-primary)"></i>',
            title: "Interactive Coding",
            text: "Practice directly in the browser using the built-in code editor with live preview."
        },
        {
            icon: '<i class="fa-solid fa-chart-bar fa-2x" style="color:var(--brand-primary)"></i>',
            title: "Track Your Progress",
            text: "Courses remember your progress and show completion percentages."
        },
        {
            icon: '<i class="fa-solid fa-bullseye fa-2x" style="color:var(--brand-primary)"></i>',
            title: "Build Your Portfolio",
            text: "Every challenge you complete becomes part of your developer portfolio."
        }
    ];

    function renderSlide() {
        const s = slides[slide];
        app.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal animate-scaleIn text-center">
          <div class="mb-6">
            <div class="mb-4">${s.icon}</div>
            <span class="badge badge-primary mb-4">Getting Started</span>
            <h3 class="mb-2">${s.title}</h3>
            <p class="text-muted">${s.text}</p>
          </div>

          <div class="flex justify-center gap-2 mb-6">
            ${slides.map((_, i) => `
              <span style="width:10px;height:10px;border-radius:var(--radius-full);background:${i === slide ? 'var(--brand-primary)' : 'var(--border-subtle)'};display:inline-block;"></span>
            `).join('')}
          </div>

          ${slide === slides.length - 1 ? `
            <div class="input-group mb-6">
              <label>Your Name</label>
              <input id="welcome-name" class="input" placeholder="Enter your name" type="text" required />
            </div>
          ` : ''}

          <div class="flex justify-center gap-3">
            ${slide > 0 ? `<button id="welcome-prev" class="btn btn-ghost">Back</button>` : ''}
            <button id="welcome-next" class="btn btn-primary">
              ${slide === slides.length - 1 ? 'Get Started <i class="fa-solid fa-arrow-right"></i>' : 'Next <i class="fa-solid fa-arrow-right"></i>'}
            </button>
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
            if (slide === slides.length - 1) {
                const name = $('#welcome-name')?.value?.trim();
                if (name) {
                    localStorage.setItem('procode_user_name', name);
                    storage.updateProfile({ name });
                    // Sync name to Firebase if logged in
                    const uid = authService.getUid();
                    if (uid) {
                        await authService.updateDisplayName(name);
                        await firestoreService.saveUserProfile(uid, { name });
                    }
                }
                localStorage.setItem('procode_onboarding_done', 'true');
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) overlay.remove();
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
        <div class="section-header" style="text-align:left;margin-bottom:var(--space-10)">
          <span class="section-badge"><i class="fa-solid fa-user"></i> Profile</span>
          <h1 class="section-title">Your Profile</h1>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-6)">
          <!-- Profile Card -->
          <div class="card">
            <div class="flex items-center gap-4 mb-6">
              <div class="avatar avatar-lg">${profile.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style="font-size:var(--text-xl)">${profile.name}</h3>
                ${email ? `<p class="text-sm text-muted">${email}</p>` : ''}
                <p class="text-sm text-muted">Joined ${new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="input-group mb-4">
              <label>Display Name</label>
              <input type="text" class="input" id="profile-name" value="${profile.name}" placeholder="Your name">
            </div>
            
            <button class="btn btn-primary btn-sm" id="save-profile"><i class="fa-solid fa-save"></i> Save Changes</button>
          </div>

          <!-- Stats Card -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-chart-bar"></i> Your Stats</h3>
            <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="card" style="text-align:center;padding:var(--space-4)">
                <div style="font-size:var(--text-3xl);font-weight:800" class="text-gradient">${totalCompleted}</div>
                <div class="text-sm text-muted">Lessons Completed</div>
              </div>
              <div class="card" style="text-align:center;padding:var(--space-4)">
                <div style="font-size:var(--text-3xl);font-weight:800" class="text-gradient">${totalChallenges}</div>
                <div class="text-sm text-muted">Challenges Passed</div>
              </div>
            </div>

            <div class="divider"></div>

            <h4 style="margin-bottom:var(--space-4)">Course Progress</h4>
            ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        return `
              <div style="margin-bottom:var(--space-4)">
                <div class="flex justify-between text-sm mb-2">
                  <span><i class="${course.icon}"></i> ${course.title}</span>
                  <span class="text-muted">${percent}%</span>
                </div>
                <div class="progress-track" style="height:6px">
                  <div class="progress-fill" style="width:${percent}%"></div>
                </div>
              </div>`;
    }).join('')}
          </div>
        </div>

        <!-- Settings -->
        <div class="card" style="margin-top:var(--space-6)">
          <h3 style="margin-bottom:var(--space-6)"><i class="fa-solid fa-gear"></i> Settings</h3>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-8)">
            <div>
              <h4 style="margin-bottom:var(--space-4)">Appearance</h4>
              <div class="flex items-center justify-between mb-4" style="padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md)">
                <span>Theme</span>
                <div class="tabs" style="background:var(--bg-secondary)">
                  <span class="tab ${theme === 'dark' ? 'active' : ''}" data-theme-option="dark"><i class="fa-solid fa-moon"></i> Dark</span>
                  <span class="tab ${theme === 'light' ? 'active' : ''}" data-theme-option="light"><i class="fa-solid fa-sun"></i> Light</span>
                </div>
              </div>
            </div>
            <div>
              <h4 style="margin-bottom:var(--space-4)">AI Hints</h4>
              <div class="input-group mb-4">
                <label>Gemini API Key (optional)</label>
                <input type="password" class="input" id="ai-api-key" placeholder="Enter your API key for AI hints">
              </div>
              <button class="btn btn-secondary btn-sm" id="save-api-key"><i class="fa-solid fa-key"></i> Save API Key</button>
            </div>
          </div>
          
          <div class="divider"></div>
          <div>
            <h4 style="margin-bottom:var(--space-4);color:var(--color-error)">Danger Zone</h4>
            <button class="btn btn-outline btn-sm" style="border-color:var(--color-error);color:var(--color-error)" id="reset-data-btn">
              <i class="fa-solid fa-triangle-exclamation"></i> Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    // Save Profile
    $('#save-profile')?.addEventListener('click', async () => {
        const name = $('#profile-name').value.trim();
        if (name) {
            storage.updateProfile({ name });
            showToast('Profile updated!', 'success');
            renderNavbar();
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
            storage.setTheme(tab.dataset.themeOption);
            const toggle = document.getElementById('theme-toggle');
            if (toggle) {
                const icon = toggle.querySelector('i');
                icon.className = `fa-solid ${tab.dataset.themeOption === 'dark' ? 'fa-sun' : 'fa-moon'}`;
            }
        });
    });

    // Save API Key
    $('#save-api-key')?.addEventListener('click', () => {
        const key = $('#ai-api-key').value.trim();
        if (key) {
            import('./services/ai-service.js').then(m => {
                m.aiService.configure({ apiKey: key });
            });
            showToast('API key saved!', 'success');
        }
    });

    // Reset data
    $('#reset-data-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure? This will reset ALL your progress, notes, and submissions.')) {
            storage.resetAll();
            showToast('All data reset.', 'info');
            renderProfile();
        }
    });
}

// ══════════════════════════════════════════════
// APP INITIALIZATION
// ══════════════════════════════════════════════

async function startMainApp() {
    renderNavbar();
    await loadData();

    const router = new Router();
    router
        .on('/', () => transitionPage(renderLanding))
        .on('/courses', () => transitionPage(renderCoursesPage))
        .on('/course/:courseId', (params) => transitionPage(() => renderCourse(params)))
        .on('/lesson/:courseId/:lessonId', (params) => transitionPage(() => renderLesson(params)))
        .on('/portfolio', () => transitionPage(renderPortfolio))
        .on('/profile', () => transitionPage(renderProfile))
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
