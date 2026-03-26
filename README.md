<p align="center">
  <img src="logo.png" alt="ProCode EduPulse" width="100">
</p>

<h1 align="center">ProCode EduPulse</h1>

<p align="center">
  <strong>An Open-Source Learning Management System for Coding Education</strong><br>
  <em>Turn passive learners into professional developers.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/CodeMirror-D30707?style=for-the-badge&logo=codemirror&logoColor=white" alt="CodeMirror">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/PRs-welcome-blue?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Firebase-configured-orange?style=flat-square" alt="Firebase">
  <img src="https://img.shields.io/badge/version-2.0.0--alpha-purple?style=flat-square" alt="Version">
</p>

---

## 🎯 Overview

ProCode EduPulse is a comprehensive, self-contained learning management system built entirely with **Vanilla JavaScript** — no frameworks, no build tools, just pure web fundamentals powered by Firebase for cloud persistence.

### Why ProCode?

| YouTube Alone | ProCode EduPulse |
|---|---|
| Linear video playback | Structured courses with progress tracking |
| No interactivity | In-browser code editor with live preview |
| No assessment | Quizzes + automated coding challenges |
| No personalization | AI-powered hints & timestamped notes |
| No portfolio | Auto-compiled project portfolio |
| No admin tools | Full CMS for instructors & admins |

---

## ✨ Features

### 🎓 Student Experience
- **YouTube Integration** — Videos embedded alongside lesson notes, cheat sheets, and resources
- **Interactive Code Playground** — CodeMirror 6 editor with syntax highlighting and live preview
- **Coding Challenges** — Frontend DOM validation + backend assertion testing via Piston API
- **Quizzes** — Multiple-choice assessments with explanations and scoring
- **Progress Tracking** — Persistent progress bars, completion status, and cloud sync
- **AI-Powered Hints** — Context-aware hints via Google Gemini API
- **Timestamped Notes** — Personal notes linked to video timestamps
- **Project Portfolio** — Auto-compiled from completed challenges, downloadable as ZIP
- **Dark/Light Mode** — Dev-friendly UI optimized for long sessions

### 🛡️ Admin & Instructor Panel
- **Unified Admin Dashboard** — Protected route with 7 management tabs
- **Course Builder** — Create/edit/delete courses with Cloudinary thumbnail uploads
- **Lesson Builder** — Attach video lessons (YouTube/Cloudinary) to any course
- **Challenge Builder** — Build coding challenges with validation rules or test assertions
- **User Management** — View all users, search, toggle admin roles (live Firestore data)
- **Live Dashboard Stats** — Real-time user count, course count, challenge count from Firestore
- **Content & Media** — Static catalog overview + Cloudinary CDN integration setup
- **Gamification Tuner** — Configure XP awards, gem economy, rank thresholds
- **Submissions Inbox** — Review student project submissions with approve/reject actions

### 🏗️ Platform Features
- **Firebase Authentication** — Google sign-in + email/password with cloud profile sync
- **Firestore Cloud Sync** — Progress, submissions, notes, and enrollments synced to cloud
- **Discussion Forums** — Per-lesson threaded discussions with code review requests
- **Certificate Generation** — Auto-generated completion certificates
- **Learning Roadmaps** — Visual skill trees for structured learning paths
- **Global Search** — Ctrl+K powered search across courses, lessons, and docs
- **Documentation Hub** — Built-in docs with sidebar navigation and search

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER (SPA)                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │ Router   │  │ Navbar   │  │ Sidebar  │  │ Theme Mgr  │   │
│  └────┬─────┘  └──────────┘  └──────────┘  └────────────┘   │
│       │                                                      │
│  ┌────▼─────────────────────────────────────────────────┐    │
│  │               PAGE RENDERERS (app.js)                │    │
│  │  Landing │ Courses │ Lessons │ Profile │ Admin │ ... │    │
│  └────┬─────────────────────────────────────────────────┘    │
│       │                                                      │
│  ┌────▼─────────────────────────────────────────────────┐    │
│  │                   COMPONENTS                          │    │
│  │ CodeEditor │ VideoPlayer │ Quiz │ Challenge │ Notes   │    │
│  │ Portfolio  │ Discussion  │ AdminDashboard │ ...       │    │
│  └────┬─────────────────────────────────────────────────┘    │
│       │                                                      │
│  ┌────▼─────────────────────────────────────────────────┐    │
│  │                    SERVICES                           │    │
│  │ Storage │ Firestore │ Auth │ AI │ Media │ Validation  │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
    ┌───────────▼──────┐       ┌───────────▼──────┐
    │ Firebase (Auth   │       │ External APIs    │
    │ + Firestore)     │       │ Piston, Gemini,  │
    │                  │       │ Cloudinary, YT   │
    └──────────────────┘       └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5, Semantic Elements |
