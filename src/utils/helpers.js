// src/utils/helpers.js
import { store } from '../store/store.js';

export function getCourseLessonCount(courseId, fallback = 0) {
  const count = (store.state.lessons || []).filter(lesson => lesson.courseId === courseId).length;
  return count || fallback;
}

export function formatCommentTime(ts) {
  try {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}