<!-- ProCode EduPulse - Professional README -->
<p align="center">
  <a href="https://soghayarmahmoud.github.io/procode-edu-pulse-lms">
    <img src="logo.png" alt="ProCode EduPulse Banner" width="100%">
  </a>
</p>

<h1 align="center">🚀 ProCode EduPulse</h1>

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
  <a href="#-key-features">Features</a> •
  <a href="#-technical-stack">Tech Stack</a> •
  <a href="#-getting-started">Installation</a> •
  <a href="#-repository-guide">Documentation</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-blue?style=flat-square" alt="PRs Welcome"></a>
  <a href="https://github.com/soghayarmahmoud/procode-edu-pulse-lms/actions"><img src="https://github.com/soghayarmahmoud/procode-edu-pulse-lms/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" alt="Status">
</p>

---

## 🎯 Vision & Purpose

ProCode EduPulse is a state-of-the-art **Single Page Application (SPA)** built with **Vanilla JavaScript**. It was designed to provide a lightweight, yet powerful environment where students can learn, practice, and build as they go.

> [!TIP]
> **Zero Build Tools**: We believe in the power of the web. This app works directly in the browser with no build steps, high performance, and zero configuration.

---

## ✨ Key Features

### 🎓 For Students
| Feature | Description |
| :--- | :--- |
| **Embedded IDE** | Multi-language editor powered by **CodeMirror 6** with live preview. |
| **AI Mentorship** | Get smart hints and step-by-step guidance via **Google Gemini**. |
| **Gamified Progress** | Earn XP, unlock badges, and climb the leaderboard as you learn. |
| **Project Portfolio** | Every challenge you complete is automatically added to your dev portfolio. |

### 🛡️ For Instructors
| Feature | Description |
| :--- | :--- |
| **Unified CMS** | A powerful dashboard to create courses, lessons, and challenges. |
| **Advanced Search** | Instantly find and manage content with **Ctrl + K** global search. |
| **Content Analytics** | Track completion rates and student performance metrics. |
| **No-Code Management** | Publish rich markdown content and video lessons with zero technical overhead. |

---

## 🏗️ Technical Architecture

The platform follows a modular service-based architecture, ensuring high scalability and maintainability without the need for complex frameworks.

```mermaid
graph TD
    A[Router (Hash-based)] --> B(Page Renderers)
    B --> C{Component Library}
    C --> D[CodeEditor (CodeMirror 6)]
    C --> E[VideoPlayer (Custom HTML5)]
    C --> F[QuizEngine]
    B --> G[Services Layer]
    G --> H[Firebase Auth/Firestore]
    G --> I[Piston API (Remote Exec)]
    G --> J[Gemini API (AI Insights)]
```

---

## 🚀 Getting Started

### 1. Simple Launch (Local)
```bash
# Clone the repository
git clone https://github.com/soghayarmahmoud/procode-edu-pulse-lms.git

# Navigate and serve
cd procode-edu-pulse-lms
npx serve .
```

### 2. Integration Setup
To unlock the full potential of the platform:
- **Firebase**: Set up your project and add credentials in `js/services/firebase-config.js`.
- **Gemini AI**: Add your API key in the User Settings panel within the app.
- **Remote Execution**: Configure the Piston API endpoint for backend code validation.

---

## 📂 Repository Guide

| Folder / File | Purpose |
| :--- | :--- |
| [`js/`](js/) | **Core Logic**: ES modules for routing, components, and services. |
| [`css/`](css/) | **Design System**: Variables, global styles, and modular component CSS. |
| [`data/`](data/) | **Content fallback**: JSON files for course/lesson metadata. |
| [`.github/`](.github/) | **CI/CD**: Workflows for automated linting and formatting. |

---

## 🤝 Contributing

We love contributions! Whether you're fixing a bug, adding a new course, or improving the UI, your help makes ProCode EduPulse better for everyone.

1.  Check out our [Contributing Guidelines](CONTRIBUTING.md).
2.  Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
3.  Join the discussion on our [Issues page](https://github.com/soghayarmahmoud/procode-edu-pulse-lms/issues).

---

## ⭐ Support & Socials

If you love this project, please consider **giving it a star** on GitHub!

<p align="center">
  Built with 💙 by <a href="https://github.com/soghayarmahmoud">Mahmoud ElSoghayar</a> & <a href="https://github.com/goldenBoy13420">Mahmoud Abdelrauf</a>
</p>

<p align="center">
  <a href="https://linkedin.com/in/elsoghayar"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://youtube.com/@procode4u"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
</p>