| **Styling** | CSS3, Custom Properties, Glassmorphism, CSS Variables |
| **Logic** | Vanilla JavaScript (ES Modules) |
| **Code Editor** | CodeMirror 6 (via ESM CDN) |
| **Video** | YouTube IFrame API |
| **Authentication** | Firebase Auth (Google + Email) |
| **Database** | Cloud Firestore |
| **File Storage** | Cloudinary CDN (optional) |
| **AI Hints** | Google Gemini API |
| **Code Execution** | Piston API (sandboxed remote execution) |
| **ZIP Download** | JSZip (via ESM CDN) |
| **Search** | Fuse.js (fuzzy search) |
| **Local Storage** | localStorage (offline fallback) |

---

## 📁 Project Structure

```
procode-edu-pulse-lms/
├── index.html                        # SPA entry point
├── README.md
├── CONTRIBUTING.md                   # Contribution guidelines
├── ROADMAP.md                        # Development roadmap
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Firestore index config
├── logo.png                          # Brand logo
│
├── css/
│   ├── variables.css                 # Design tokens & themes
│   ├── global.css                    # Reset, typography, utilities
│   ├── components.css                # Buttons, cards, modals, badges
│   ├── navbar.css                    # Navigation bar
│   ├── landing.css                   # Landing page styles
│   ├── lesson.css                    # Lesson page + code editor
│   ├── pages.css                     # Profile, roadmaps, about
│   └── auth.css                      # Login/signup forms
│
├── js/
│   ├── app.js                        # Router, page renderers, bootstrap
│   ├── components/
│   │   ├── admin-dashboard.js        # Full admin panel (7 tabs)
│   │   ├── instructor-dashboard.js   # Instructor CMS (3 builders)
│   │   ├── navbar.js                 # Navigation component
│   │   ├── sidebar.js                # Course sidebar
│   │   ├── video-player.js           # YouTube embed controller
│   │   ├── code-editor.js            # CodeMirror integration
│   │   ├── quiz.js                   # Quiz engine
│   │   ├── challenge.js              # Coding challenge validator
│   │   ├── discussion.js             # Discussion forums
│   │   ├── notes.js                  # Timestamped notes
│   │   ├── portfolio.js              # Portfolio builder + ZIP
│   │   ├── progress-bar.js           # Progress bar
│   │   ├── breadcrumb.js             # Breadcrumb navigation
│   │   └── theme-toggle.js           # Dark/light mode
│   ├── services/
│   │   ├── storage.js                # localStorage persistence
│   │   ├── firestore-service.js      # Firestore CRUD operations
│   │   ├── auth-service.js           # Firebase Auth service
│   │   ├── firebase-config.js        # Firebase configuration
│   │   ├── media-service.js          # Cloudinary integration
│   │   ├── validation.js             # Code validation engine
│   │   ├── remote-execution.js       # Piston API service
│   │   ├── ai-service.js             # Gemini AI integration
│   │   └── discussion-service.js     # Discussion data service
│   └── utils/
│       ├── dom.js                    # DOM helpers, toast, animations
│       └── router.js                 # Hash-based SPA router
│
├── data/
│   ├── courses.json                  # Course catalog
│   ├── lessons.json                  # Lesson content & metadata
│   ├── quizzes.json                  # Quiz questions
│   ├── challenges.json               # Coding challenges & validators
│   ├── roadmaps.json                 # Learning roadmaps
│   ├── docs.json                     # Documentation content
│   └── modules.json                  # Module definitions
│
└── functions/                        # Firebase Cloud Functions
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local dev server (e.g., VS Code Live Server extension)
- (Optional) Firebase project for cloud features

### Quick Start

```bash
# Clone the repository
git clone https://github.com/soghayarmahmoud/procode-edu-pulse-lms.git

# Navigate to the project
cd procode-edu-pulse-lms

# Start with any static server
npx serve .

