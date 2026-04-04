<!-- ProCode EduPulse - Professional README -->
<p align="center">
  <a href="https://soghayarmahmoud.github.io/procode-edu-pulse-lms">
    <img src="./procode_readme_banner.png" alt="ProCode EduPulse Banner" width="100%">
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
| **Course Content Studio** | Manage courses, upload thumbnails, add video lessons, and edit course content directly from the Admin Dashboard. |
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

## 🛠️ Admin Course Content & Media Management

The Admin Panel now includes built-in support for full course and lesson management with media uploads:

- **Course Builder**: create new courses, edit course metadata, and publish them dynamically to the platform.
- **Lesson Builder**: attach lessons to a target course, add YouTube video IDs, upload Cloudinary lesson videos, and author markdown lesson content.
- **Content & Media tab**: configure Cloudinary credentials, manage course thumbnails, and upload media assets for course content.
- **Existing course management**: view the static course catalog and cloud-published courses from the admin panel, then edit them directly from the dashboard.
- **Direct media link**: use the new `Course Media Library` button inside the Course Builder to open the Content & Media tab and manage video/image uploads.

### How to add course content videos and images

1. Open the Admin Dashboard via `#/admin`.
2. Navigate to **Course Builder** to create or edit a course.
3. Use **Upload Thumbnail** to attach an image to the course.
4. Switch to **Add Lesson to Course**, choose the target course, then add a YouTube ID or upload a video file.
5. Save the lesson to publish it.
6. Use **Manage Existing Courses** or **Manage Existing Lessons** to update course details or lesson content later.

### Future provider integration roadmap

The roadmap includes provider options such as:

- **Back4App / Supabase** for hosted backend data, API, and auth.
- **OneSignal** for push notifications and announcements.
- **SendGrid / Twilio** for email and SMS messaging.
- **Cloudinary** for media storage, CDN delivery, and video/image optimization.

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
  Built with 💙 by <a href="https://github.com/soghayarmahmoud">Mahmoud ElSoghayar</a>
</p>

<p align="center">
  <a href="https://linkedin.com/in/elsoghayar"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://youtube.com/@procode4u"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
</p>
