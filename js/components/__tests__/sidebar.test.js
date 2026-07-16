import { describe, expect, it, vi } from 'vitest';
import { SidebarComponent } from '../sidebar.js';

vi.mock('../../services/storage.js', () => ({
  storage: {
    getCourseProgress: vi.fn(() => ({
      completedLessons: ['lesson-1', 'lesson-2'],
      completedModules: [],
    })),
  },
}));

describe('SidebarComponent', () => {
  it('uses loaded lesson count for progress', () => {
    const container = {
      innerHTML: '',
      querySelectorAll: vi.fn(() => []),
    };
    const course = {
      id: 'course-1',
      title: 'Course 1',
      totalLessons: 1,
    };
    const lessons = [
      { id: 'lesson-1', title: 'Lesson 1', type: 'theory' },
      { id: 'lesson-2', title: 'Lesson 2', type: 'practice' },
    ];

    new SidebarComponent(container, course, lessons, 'lesson-1');

    expect(container.innerHTML).toContain('<span>2/2 lessons</span>');
    expect(container.innerHTML).toContain('<span>100%</span>');
    expect(container.innerHTML).toContain('style="width:100%"');
    expect(course.totalLessons).toBe(1);
  });
});
