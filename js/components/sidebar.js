// ============================================
// ProCode EduPulse — Sidebar Component
// ============================================

import { $, $$ } from '../utils/dom.js';
import { storage } from '../services/storage.js';

/**
 * Sidebar component for course navigation.
 */
export class SidebarComponent {
  /**
   * Create a SidebarComponent instance.
   * @param {string|Element} container
   * @param {object} course
   * @param {Array<object>} lessons
   * @param {string} currentLessonId
   * @param {Array<object>} [modules=[]]
   */
  constructor(container, course, lessons, currentLessonId, modules = []) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.course = course;
        this.lessons = lessons;
        this.currentLessonId = currentLessonId;
        this.modules = modules;
        this.render();
    }

    /**
     * Render sidebar UI.
     * @returns {void}
     */
    render() {
        const courseProgress = storage.getCourseProgress(this.course.id);
        const completedCount = courseProgress.completedLessons.length;
        const totalLessons = this.course.totalLessons;
        const percent = Math.round((completedCount / totalLessons) * 100);

        // build module + lesson list if modules provided
        let content = `
      <div class="sidebar-header">
        <div class="sidebar-course-title">${this.course.title}</div>
        <div class="sidebar-progress">
          <div class="sidebar-progress-text">
            <span>${completedCount}/${totalLessons} lessons</span>
            <span>${percent}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
        </div>
      </div>
`;
        
        if (this.modules.length > 0) {
            content += `<div class="module-list">`;
            this.modules.forEach(mod => {
                const modCompleted = courseProgress.completedModules && courseProgress.completedModules.includes(mod.id);
                content += `<div class="module-item ${modCompleted ? 'completed' : ''}">${mod.title}</div>`;
                content += `<div class="lesson-list">`;
                mod.lessons.forEach((lessonId, idx) => {
                    const lesson = this.lessons.find(l => l.id === lessonId);
                    if (!lesson) return;
                    const isCompleted = courseProgress.completedLessons.includes(lesson.id);
                    const isActive = lesson.id === this.currentLessonId;
                    const icon = lesson.type === 'theory' ? '<i class="fa-solid fa-book"></i>' : lesson.type === 'practice' ? '<i class="fa-solid fa-laptop-code"></i>' : '<i class="fa-solid fa-bullseye"></i>';
                    content += `
            <div class="lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
                 data-lesson-id="${lesson.id}" data-course-id="${this.course.id}">
              <div class="lesson-item-status">
                ${isCompleted ? '<i class="fa-solid fa-check"></i>' : isActive ? '<i class="fa-solid fa-play"></i>' : idx + 1}
              </div>
              <div class="lesson-item-title" title="${lesson.title}">
                ${icon} ${lesson.title}
              </div>
              <span class="lesson-item-type">${lesson.duration || ''}</span>
            </div>
          `;
                });
                content += `</div>`; // end lesson-list
            });
            content += `</div>`; // end module-list
        } else {
            // fallback to flat lesson list
            content += `<div class="lesson-list">
        ${this.lessons.map((lesson, i) => {
            const isCompleted = courseProgress.completedLessons.includes(lesson.id);
            const isActive = lesson.id === this.currentLessonId;
            const icon = lesson.type === 'theory' ? '<i class="fa-solid fa-book"></i>' : lesson.type === 'practice' ? '<i class="fa-solid fa-laptop-code"></i>' : '<i class="fa-solid fa-bullseye"></i>';

            return `
            <div class="lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
                 data-lesson-id="${lesson.id}" data-course-id="${this.course.id}">
              <div class="lesson-item-status">
                ${isCompleted ? '<i class="fa-solid fa-check"></i>' : isActive ? '<i class="fa-solid fa-play"></i>' : i + 1}
              </div>
              <div class="lesson-item-title" title="${lesson.title}">
                ${icon} ${lesson.title}
              </div>
              <span class="lesson-item-type">${lesson.duration || ''}</span>
            </div>
          `;
        }).join('')}
      </div>`;
        }
        this.container.innerHTML = content;

        // Click to navigate
        $$('.lesson-item', this.container).forEach(item => {
            item.addEventListener('click', () => {
                const lessonId = item.dataset.lessonId;
                const courseId = item.dataset.courseId;
                window.location.hash = `/lesson/${courseId}/${lessonId}`;
            });
        });
    }
}