# Or use VS Code Live Server
# Right-click index.html → "Open with Live Server"
```

### Firebase Setup (Cloud Features)

1. Create a [Firebase project](https://console.firebase.google.com/)
2. Enable **Authentication** (Google + Email/Password providers)
3. Create a **Cloud Firestore** database
4. Copy your Firebase config to `js/services/firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`

### AI Hints Setup (Optional)
1. Get a [Google Gemini API key](https://aistudio.google.com/apikey)
2. Go to **Profile → Settings → AI Hints**
3. Paste your API key and save

### Cloudinary Setup (Optional)
1. Create a free [Cloudinary account](https://cloudinary.com/)
2. Navigate to **Admin → Content & Media** tab
3. Enter your Cloud Name and Upload Preset

---

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] Landing page with course catalog
- [x] Lesson page with video + code editor
- [x] Quiz system with scoring
- [x] Coding challenges with DOM validation
- [x] Progress tracking (localStorage)
- [x] Dark/Light mode

### Phase 2: Enhanced Features ✅
- [x] AI-powered hint system (Gemini API)
- [x] Timestamped note-taking
- [x] Project portfolio with ZIP download
- [x] Cheat sheets and resources
- [x] Mobile responsive design

### Phase 3: Cloud & Admin ✅
- [x] Firebase Authentication (Google + Email)
- [x] Cloud-based progress sync (Firestore)
- [x] Discussion forums per lesson
- [x] Leaderboard & achievements
- [x] Certificate generation
- [x] Unified Admin Dashboard with 7 management tabs
- [x] Challenge Builder (CMS) for instructors
- [x] User Management with role-based access
- [x] Live Firestore analytics on dashboard

### Phase 4: Coming Soon
- [ ] More courses (React, Node.js, Python, C++)
- [ ] Collaborative coding (pair programming)
- [ ] Student analytics & reporting dashboard
- [ ] Push notifications
- [ ] PWA (Progressive Web App) support
- [ ] Multi-language i18n support

---

## 🧪 Code Validation Engine

The platform supports two validation modes:

### Frontend Validation (DOM/Regex)

| Rule Type | Description | Example |
|-----------|-------------|---------|
| `dom-query` | Check if a CSS selector exists in DOM | `"selector": "h1"` |
| `dom-count` | Count elements matching selector | `"selector": "ul > li", "count": 3` |
| `text-contains` | Check if code contains text | `"text": "Hello World"` |
| `regex` | Pattern match with regex | `"pattern": "<h1>.*</h1>"` |
| `css-property` | Verify CSS property value | `"property": "color", "value": "red"` |
| `attribute` | Check element attributes | `"selector": "a", "attribute": "href"` |

### Backend Validation (Piston API)
- Python, JavaScript (Node), and more
- Secure sandboxed execution via [Piston](https://github.com/engineer-man/piston)
- Write assertion-based test code that runs against student submissions

---

## 📐 Database Schema

### localStorage (Offline)
```
procode_profile     → { name, avatar, joinDate, theme }
procode_progress    → { [courseId]: { completedLessons[], quizScores, lastAccessed } }
procode_notes       → { [lessonId]: [{ id, timestamp, text, createdAt }] }
procode_submissions → { [challengeTitle]: { code, passed, submittedAt } }
```

### Firestore (Cloud)
```
users/{uid}                    → profile, progress, submissions, notes, enrollments, gems, isAdmin
dynamic_courses/{courseId}     → id, title, icon, difficulty, description, thumbnail, isDynamic
dynamic_lessons/{lessonId}     → id, courseId, title, type, youtubeId, videoUrl, content, order
dynamic_challenges/{challengeId} → id, title, language, type, difficulty, starterCode, validationRules/testCode
course_reviews/{courseId}/reviews/{reviewId} → rating, text, replies[]
```

---

## 🤝 Contributing

We welcome contributions from all skill levels! Please read our [Contributing Guidelines](CONTRIBUTING.md) before getting started.

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/procode-edu-pulse-lms.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes & commit
git commit -m "feat: add amazing feature"

# Push & open a PR
git push origin feature/amazing-feature
```

### Adding New Content

| Content | Files to Update |
|---------|----------------|
| New Course | `data/courses.json` or Admin → Course Builder |
| New Lesson | `data/lessons.json` or Admin → Course Builder |
| New Challenge | `data/challenges.json` or Admin → Challenge Builder |
| New Quiz | `data/quizzes.json` |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/soghayarmahmoud">Mahmoud ElSoghayar</a>
</p>

<p align="center">
  <a href="https://linkedin.com/in/elsoghayar">LinkedIn</a> •
  <a href="https://github.com/soghayarmahmoud">GitHub</a> •
  <a href="https://youtube.com/@procode4u">YouTube</a>
</p>
