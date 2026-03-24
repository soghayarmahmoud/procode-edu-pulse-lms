/**
 * renderBreadcrumb
 * Generates dynamic breadcrumbs based on the user's current context
 * Always builds hierarchically: Home > Course > Module/Section > Lesson
 */

export function renderBreadcrumb({ courseId, lessonId, coursesData, modulesData, lessonsData }) {
    const path = [];
    
    // 1. Home Base
    path.push({ title: 'Home', url: '#/' });
    path.push({ title: 'Courses', url: '#/courses' });

    // 2. Course
    const course = coursesData?.find(c => c.id === courseId);
    if (course) {
        path.push({ title: course.title, url: `#/course/${courseId}` });
    }

    // 3. Module/Section & Lesson Context
    if (lessonId) {
        // Find if this lesson belongs to a specific module
        const module = modulesData?.find(m => m.courseId === courseId && m.lessons.includes(lessonId));
        if (module) {
            // Include section hierarchy in the breadcrumb
            path.push({ title: module.title, url: `#/course/${courseId}` }); 
        }

        const lesson = lessonsData?.find(l => l.id === lessonId);
        if (lesson) {
            path.push({ title: lesson.title, url: `#/lesson/${courseId}/${lessonId}`, active: true });
        }
    } else if (course) {
        // If we only have course context, make course active
        path[path.length - 1].active = true;
    }

    return `
        <nav class="breadcrumb-nav animate-fadeIn" aria-label="Breadcrumb" style="margin-bottom:var(--space-6);">
            <ol class="breadcrumb-list" style="display:flex; flex-wrap:wrap; gap:var(--space-2); list-style:none; padding:0; margin:0; font-size:var(--text-sm);">
                ${path.map((item, index) => `
                    <li class="breadcrumb-item" style="display:flex; align-items:center; gap:var(--space-2); color:${item.active ? 'var(--text-primary)' : 'var(--text-muted)'}; font-weight:${item.active ? '600' : '400'};">
                        ${index > 0 ? '<span class="breadcrumb-separator" style="opacity:0.5; font-size:0.8rem;">/</span>' : ''}
                        ${item.active 
                            ? `<span class="breadcrumb-current">${item.title}</span>`
                            : `<a href="${item.url}" class="breadcrumb-link" style="color:var(--text-muted); text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='var(--brand-primary-light)'" onmouseout="this.style.color='var(--text-muted)'">${item.title}</a>`
                        }
                    </li>
                `).join('')}
            </ol>
        </nav>
    `;
}
