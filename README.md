<!-- ProCode EduPulse - Professional README -->
<p align="center">
  <a href="https://soghayarmahmoud.github.io/procode-edu-pulse-lms">
    <img src="logo.png" alt="ProCode EduPulse" width="120">
  </a>
</p>

<h1 align="center">ProCode EduPulse</h1>

<p align="center">
  <strong>The Ultimate Open-Source Learning Management System for Modern Coding Education.</strong><br>
  <em>Empowering the next generation of developers through interactive, browser-based learning.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-blue?style=flat-square" alt="PRs Welcome"></a>
  <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square" alt="Code of Conduct"></a>
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/version-2.1.0-purple?style=flat-square" alt="Version">
</p>

---

## 🎯 What is ProCode EduPulse?

ProCode EduPulse is a state-of-the-art **Single Page Application (SPA)** built with **Vanilla JavaScript**. It provides a self-contained, interactive environment where students can learn, practice, and build portfolios without leaving the browser — and without the overhead of heavy frameworks like React or Vue.

### 🌟 Key Highlights

- **Zero Build Tools**: Works directly in the browser. High performance, zero configuration.
- **Embedded IDE**: Powered by CodeMirror 6 with live preview and multi-language support.
- **AI-Powered Learning**: Real-time coding hints and explanations via Google Gemini.
- **Full-Featured CMS**: Unified Admin Panel for managing courses, lessons, and challenges.
- **Cloud Persistence**: Real-time sync with Firebase (Auth & Firestore).

---

## ✨ Features at a Glance

### For Students 🎓
- **Interactive Lessons**: Video-based learning with integrated notes and cheat sheets.
- **Coding Challenges**: Real-time validation for HTML/CSS (DOM) and Logic (Piston API).
- **Gamified Experience**: Earn XP, collect gems, unlock badges, and track rank.
- **Automated Portfolio**: Every completed challenge builds your professional dev portfolio.
- **Modern UX**: Deep dark/light mode support, breadcrumb navigation, and global search (Ctrl+K).

### For Instructors & Admins 🛡️
- **Dynamic Course Builder**: Create rich, multimedia courses with zero code.
- **Lesson Management**: Drag-and-drop ordering and video attachment.
- **Challenge Builder**: Create complex coding exercises with custom validation rules.
- **Analytics & User Management**: Monitor user progress and roles from a single dashboard.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[Router (Hash-based)] --> B(Page Renderers)
    B --> C{Component Library}
    C --> D[CodeEditor]
    C --> E[VideoPlayer]
    C --> F[QuizEngine]
    B --> G[Services]
    G --> H[Firebase Auth/Firestore]
    G --> I[Piston/Gemini APIs]
    G --> J[Cloudinary CDN]
```

---

## 🚀 Getting Started

### 1. Quick Launch
```bash
# Clone the repository
git clone https://github.com/soghayarmahmoud/procode-edu-pulse-lms.git

# Navigate and serve (requires static server like VS Code Live Server or npx serve)
cd procode-edu-pulse-lms
npx serve .
```

### 2. Full Cloud Setup
To unlock cloud sync, auth, and AI features:
1. Initialize a **Firebase** project and paste your config in `js/services/firebase-config.js`.
2. Add your **Google Gemini API** key in the User Settings.
3. Configure **Cloudinary** credentials in the Admin Panel.

---

## 📂 Repository Guide

| File / Folder | Description |
|---|---|
| [`README.md`](README.md) | Official documentation and project overview. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Guidelines for contributing and building content. |
| [`ROADMAP.md`](ROADMAP.md) | Future features and current development phases. |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting and security policy. |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community standards and behavioral expectations. |
| [`SUPPORT.md`](SUPPORT.md) | Getting help and official support channels. |
| [`LICENSE`](LICENSE) | Licensing information (MIT). |
| [`js/`](js/) | Core application logic and ES modules. |
| [`css/`](css/) | Design tokens and modern CSS component system. |
| [`data/`](data/) | JSON-based content catalog (fallback for cloud data). |

---

## 🤝 Community & Support

ProCode EduPulse is **Community Driven**. We value your input and contributions!

- 📚 **Learning More**: Visit the [Official Documentation Hub](#/docs).
- 🎨 **Design Patterns**: Explore the [Component Style Guide](#/styleguide).
- 💬 **Discussion**: Join our community in [GitHub Discussions](https://github.com/soghayarmahmoud/procode-edu-pulse-lms/discussions).
- 🐞 **Found a Bug?**: Let us know by [opening an issue](https://github.com/soghayarmahmoud/procode-edu-pulse-lms/issues).

---

## ⭐ Support the Project

If you find ProCode EduPulse helpful, please consider **giving it a star**! It helps more developers discover the platform.

<p align="center">
  Built with ❤️ by <a href="https://github.com/soghayarmahmoud">Mahmoud ElSoghayar</a>
</p>

<p align="center">
  <a href="https://linkedin.com/in/elsoghayar">LinkedIn</a> •
  <a href="https://youtube.com/@procode4u">YouTube</a> •
  <a href="https://github.com/soghayarmahmoud">GitHub</a>
</p>
