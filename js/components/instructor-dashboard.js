import { $, showToast } from '../utils/dom.js';
import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';

export class InstructorDashboard {
    constructor(containerSelector, coursesData) {
        this.containerContainer = $(containerSelector);
        this.coursesData = coursesData || [];
        this.render();
    }

    render() {
        if (!this.containerContainer) return;
        
        // Simple client-side auth gate (in a real app, cloud rules would also enforce this)
        const user = authService.getCurrentUser();
        // Here we just allow rendering, but in prod we'd check claims or specific emails.
        if (!user) {
            this.containerContainer.innerHTML = '<div class="container" style="padding:var(--space-16)"><div class="card text-center"><h1>Access Denied</h1><p>Please log in to access the instructor dashboard.</p></div></div>';
            return;
        }

        this.containerContainer.innerHTML = `
            <div class="page-wrapper bg-dots-pattern">
                <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-10);">
                        <div>
                            <span class="section-badge"><i class="fa-solid fa-chalkboard-user"></i> Admin Panel</span>
                            <h1 class="section-title">Instructor Dashboard</h1>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap:var(--space-6); margin-bottom:var(--space-8);">
                        <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                            <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                                <span>Total Courses</span>
                                <i class="fa-solid fa-book text-gradient"></i>
                            </div>
                            <div class="text-gradient" style="font-size: 2.5rem; font-weight:800;">${this.coursesData.length}</div>
                        </div>
                        <div class="card-glass" style="display:flex; flex-direction:column; gap:var(--space-2);">
                            <div class="text-muted" style="font-size:var(--text-sm); display:flex; justify-content:space-between;">
                                <span>CMS Status</span>
                                <i class="fa-solid fa-cloud text-gradient"></i>
                            </div>
                            <div class="text-gradient" style="font-size: 2.5rem; font-weight:800;">Active</div>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                        <!-- Course Builder -->
                        <div class="card">
                            <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-folder-plus"></i> Create New Course</h3>
                            <form id="course-builder-form" onsubmit="event.preventDefault();">
                                <div class="grid grid-2" style="gap:var(--space-4);">
                                    <div class="input-group">
                                        <label>Course ID (e.g. react-native-pro)</label>
                                        <input type="text" id="course-id" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Course Title</label>
                                        <input type="text" id="course-title" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>FontAwesome Icon (e.g. fa-brands fa-react)</label>
                                        <input type="text" id="course-icon" class="input" value="fa-solid fa-code" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Difficulty</label>
                                        <select id="course-difficulty" class="input">
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Description (Markdown supported)</label>
                                    <textarea id="course-desc" class="input textarea" rows="3" required></textarea>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Estimated Total Lessons (number)</label>
                                    <input type="number" id="course-total-lessons" class="input" value="10" required>
                                </div>
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-course" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Course</button>
                                </div>
                            </form>
                        </div>

                        <!-- Lesson Builder -->
                        <div class="card">
                            <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-video"></i> Add Lesson to Course</h3>
                            <form id="lesson-builder-form" onsubmit="event.preventDefault();">
                                <div class="input-group" style="margin-bottom:var(--space-4);">
                                    <label>Select Course</label>
                                    <select id="lesson-course-id" class="input" required>
                                        ${this.coursesData.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="grid grid-2" style="gap:var(--space-4);">
                                    <div class="input-group">
                                        <label>Lesson ID (e.g. react-intro)</label>
                                        <input type="text" id="lesson-id" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Lesson Title</label>
                                        <input type="text" id="lesson-title" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Lesson Type</label>
                                        <select id="lesson-type" class="input">
                                            <option value="theory">Theory (Video)</option>
                                            <option value="practice">Practice (Interactive Code)</option>
                                        </select>
                                    </div>
                                    <div class="input-group">
                                        <label>YouTube Video ID</label>
                                        <input type="text" id="lesson-youtube" class="input" placeholder="e.g. dQw4w9WgXcQ">
                                    </div>
                                    <div class="input-group">
                                        <label>Duration (e.g. 10 min)</label>
                                        <input type="text" id="lesson-duration" class="input" value="10 min">
                                    </div>
                                    <div class="input-group">
                                        <label>Order / Sequence Number</label>
                                        <input type="number" id="lesson-order" class="input" value="1">
                                    </div>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Lesson Content / Notes (Markdown formatted HTML)</label>
                                    <textarea id="lesson-content" class="input textarea" rows="5" placeholder="<h2>Welcome</h2><p>Here are your notes.</p>"></textarea>
                                </div>
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-lesson" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._attachEvents();
    }

    _attachEvents() {
        const btnSaveCourse = document.getElementById('btn-save-course');
        if (btnSaveCourse) {
            btnSaveCourse.addEventListener('click', async (e) => {
                const form = document.getElementById('course-builder-form');
                if (!form.checkValidity()) return;

                btnSaveCourse.disabled = true;
                btnSaveCourse.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const courseData = {
                    id: document.getElementById('course-id').value.trim(),
                    title: document.getElementById('course-title').value.trim(),
                    icon: document.getElementById('course-icon').value.trim(),
                    difficulty: document.getElementById('course-difficulty').value,
                    description: document.getElementById('course-desc').value.trim(),
                    totalLessons: parseInt(document.getElementById('course-total-lessons').value, 10),
                    isDynamic: true // Flag to identify cloud courses
                };

                const success = await firestoreService.saveDynamicCourse(courseData);
                if (success) {
                    showToast('Course successfully published to the cloud!', 'success');
                    form.reset();
                    // Add option to select dynamically
                    const sel = document.getElementById('lesson-course-id');
                    if (sel) sel.innerHTML += `<option value="${courseData.id}">${courseData.title}</option>`;
                } else {
                    showToast('Failed to publish course.', 'error');
                }

                btnSaveCourse.disabled = false;
                btnSaveCourse.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Course';
            });
        }

        const btnSaveLesson = document.getElementById('btn-save-lesson');
        if (btnSaveLesson) {
            btnSaveLesson.addEventListener('click', async (e) => {
                const form = document.getElementById('lesson-builder-form');
                if (!form.checkValidity()) return;

                btnSaveLesson.disabled = true;
                btnSaveLesson.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const lessonData = {
                    id: document.getElementById('lesson-id').value.trim(),
                    courseId: document.getElementById('lesson-course-id').value,
                    title: document.getElementById('lesson-title').value.trim(),
                    type: document.getElementById('lesson-type').value,
                    youtubeId: document.getElementById('lesson-youtube').value.trim(),
                    duration: document.getElementById('lesson-duration').value.trim(),
                    order: parseInt(document.getElementById('lesson-order').value, 10),
                    content: document.getElementById('lesson-content').value.trim(),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicLesson(lessonData);
                if (success) {
                    showToast('Lesson successfully published to the cloud!', 'success');
                    form.reset();
                } else {
                    showToast('Failed to publish lesson.', 'error');
                }

                btnSaveLesson.disabled = false;
                btnSaveLesson.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson';
            });
        }
    }
}
