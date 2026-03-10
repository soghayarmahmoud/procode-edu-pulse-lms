// ============================================
// ProCode EduPulse — Progress Bar Component
// ============================================

import { storage } from '../services/storage.js';

export function renderProgressBar(container, courseId, totalLessons) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const percent = storage.getCourseCompletionPercent(courseId, totalLessons);

    el.innerHTML = `
    <div class="progress-label flex justify-between">
      <span>Course Progress</span>
      <span>${percent}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
  `;
}
