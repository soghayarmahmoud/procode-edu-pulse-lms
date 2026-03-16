/**
 * BreadcrumbComponent
 * Generates dynamic breadcrumbs based on the user's path (Roadmap > Course > Module > Lesson)
 */

export class BreadcrumbComponent {
    constructor(data = {}) {
        this.roadmaps = data.roadmaps || [];
        this.courses = data.courses || [];
        this.modules = data.modules || [];
        this.lessons = data.lessons || [];
    }

    render(courseId, lessonId = null) {
        const path = [];
        
        // 1. Home
        path.push({ title: 'Home', url: '#/' });

        // 2. Roadmaps (optional branch)
        path.push({ title: 'Courses', url: '#/courses' });

        // 3. Find Roadmap
        const roadmap = this.roadmaps.find(r => r.courses.some(c => c.id === courseId));
        if (roadmap) {
            // Insert Roadmap between Home/Courses and Course?
            // Let's replace 'Courses' with the Roadmap if it exists for a better path
            path[1] = { title: roadmap.title, url: `#/roadmaps` }; // Link to roadmap view
        }

        // 4. Course
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            path.push({ title: course.title, url: `#/course/${courseId}` });
        }

        // 5. Module & Lesson
        if (lessonId) {
            const module = this.modules.find(m => m.courseId === courseId && m.lessons.includes(lessonId));
            if (module) {
                path.push({ title: module.title, url: `#/course/${courseId}` }); // Link back to course modules
            }

            const lesson = this.lessons.find(l => l.id === lessonId);
            if (lesson) {
                path.push({ title: lesson.title, url: `#/lesson/${courseId}/${lessonId}`, active: true });
            }
        } else if (course) {
            path[path.length - 1].active = true;
        }

        return `
            <nav class="breadcrumb-nav animate-fadeIn" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    ${path.map((item, index) => `
                        <li class="breadcrumb-item ${item.active ? 'active' : ''}">
                            ${index > 0 ? '<span class="breadcrumb-separator">/</span>' : ''}
                            ${item.active 
                                ? `<span class="breadcrumb-current">${item.title}</span>`
                                : `<a href="${item.url}" class="breadcrumb-link">${item.title}</a>`
                            }
                        </li>
                    `).join('')}
                </ol>
            </nav>
        `;
    }
}
