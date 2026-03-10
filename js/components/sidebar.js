// ============================================
// ProCode EduPulse — Sidebar Component
// ============================================

import { $, $$ } from '../utils/dom.js';
import { storage } from '../services/storage.js';

export class SidebarComponent {
    constructor(container, course, lessons, currentLessonId) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.course = course;
        this.lessons = lessons;
        this.currentLessonId = currentLessonId;
        this.render();
    }

    render() {
        const courseProgress = storage.getCourseProgress(this.course.id);
        const completedCount = courseProgress.completedLessons.length;
        const totalLessons = this.course.totalLessons;
        const percent = Math.round((completedCount / totalLessons) * 100);

        this.container.innerHTML = `
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

      <div class="lesson-list">
        ${this.lessons.map((lesson, i) => {
            const isCompleted = courseProgress.completedLessons.includes(lesson.id);
            const isActive = lesson.id === this.currentLessonId;
            const icon = lesson.type === 'theory' ? '📖' : lesson.type === 'practice' ? '💻' : '🎯';

            return `
            <div class="lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
                 data-lesson-id="${lesson.id}" data-course-id="${this.course.id}">
              <div class="lesson-item-status">
                ${isCompleted ? '✓' : isActive ? '▶' : i + 1}
              </div>
              <div class="lesson-item-title" title="${lesson.title}">
                ${icon} ${lesson.title}
              </div>
              <span class="lesson-item-type">${lesson.duration || ''}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

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
