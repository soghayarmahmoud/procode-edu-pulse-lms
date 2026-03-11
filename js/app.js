// ============================================
// ProCode EduPulse — Main Application
// ============================================

import { Router } from './utils/router.js';
import { $, animateOnScroll, showToast } from './utils/dom.js';
import { storage } from './services/storage.js';
import { renderNavbar } from './components/navbar.js';
import { initTheme } from './components/theme-toggle.js';
import { PortfolioComponent } from './components/portfolio.js';

// ── Base Path Helper (GitHub Pages compatibility) ──
function getBasePath() {
    const path = window.location.pathname;
    // If deployed to a subdirectory (e.g. /procode-edu-pulse-lms/), use that as base
    if (path !== '/' && path !== '/index.html') {
        // Extract the first path segment as repo name
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

    // fade out
    app.style.opacity = 0;

    setTimeout(() => {
        renderFn();        // render new page
        app.style.opacity = 1;  // fade in
    }, 200);
}

// ── Page Renderers ──
function showWelcomeModel() {
  const app = $('#app');

  if (localStorage.getItem('procode_onboarding_done') === 'true') return;

  let slide = 0;

  const slides = [
    {
      title: "Welcome to ProCode 🚀",
      text: "Learn web development with structured lessons, projects, and interactive coding."
    },
    {
      title: "Interactive Coding 💻",
      text: "Practice directly in the browser using the built-in code editor with live preview."
    },
    {
      title: "Track Your Progress 📊",
      text: "Courses remember your progress and show completion percentages."
    },
    {
      title: "Build Your Portfolio 🎯",
      text: "Every challenge you complete becomes part of your developer portfolio."
    }
  ];

  function renderSlide() {
    const s = slides[slide];

    app.innerHTML = `
      <div class="modal-overlay active">

        <div class="modal animate-scaleIn text-center">

          <div class="mb-6">
            <span class="badge badge-primary mb-4">Getting Started</span>
            <h3 class="mb-2">${s.title}</h3>
            <p class="text-muted">${s.text}</p>
          </div>

          <div class="flex justify-center gap-2 mb-6">
            ${slides.map((_, i) => `
              <span 
                style="
                  width:10px;
                  height:10px;
                  border-radius:var(--radius-full);
                  background:${i === slide ? 'var(--brand-primary)' : 'var(--border-subtle)'};
                  display:inline-block;
                ">
              </span>
            `).join('')}
          </div>

          ${slide === slides.length - 1 ? `
            <div class="input-group mb-6">
              <label>Your Name</label>
              <input 
                id="welcome-name"
                class="input"
                placeholder="Enter your name"
                type="text"
                required
              />
            </div>
          ` : ''}

          <div class="flex justify-center gap-3">
            ${slide > 0 ? `
              <button id="welcome-prev" class="btn btn-ghost">
                Back
              </button>
            ` : ``}

            <button id="welcome-next" class="btn btn-primary">
              ${slide === slides.length - 1 ? 'Get Started →' : 'Next →'}
            </button>
          </div>

        </div>

      </div>
    `;

    const next = $('#welcome-next');
    const prev = $('#welcome-prev');

    if (prev) {
      prev.onclick = () => {
        slide--;
        renderSlide();
      };
    }

     next.onclick = async() => {
      if (slide === slides.length - 1) {
        const name = $('#welcome-name')?.value?.trim();

        if (name) {
          localStorage.setItem('procode_user_name', name);
        }

        localStorage.setItem('procode_onboarding_done', 'true');  
        // remove modal UI
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
        await initApp();
        location.hash = "/courses";

      } else {
        slide++;
        renderSlide();
      }
    };
  }

  renderSlide();
}


function renderLanding() {
    const app = $('#app');
    const totalLessons = coursesData.reduce((sum, c) => sum + c.totalLessons, 0);

    app.innerHTML = `
    <section class="hero bg-dots-pattern">
      <div class="container flex items-center">
        <div class="hero-content">
          <div class="hero-badge">
            🚀 Learn to Code, Build Real Projects
          </div>
          <h1 class="hero-title">
            Master Web Development with
            <span class="text-gradient">ProCode</span>
          </h1>
          <p class="hero-subtitle">
            Transform from a passive YouTube viewer into an active developer. 
            Structured courses, interactive coding challenges, and AI-powered assistance — all in one platform.
          </p>
          <div class="hero-actions">
            <a href="#/courses" class="btn btn-primary btn-lg">
              Start Learning →
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
            <pre class="hero-code"><span class="comment">// Your coding journey starts here 🎯</span>
<span class="keyword">const</span> <span class="function">student</span> = {
  <span class="attr">name</span>: <span class="string">"You"</span>,
  <span class="attr">level</span>: <span class="string">"Beginner → Pro"</span>,
  <span class="attr">skills</span>: [<span class="string">"HTML"</span>, <span class="string">"CSS"</span>, <span class="string">"JS"</span>],
  <span class="attr">projects</span>: <span class="function">portfolio</span>.<span class="function">getAll</span>()
};

<span class="keyword">function</span> <span class="function">startLearning</span>() {
  <span class="keyword">return</span> <span class="string">"🚀 Let's build!"</span>;
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
          <span class="section-badge">✨ Features</span>
          <h2 class="section-title">Everything You Need to Learn Code</h2>
          <p class="section-subtitle">A complete ecosystem designed for aspiring developers</p>
        </div>

        <div class="features-grid">
          <div class="feature-card" data-animate>
            <div class="feature-icon">📺</div>
            <h3 class="feature-title">YouTube Integration</h3>
            <p class="feature-desc">Watch lessons with YouTube videos embedded alongside notes, cheat sheets, and downloadable resources.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon">💻</div>
            <h3 class="feature-title">Interactive Code Editor</h3>
            <p class="feature-desc">Write and preview HTML/CSS/JS directly in the browser with syntax highlighting and live preview.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Progress Tracking</h3>
            <p class="feature-desc">Visual progress bars, completion tracking, and quiz scores saved across sessions.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">Coding Challenges</h3>
            <p class="feature-desc">Automated validation checks your code in real-time. Pass challenges to unlock the next lesson.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon">🤖</div>
            <h3 class="feature-title">AI-Powered Hints</h3>
            <p class="feature-desc">Stuck? Get context-aware hints from an AI tutor that guides you without giving away the answer.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon">📁</div>
            <h3 class="feature-title">Project Portfolio</h3>
            <p class="feature-desc">Every completed challenge builds your portfolio. Download your work as a ZIP or preview it live.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="courses-section" data-animate>
      <div class="container">
        <div class="section-header">
          <span class="section-badge">📚 Courses</span>
          <h2 class="section-title">Start Your Learning Path</h2>
          <p class="section-subtitle">Structured courses from beginner to advanced</p>
        </div>

        <div class="grid grid-3 gap-6">
          ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        return `
            <div class="course-card" data-animate onclick="location.hash='/course/${course.id}'">
              <div class="course-thumb-placeholder">${course.icon}</div>
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
                  <span class="course-lessons-count">📖 ${course.totalLessons} lessons</span>
                  <span class="btn btn-sm btn-ghost">Start →</span>
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
            Get Started for Free →
          </a>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="${getBasePath()}logo.png" alt="ProCode" onerror="this.style.display='none'">
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
              <a href="https://youtube.com" target="_blank">YouTube Channel</a>
              <a href="https://github.com/soghayarmahmoud" target="_blank">GitHub</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ProCode EduPulse. Built with ❤️ for learners.</span>
          <div class="footer-social">
            <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms" target="_blank" title="GitHub">💻</a>
            <a href="https://youtube.com" target="_blank" title="YouTube">📺</a>
          </div>
        </div>
      </div>
    </footer>
  `;

    animateOnScroll();
}

function renderCoursesPage() {
    const app = $('#app');

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left;margin-bottom:var(--space-10)">
          <span class="section-badge">📚 All Courses</span>
          <h1 class="section-title">Course Catalog</h1>
          <p class="section-subtitle" style="margin:0">Choose a course and start your learning journey</p>
        </div>

        <div class="grid grid-3 gap-6">
          ${coursesData.map(course => {
        const percent = storage.getCourseCompletionPercent(course.id, course.totalLessons);
        return `
            <div class="course-card" onclick="location.hash='/course/${course.id}'" data-animate>
              <div class="course-thumb-placeholder">${course.icon}</div>
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
                  <span class="course-lessons-count">📖 ${course.totalLessons} lessons</span>
                  <span class="btn btn-sm btn-primary">${percent > 0 ? 'Continue' : 'Start'} →</span>
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
        $('#app').innerHTML = '<div class="container" style="padding:var(--space-16)"><h1>Course not found</h1><a href="#/courses">← Back to courses</a></div>';
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
        $('#app').innerHTML = '<div class="container" style="padding:var(--space-16)"><h1>Lesson not found</h1><a href="#/courses">← Back to courses</a></div>';
        return;
    }

    const courseLessons = lessonsData.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
    const currentIndex = courseLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;
    const isCompleted = storage.isLessonCompleted(courseId, lessonId);

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
            <span class="lesson-meta-item">
              ${lesson.type === 'theory' ? '📖 Theory' : lesson.type === 'practice' ? '💻 Practice' : '🎯 Project'}
            </span>
            <span class="lesson-meta-item">⏱ ${lesson.duration || 'N/A'}</span>
            <span class="lesson-meta-item">
              ${isCompleted ? '<span class="badge badge-success">✓ Completed</span>' : '<span class="badge badge-warning">In Progress</span>'}
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
                <div class="content-tab active" data-tab="notes">📖 Lesson Notes</div>
                <div class="content-tab" data-tab="cheatsheet">📋 Cheat Sheet</div>
                <div class="content-tab" data-tab="resources">🔗 Resources</div>
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
                        <span>🔗</span>
                        <span>${r.name}</span>
                        <span style="margin-left:auto;color:var(--text-muted)">↗</span>
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
                  <button class="editor-action-btn" id="lesson-run-code">▶ Run</button>
                  <button class="editor-action-btn" id="lesson-reset-code">↻ Reset</button>
                  <button class="editor-action-btn" id="lesson-copy-code">📋 Copy</button>
                  <button class="editor-action-btn" id="shortcuts-help-btn" title="Keyboard Shortcuts">⌨️</button>
                  <div class="shortcuts-tooltip" id="shortcuts-tooltip">
                    <div class="shortcuts-tooltip-title">⌨️ Keyboard Shortcuts</div>
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
                <span class="preview-title">👁 Live Preview</span>
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
              ← ${prevLesson.title}
            </a>
          ` : '<div></div>'}
          
          ${!isCompleted ? `
            <button class="btn btn-primary complete-lesson-btn" id="mark-complete-btn">
              ✓ Mark as Complete
            </button>
          ` : ''}

          ${nextLesson ? `
            <a href="#/lesson/${courseId}/${nextLesson.id}" class="lesson-nav-btn">
              ${nextLesson.title} →
            </a>
          ` : '<div></div>'}
        </div>
      </main>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
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
        const { showToast } = {
            showToast: (msg, type) => {
                import('./utils/dom.js').then(m => m.showToast(msg, type));
            }
        };
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
        import('./utils/dom.js').then(m => m.showToast('Lesson marked as complete!', 'success'));
        // Refresh sidebar
        new SidebarComponent('#course-sidebar', course, courseLessons, lessonId);
        // Hide button
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

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left;margin-bottom:var(--space-10)">
          <span class="section-badge">👤 Profile</span>
          <h1 class="section-title">Your Profile</h1>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-6)">
          <!-- Profile Card -->
          <div class="card">
            <div class="flex items-center gap-4 mb-6">
              <div class="avatar avatar-lg">${profile.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style="font-size:var(--text-xl)">${profile.name}</h3>
                <p class="text-sm text-muted">Joined ${new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="input-group mb-4">
              <label>Display Name</label>
              <input type="text" class="input" id="profile-name" value="${profile.name}" placeholder="Your name">
            </div>
            
            <button class="btn btn-primary btn-sm" id="save-profile">Save Changes</button>
          </div>

          <!-- Stats Card -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-6)">📊 Your Stats</h3>
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
                  <span>${course.icon} ${course.title}</span>
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
          <h3 style="margin-bottom:var(--space-6)">⚙️ Settings</h3>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-8)">
            <div>
              <h4 style="margin-bottom:var(--space-4)">Appearance</h4>
              <div class="flex items-center justify-between mb-4" style="padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md)">
                <span>Theme</span>
                <div class="tabs" style="background:var(--bg-secondary)">
                  <span class="tab ${theme === 'dark' ? 'active' : ''}" data-theme-option="dark">🌙 Dark</span>
                  <span class="tab ${theme === 'light' ? 'active' : ''}" data-theme-option="light">☀️ Light</span>
                </div>
              </div>
            </div>
            <div>
              <h4 style="margin-bottom:var(--space-4)">AI Hints</h4>
              <div class="input-group mb-4">
                <label>Gemini API Key (optional)</label>
                <input type="password" class="input" id="ai-api-key" placeholder="Enter your API key for AI hints">
              </div>
              <button class="btn btn-secondary btn-sm" id="save-api-key">Save API Key</button>
            </div>
          </div>
          
          <div class="divider"></div>
          <div>
            <h4 style="margin-bottom:var(--space-4);color:var(--color-error)">Danger Zone</h4>
            <button class="btn btn-outline btn-sm" style="border-color:var(--color-error);color:var(--color-error)" id="reset-data-btn">
              ⚠ Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    // Save Profile
    $('#save-profile')?.addEventListener('click', () => {
        const name = $('#profile-name').value.trim();
        if (name) {
            storage.updateProfile({ name });
            import('./utils/dom.js').then(m => m.showToast('Profile updated!', 'success'));
            renderNavbar();
        }
    });

    // Theme tabs
    app.querySelectorAll('[data-theme-option]').forEach(tab => {
        tab.addEventListener('click', () => {
            app.querySelectorAll('[data-theme-option]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            storage.setTheme(tab.dataset.themeOption);
            const toggle = document.getElementById('theme-toggle');
            if (toggle) toggle.textContent = tab.dataset.themeOption === 'dark' ? '☀️' : '🌙';
        });
    });

    // Save API Key
    $('#save-api-key')?.addEventListener('click', () => {
        const key = $('#ai-api-key').value.trim();
        if (key) {
            import('./services/ai-service.js').then(m => {
                m.aiService.configure({ apiKey: key });
            });
            import('./utils/dom.js').then(m => m.showToast('API key saved!', 'success'));
        }
    });

    // Reset data
    $('#reset-data-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure? This will reset ALL your progress, notes, and submissions.')) {
            storage.resetAll();
            import('./utils/dom.js').then(m => m.showToast('All data reset.', 'info'));
            renderProfile();
        }
    });
}

// ── Initialize App ──

async function initApp() {
    // Init theme
    initTheme();
    
    const onboardingDone = localStorage.getItem("procode_onboarding_done") === "true";

    if (!onboardingDone) {
      showWelcomeModel();
    } else {
  renderNavbar();
  await loadData();
  // Setup router
    const router = new Router();

    router
        .on('/', () => transitionPage(renderLanding))
        .on('/courses', () => transitionPage(renderCoursesPage))
        .on('/course/:courseId', (params) => transitionPage(() => renderCourse(params)))
        .on('/lesson/:courseId/:lessonId', (params) => transitionPage(() => renderLesson(params)))
        .on('/portfolio', () => transitionPage(renderPortfolio))
        .on('/profile', () => transitionPage(renderProfile))
        .on('*', () => transitionPage(renderLanding));

    // Back to Top button
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('back-to-top');
        btn.classList.toggle('visible', window.scrollY > 400);
    });
    document.getElementById('back-to-top').onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // ── Global Keyboard Shortcuts ──
    document.addEventListener('keydown', (e) => {
        // Ctrl+S — Prevent browser save, show toast
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
            e.preventDefault();
            showToast('Auto-saved! ✓', 'success');
            return;
        }

        // Ctrl+Enter — Run code (update preview)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const runBtn = document.getElementById('lesson-run-code');
            if (runBtn) {
                e.preventDefault();
                runBtn.click();
            }
            return;
        }

        // Ctrl+Shift+C — Copy code to clipboard
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            const copyBtn = document.getElementById('lesson-copy-code');
            if (copyBtn) {
                e.preventDefault();
                copyBtn.click();
            }
            return;
        }

        // Ctrl+Shift+R — Reset code
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
            const resetBtn = document.getElementById('lesson-reset-code');
            if (resetBtn) {
                e.preventDefault();
                resetBtn.click();
            }
            return;
        }

        // Escape — Close modal/hint
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            const tooltip = document.querySelector('.shortcuts-tooltip.visible');
            if (tooltip) tooltip.classList.remove('visible');
        }
    }, true);
  } // end else (onboarding done)
} // end initApp
// Boot
initApp().catch(err => {
    console.error('Failed to initialize app:', err);
    document.getElementById('app').innerHTML = `
    <div class="container" style="padding:var(--space-16);text-align:center">
      <h1>⚠️ Failed to load</h1>
      <p>Please check the console for errors and ensure data files are accessible.</p>
    </div>
  `;
});
