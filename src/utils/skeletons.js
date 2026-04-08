// src/utils/skeletons.js
export function renderCoursesPageSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div style="margin-bottom:var(--space-10)">
            <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 250px; height: 20px; border-radius: 4px;"></div>
        </div>
        <div class="grid grid-3 gap-6">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
               <div class="skeleton" style="height: 180px; width: 100%; border-radius: 0;"></div>
               <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); flex: 1;">
                  <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-2)">
                     <div class="skeleton" style="width: 60px; height: 20px; border-radius: 10px;"></div>
                     <div class="skeleton" style="width: 80px; height: 20px; border-radius: 10px;"></div>
                  </div>
                  <div class="skeleton" style="width: 90%; height: 24px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 100%; height: 60px; border-radius: 4px; margin-top: 8px;"></div>
                  <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-4);">
                     <div class="skeleton" style="width: 80px; height: 20px; border-radius: 4px;"></div>
                     <div class="skeleton" style="width: 80px; height: 32px; border-radius: 4px;"></div>
                  </div>
               </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

export function renderCourseSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); max-width:800px;">
        <div style="margin-bottom:var(--space-8); display:flex; flex-direction:column; align-items:center;">
          <div class="skeleton" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="width: 80%; height: 60px; border-radius: 8px; margin-bottom: var(--space-4);"></div>
        </div>

        <div class="card" style="margin-bottom:var(--space-8); display: flex; flex-direction: column; gap: var(--space-4);">
           <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="skeleton" style="width: 180px; height: 28px; border-radius: 4px;"></div>
              <div class="skeleton" style="width: 80px; height: 20px; border-radius: 4px;"></div>
           </div>
           ${[1, 2, 3, 4, 5].map(() => `
             <div class="skeleton" style="width: 100%; height: 72px; border-radius: var(--radius-lg);"></div>
           `).join('')}
           <div class="skeleton" style="width: 100%; height: 50px; border-radius: var(--radius-lg); margin-top: var(--space-4);"></div>
        </div>
      </div>
    </div>`;
}

export function renderLessonSkeleton() {
    return `
    <div class="lesson-layout">
      <aside class="course-sidebar" style="padding: var(--space-4); border-right: 1px solid var(--border-subtle);">
        <div class="skeleton" style="width: 100%; height: 30px; border-radius: 4px; margin-bottom: var(--space-4);"></div>
        <div class="skeleton" style="width: 100%; height: 8px; border-radius: 4px; margin-bottom: var(--space-6);"></div>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
           ${[1,2,3,4].map(() => `<div class="skeleton" style="width: 100%; height: 40px; border-radius: var(--radius-md);"></div>`).join('')}
        </div>
      </aside>
      <main class="lesson-main">
        <div class="lesson-header" style="padding-bottom: var(--space-4);">
           <div class="skeleton" style="width: 200px; height: 16px; border-radius: 4px; margin-bottom: var(--space-2);"></div>
           <div class="skeleton" style="width: 300px; height: 36px; border-radius: 4px; margin-bottom: var(--space-4);"></div>
           <div style="display: flex; gap: var(--space-2);">
              <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
              <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
           </div>
        </div>
        <div class="split-view">
           <div class="video-section">
              <div class="skeleton" style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-lg);"></div>
              <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4);">
                 <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-md);"></div>
                 <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-md);"></div>
              </div>
           </div>
           <div class="editor-section" style="display: flex; flex-direction: column; gap: var(--space-4);">
              <div class="skeleton" style="width: 100%; height: 50%; border-radius: var(--radius-lg);"></div>
              <div class="skeleton" style="width: 100%; height: 50%; border-radius: var(--radius-lg);"></div>
           </div>
        </div>
      </main>
    </div>`;
}

export function renderPortfolioSkeleton() {
    return `
    <div class="page-wrapper">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16)">
        <div style="margin-bottom:var(--space-10); text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div class="skeleton" style="width: 120px; height: 24px; border-radius: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 300px; height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 400px; height: 24px; border-radius: 4px; margin-bottom: var(--space-6);"></div>
            <div style="display: flex; gap: var(--space-2);">
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 80px; height: 36px; border-radius: var(--radius-full);"></div>
            </div>
        </div>
        <div class="grid grid-3 gap-6">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
               <div class="skeleton" style="height: 200px; width: 100%; border-radius: 0;"></div>
               <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); flex: 1;">
                  <div class="skeleton" style="width: 80%; height: 24px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 100%; height: 16px; border-radius: 4px;"></div>
                  <div class="skeleton" style="width: 90%; height: 16px; border-radius: 4px;"></div>
                  <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2)">
                     <div class="skeleton" style="width: 50px; height: 20px; border-radius: 4px;"></div>
                     <div class="skeleton" style="width: 50px; height: 20px; border-radius: 4px;"></div>
                  </div>
               </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}