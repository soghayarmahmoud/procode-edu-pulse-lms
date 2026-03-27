# 🤝 Contributing to ProCode EduPulse

Thank you for your interest in contributing! ProCode EduPulse is an open-source project designed to make coding education accessible to everyone. We welcome contributions from developers of all skill levels.

---

## 🚀 Quick Start Guide

### 1. Setting Up Your Environment
ProCode EduPulse is a **Vanilla JS** application, which means no build tools or package managers are required to get started.

```bash
# Fork & Clone
git clone https://github.com/YOUR-USERNAME/procode-edu-pulse-lms.git
cd procode-edu-pulse-lms

# Start a local static server (e.g., VS Code Live Server or npx serve)
npx serve .
```

### 2. Finding Something to Work On
- 🐛 **Bugs**: Check the [Issues](https://github.com/soghayarmahmoud/procode-edu-pulse-lms/issues) tab for the `bug` label.
- ✨ **Features**: Look for the `enhancement` label.
- 📦 **Content**: We always need new Courses, Lessons, Quizzes, and Challenges!

---

## 🏗️ Technical Principles

- **No Frameworks**: All logic must be written in Vanilla JavaScript (ES Modules).
- **Component-Based**: Each UI feature should be a self-contained module in `js/components/`.
- **CSS Variables**: Use design tokens from `css/variables.css` for all styling.
- **Glassmorphism**: Follow the existing design patterns for cards and overlays.

### 🎨 Design System & Style Guide
Before building a new component, please visit the **[ProCode Style Guide](https://soghayarmahmoud.github.io/procode-edu-pulse-lms/#/styleguide)** to see available UI elements and code snippets.

---

## 📦 How to Contribute Content

| Content Type | How to Add |
|---|---|
| **Course** | Update `data/courses.json` or use the Admin Dashbord Course Builder. |
| **Lesson** | Update `data/lessons.json` and link it in `courses.json`. |
| **Quiz** | Update `data/quizzes.json`. |
| **Challenge** | Update `data/challenges.json` or use the Admin Challenge Builder. |

> [!NOTE]
> For detailed JSON schemas, please refer to the [Documentation Hub](https://soghayarmahmoud.github.io/procode-edu-pulse-lms/#/docs).

---

## 📤 Submitting Your Work

1. **Create a Branch**: `git checkout -b feature/your-feature-name`
2. **Commit Your Changes**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) format. 
   - `feat: add search functionality (#12)`
   - `fix: fix mobile sidebar scrolling (#5)`
3. **Push & PR**: Push to your fork and open a Pull Request against the `main` branch.

### PR Requirements
- All new features must support **Light & Dark mode**.
- Ensure no console errors are present.
- Reference the related issue number in the PR description.

---

## 📜 Community Standards

By participating in this project, you agree to abide by our **[Code of Conduct](CODE_OF_CONDUCT.md)** and follow our **[Security Policy](SECURITY.md)**.

For support, please refer to **[SUPPORT.md](SUPPORT.md)**.

---

<p align="center">
  Built with ❤️ for the Developer Community.
</p>
