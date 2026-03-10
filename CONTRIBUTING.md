# 🤝 Contributing to ProCode EduPulse

Thank you for your interest in contributing! This guide will help you get started,
even if you've never contributed to an open-source project before.

---

## 🚀 Quick Start (5 minutes)

### 1. Fork & Clone

```bash
# Fork the repo on GitHub (click the "Fork" button)
# Then clone your fork:
git clone https://github.com/YOUR-USERNAME/procode-edu-pulse-lms.git
cd procode-edu-pulse-lms
```

### 2. Run Locally

```bash
# Option A: VS Code Live Server (recommended)
# Install "Live Server" extension → Right-click index.html → "Open with Live Server"

# Option B: Using npx
npx serve .
```

Open `http://localhost:3000` (or the Live Server port) in your browser.

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# Example: git checkout -b feature/add-back-to-top-button
```

---

## 🏗️ Project Structure Explained

```
procode-edu-pulse-lms/
├── index.html              ← The single HTML entry point (SPA)
├── css/
│   ├── variables.css       ← 🎨 Colors, fonts, spacing (change themes here)
│   ├── global.css          ← 📐 Base styles, reset, layout utilities
│   ├── components.css      ← 🧩 Reusable UI pieces (buttons, cards, etc.)
│   ├── navbar.css          ← Navigation bar styles
│   ├── landing.css         ← Landing page specific styles
│   └── lesson.css          ← Lesson page specific styles
├── js/
│   ├── app.js              ← 🚀 Main entry: routes, page rendering
│   ├── components/         ← 🧩 UI components (each is a self-contained module)
│   ├── services/           ← ⚙️ Business logic (storage, validation, AI)
│   └── utils/              ← 🔧 Helper functions (DOM, routing)
└── data/                   ← 📦 JSON files (courses, lessons, quizzes)
```

### Key Concepts

- **SPA (Single Page App)**: Everything loads through `index.html`. The router (`js/utils/router.js`) handles URL changes using `#hash` routes.
- **ES Modules**: All JS files use `import`/`export`. The browser loads them natively via `<script type="module">`.
- **localStorage**: All user data (progress, notes, settings) is saved in the browser. See `js/services/storage.js`.
- **No Build Tools**: No npm install, no webpack, no bundler. Just open and code!

---

## 📝 How to Add Content

### Adding a New Lesson

1. Open `data/lessons.json`
2. Add a new lesson object:

```json
{
  "id": "your-lesson-id",
  "courseId": "html-fundamentals",
  "title": "Your Lesson Title",
  "order": 7,
  "youtubeId": "YOUTUBE_VIDEO_ID",
  "type": "theory",
  "duration": "15 min",
  "content": "<h3>Your Content</h3><p>Lesson text here...</p>",
  "cheatSheet": "Cheat sheet content here...",
  "resources": [],
  "assessment": {
    "type": "quiz",
    "id": "your-quiz-id"
  }
}
```

3. Add the lesson ID to the course's `lessons` array in `data/courses.json`
4. Update `totalLessons` count in the course

### Adding a Quiz

1. Open `data/quizzes.json`
2. Add a new quiz under the `quizzes` key:

```json
"your-quiz-id": {
  "title": "Your Quiz Title",
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "question": "What does CSS stand for?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct..."
    }
  ]
}
```

### Adding a Coding Challenge

1. Open `data/challenges.json`
2. Add under the `challenges` key:

```json
"your-challenge-id": {
  "title": "Challenge Title",
  "difficulty": "Easy",
  "instructions": "What the student should do...",
  "starterCode": "<!DOCTYPE html>\\n<html>...</html>",
  "language": "html",
  "validationRules": [
    {
      "type": "dom-query",
      "selector": "h1",
      "errorMessage": "Add an <h1> element."
    }
  ]
}
```

**Validation rule types**: `dom-query`, `dom-count`, `text-contains`, `regex`, `css-property`, `attribute`

---

## 🎨 Styling Guide

- **Colors**: Always use CSS variables from `variables.css` (e.g., `var(--brand-primary)`)
- **Spacing**: Use the spacing scale (`var(--space-4)`, `var(--space-6)`, etc.)
- **Components**: Reuse classes from `components.css` (`.btn`, `.card`, `.badge`, etc.)
- **Dark/Light Mode**: Both themes must work. Test by toggling in the navbar.

---

## 📤 Submitting Your Work

```bash
# Stage and commit your changes
git add .
git commit -m "feat: add back-to-top button (#2)"

# Push to your fork
git push origin feature/your-feature-name
```

Then open a **Pull Request** on GitHub:
1. Go to the original repo
2. Click "Compare & pull request"
3. Reference the issue number in your PR description (e.g., "Closes #2")
4. Describe what you changed and why

### Commit Message Format

```
type: short description (#issue-number)

Examples:
feat: add search functionality to courses page (#11)
fix: fix mobile sidebar not closing on link click (#4)
docs: add JSDoc comments to storage.js (#16)
content: add CSS flexbox lesson and quiz (#6)
```

---

## ❓ Need Help?

- Check the [ROADMAP.md](ROADMAP.md) for task details
- Open a GitHub Issue with your question
- Look at existing code for patterns to follow

**Remember**: Every expert was once a beginner. Don't hesitate to ask questions! 🙌
