// src/utils/transition.js
import { renderCoursesPageSkeleton, renderCourseSkeleton, renderLessonSkeleton, renderPortfolioSkeleton } from './skeletons.js';
import { renderFooter } from '../../js/components/footer.js';

export function transitionPage(renderFn, path = window.location.hash) {
    const app = document.getElementById('app');
    app.style.opacity = 0;

    // Inject skeleton based on route immediately while fading out
    setTimeout(() => {
        if (path.startsWith('#/course/')) {
            app.innerHTML = renderCourseSkeleton();
        } else if (path.startsWith('#/lesson/')) {
            app.innerHTML = renderLessonSkeleton();
        } else if (path === '#/courses') {
            app.innerHTML = renderCoursesPageSkeleton();
        } else if (path === '#/portfolio') {
            app.innerHTML = renderPortfolioSkeleton();
        }

        // After briefly showing skeleton, render real content and fade in
        setTimeout(async () => {
            try {
                await renderFn();
                renderFooter(); // Render global footer after content
                app.style.opacity = 1;
            } catch (error) {
                console.error('Error rendering page:', error);
                app.style.opacity = 1;
            }
        }, 150); // brief skeleton display

    }, 200); // Wait for fade out
}