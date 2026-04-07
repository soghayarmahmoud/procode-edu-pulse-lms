import { $, showToast } from '../utils/dom.js';
import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';
import { instructorService } from '../services/instructor-service.js';
import { mediaService } from '../services/media-service.js';

/**
 * Instructor dashboard UI component.
 */
export class InstructorDashboard {
    /**
     * Create an InstructorDashboard instance.
     * @param {string} containerSelector
     * @param {Array<object>} coursesData
     */
    constructor(containerSelector, coursesData) {
        this.containerContainer = $(containerSelector);
        this.coursesData = coursesData || [];
        this.render();
    }

    /**
     * Render instructor dashboard.
     * @returns {void}
     */
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
                            <span class="section-badge"><i class="fa-solid fa-chalkboard-user"></i> Instructor Studio</span>
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
                        <div class="tabs" id="cms-builder-tabs" style="margin-bottom:var(--space-2)">
                            <span class="tab active" data-tab-target="tab-course">Course Builder</span>
                            <span class="tab" data-tab-target="tab-lesson">Lesson Builder</span>
                            <span class="tab" data-tab-target="tab-challenge">Create Challenge</span>
                            <span class="tab" data-tab-target="tab-interactions">Course Interactions</span>
                            <span class="tab" data-tab-target="tab-revenue">Revenue Tracking</span>
                        </div>

                        <!-- Course Builder -->
                        <div class="tab-panel" data-tab-panel="tab-course">
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
                                    <label>Course Thumbnail (JPG/PNG)</label>
                                    <input type="file" id="course-thumbnail" class="input" accept="image/png,image/jpeg">
                                    <div id="course-thumbnail-status" class="text-xs text-muted" style="margin-top:6px;">No file selected</div>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Estimated Total Lessons (number)</label>
                                    <input type="number" id="course-total-lessons" class="input" value="10" required>
                                </div>
                                <!-- Pricing Configuration -->
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Course Pricing</label>
                                    <div style="display:flex; gap:var(--space-4); align-items:center;">
                                        <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer;">
                                            <input type="radio" name="course-type" value="free" checked style="margin:0;">
                                            <span>Free</span>
                                        </label>
                                        <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer;">
                                            <input type="radio" name="course-type" value="premium" style="margin:0;">
                                            <span>Premium</span>
                                        </label>
                                    </div>
                                    <div id="price-input-container" style="margin-top:var(--space-3); display:none;">
                                        <div style="display:flex; align-items:center; gap:var(--space-2);">
                                            <span style="font-size:var(--text-sm); color:var(--text-muted);">$</span>
                                            <input type="number" id="course-price" class="input" placeholder="29.99" min="0.99" step="0.01" style="flex:1;">
                                            <span style="font-size:var(--text-sm); color:var(--text-muted);">USD</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-course" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Course</button>
                                </div>
                            </form>

                            <div style="margin-top:var(--space-8); border-top:1px solid var(--border-subtle); padding-top:var(--space-6);">
                                <h4 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-link"></i> Attach External Resource</h4>
                                <form id="resource-builder-form" onsubmit="event.preventDefault();">
                                    <div class="grid grid-2" style="gap:var(--space-4);">
                                        <div class="input-group">
                                            <label>Course ID</label>
                                            <input type="text" id="resource-course-id" class="input" placeholder="e.g. react-native-pro" required>
                                        </div>
                                        <div class="input-group">
                                            <label>Resource Type</label>
                                            <select id="resource-type" class="input">
                                                <option value="pdf">PDF</option>
                                                <option value="github">GitHub</option>
                                                <option value="link">External Link</option>
                                            </select>
                                        </div>
                                        <div class="input-group">
                                            <label>Resource Title</label>
                                            <input type="text" id="resource-title" class="input" required>
                                        </div>
                                        <div class="input-group">
                                            <label>Resource URL</label>
                                            <input type="url" id="resource-url" class="input" placeholder="https://..." required>
                                        </div>
                                    </div>
                                    <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end;">
                                        <button class="btn btn-outline" type="submit" id="btn-add-resource"><i class="fa-solid fa-paperclip"></i> Attach Resource</button>
                                    </div>
                                </form>
                            </div>

                            <div style="margin-top:var(--space-8); border-top:1px solid var(--border-subtle); padding-top:var(--space-6);">
                                <h4 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-circle-question"></i> Create Quiz</h4>
                                <form id="quiz-builder-form" onsubmit="event.preventDefault();">
                                    <div class="grid grid-2" style="gap:var(--space-4);">
                                        <div class="input-group">
                                            <label>Course ID</label>
                                            <input type="text" id="quiz-course-id" class="input" placeholder="e.g. react-native-pro" required>
                                        </div>
                                        <div class="input-group">
                                            <label>Quiz ID</label>
                                            <input type="text" id="quiz-id" class="input" placeholder="e.g. react-basics-quiz" required>
                                        </div>
                                        <div class="input-group">
                                            <label>Quiz Title</label>
                                            <input type="text" id="quiz-title" class="input" required>
                                        </div>
                                        <div class="input-group">
                                            <label>Passing Score (%)</label>
                                            <input type="number" id="quiz-passing-score" class="input" min="0" max="100" value="70" required>
                                        </div>
                                    </div>
                                    <div class="input-group" style="margin-top:var(--space-4);">
                                        <label>Questions (JSON Array)</label>
                                        <textarea id="quiz-questions-json" class="input textarea" rows="5" placeholder='[{"question":"What is JSX?","options":["A","B","C"],"answer":"A"}]' required></textarea>
                                    </div>
                                    <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end;">
                                        <button class="btn btn-primary" type="submit" id="btn-create-quiz"><i class="fa-solid fa-list-check"></i> Create Quiz</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        </div>

                        <!-- Lesson Builder -->
                        <div class="tab-panel" data-tab-panel="tab-lesson" style="display:none;">
                        <div class="card">
                            <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-video"></i> Add Lesson to Course</h3>
                            <form id="lesson-builder-form" onsubmit="event.preventDefault();">
                                <div class="input-group" style="margin-bottom:var(--space-4);">
                                    <label>Select Course</label>
                                    <div class="custom-select-container" id="course-select-container" style="position:relative;">
                                        <div class="input custom-select-display" tabindex="0" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" id="lesson-course-display">
                                            <span class="custom-select-value text-muted" data-value="">Search and select a course...</span>
                                            <i class="fa-solid fa-chevron-down text-muted"></i>
                                        </div>
                                        <div class="custom-select-dropdown" id="lesson-course-dropdown" style="display:none; position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); z-index:var(--z-tooltip); box-shadow:var(--shadow-lg); overflow:hidden;">
                                            <div style="padding:var(--space-2); border-bottom:1px solid var(--border-subtle); background:var(--bg-secondary);">
                                                <div style="position:relative;">
                                                    <i class="fa-solid fa-magnifying-glass text-muted" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:0.9rem;"></i>
                                                    <input type="text" id="lesson-course-search" class="input" placeholder="Search courses..." style="width:100%; padding-left:32px; height:36px; font-size:var(--text-sm);">
                                                </div>
                                            </div>
                                            <div class="custom-select-options" id="lesson-course-options" style="max-height:220px; overflow-y:auto; padding:var(--space-1) 0;">
                                                ${this.coursesData.map(c => `
                                                    <div class="custom-select-option" data-value="${c.id}" data-search="${c.title.toLowerCase()}" style="padding:var(--space-2) var(--space-4); cursor:pointer; display:flex; align-items:center; gap:var(--space-3); transition:background 0.2s; font-size:var(--text-sm);">
                                                        <div class="avatar-sm" style="width:24px; height:24px; border-radius:4px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color:white; font-size:10px;"><i class="${c.icon || 'fa-solid fa-book'}"></i></div>
                                                        <span style="color:var(--text-primary); font-weight:500;">${c.title}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <input type="hidden" id="lesson-course-id" required>
                                    </div>
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
                                        <label>Video Source</label>
                                        <select id="lesson-video-source" class="input">
                                            <option value="youtube">YouTube</option>
                                            <option value="cloudinary">Cloudinary Upload</option>
                                            <option value="vimeo">Vimeo</option>
                                            <option value="external">External URL</option>
                                        </select>
                                    </div>
                                    <div class="input-group">
                                        <label>Video URL / ID</label>
                                        <input type="text" id="lesson-video-url" class="input" placeholder="YouTube ID, Vimeo URL, or external video URL">
                                        <div style="display:flex; gap:var(--space-2); margin-top:var(--space-2);">
                                            <button type="button" class="btn btn-outline btn-sm" id="btn-upload-lesson-video"><i class="fa-solid fa-cloud-arrow-up"></i> Secure Upload</button>
                                        </div>
                                        <div id="lesson-video-status" class="text-xs text-muted" style="margin-top:6px;">No uploaded video selected</div>
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
                                    <label>Lesson Content / Notes (Markdown)</label>
                                    <div class="markdown-split">
                                        <div class="markdown-editor">
                                            <textarea id="lesson-content" class="input textarea" rows="8" placeholder="# Welcome\n\nWrite lesson notes here..."></textarea>
                                        </div>
                                        <div class="markdown-preview" id="lesson-content-preview">
                                            <div class="text-muted text-sm">Live preview will appear here.</div>
                                        </div>
                                    </div>
                                </div>
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-lesson" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson</button>
                                </div>
                            </form>
                        </div>
                        </div>

                        <!-- Challenge Builder -->
                        <div class="tab-panel" data-tab-panel="tab-challenge" style="display:none;">
                        <div class="card">
                            <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-code"></i> Create Coding Challenge</h3>
                            <form id="challenge-builder-form" onsubmit="event.preventDefault();">
                                <div class="grid grid-2" style="gap:var(--space-4);">
                                    <div class="input-group">
                                        <label>Challenge ID (e.g. html-card-layout)</label>
                                        <input type="text" id="challenge-id" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Course / Module ID</label>
                                        <input type="text" id="challenge-course-id" class="input" placeholder="e.g. html-fundamentals" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Challenge Title</label>
                                        <input type="text" id="challenge-title" class="input" required>
                                    </div>
                                    <div class="input-group">
                                        <label>Programming Language</label>
                                        <select id="challenge-language" class="input">
                                            <option value="html">HTML/CSS/JS</option>
                                            <option value="python">Python</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Instructions (Markdown supported)</label>
                                    <textarea id="challenge-instructions" class="input textarea" rows="4" placeholder="## Task\nDescribe the challenge..." required></textarea>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Starter Code</label>
                                    <textarea id="challenge-starter" class="input textarea" rows="6" placeholder="&lt;!-- Starter code --&gt;" required></textarea>
                                </div>
                                <div class="input-group" style="margin-top:var(--space-4);">
                                    <label>Validation / Test Logic (Regex / Assertions)</label>
                                    <textarea id="challenge-validation" class="input textarea" rows="4" placeholder="{\n  \"type\": \"regex\",\n  \"pattern\": \"...\"\n}" required></textarea>
                                </div>
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-challenge" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Challenge</button>
                                </div>
                            </form>
                        </div>
                        </div>

                        <!-- Manage Content -->
                        <div class="card">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);">
                                <div>
                                    <h3><i class="fa-solid fa-pen-to-square"></i> Manage Content</h3>
                                    <p class="text-muted text-sm">Edit or delete existing dynamic courses and lessons.</p>
                                </div>
                                <button class="btn btn-outline btn-sm" id="btn-refresh-content"><i class="fa-solid fa-rotate"></i> Refresh</button>
                            </div>

                            <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--space-6);">
                                <div>
                                    <h4 style="margin-bottom:var(--space-3);">Courses</h4>
                                    <div id="manage-courses-list" class="card" style="padding:var(--space-4); min-height:160px;"></div>
                                </div>
                                <div>
                                    <h4 style="margin-bottom:var(--space-3);">Lessons</h4>
                                    <div id="manage-lessons-list" class="card" style="padding:var(--space-4); min-height:160px;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Course Interactions -->
                        <div class="tab-panel" data-tab-panel="tab-interactions" style="display:none;">
                            <div class="card" style="padding:var(--space-8);">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                                    <h3 style="margin:0;"><i class="fa-solid fa-comments"></i> Course Reviews & Comments</h3>
                                    <button class="btn btn-outline btn-sm" id="btn-refresh-interactions"><i class="fa-solid fa-rotate"></i> Refresh</button>
                                </div>
                                <div id="interactions-container">
                                    <div style="text-align:center; padding:var(--space-8);"><div class="spinner-sm"></div> Loading interactions...</div>
                                </div>
                            </div>
                        </div>

                        <!-- Revenue Tracking -->
                        <div class="tab-panel" data-tab-panel="tab-revenue" style="display:none;">
                            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                                
                                <!-- Revenue Overview -->
                                <div class="grid grid-3" style="gap:var(--space-4);">
                                    <div class="admin-stats-card">
                                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-dollar-sign"></i> Total Earnings</div>
                                        <div class="admin-stats-value" id="stat-total-earnings">$0.00</div>
                                        <div style="font-size:0.8rem; color:var(--text-muted);">All time</div>
                                    </div>

                                    <div class="admin-stats-card">
                                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-users"></i> Total Enrollments</div>
                                        <div class="admin-stats-value" id="stat-total-enrollments">0</div>
                                        <div style="font-size:0.8rem; color:var(--text-muted);">Active students</div>
                                    </div>

                                    <div class="admin-stats-card">
                                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-book"></i> Active Courses</div>
                                        <div class="admin-stats-value" id="stat-active-courses">0</div>
                                        <div style="font-size:0.8rem; color:var(--text-muted);">Published courses</div>
                                    </div>
                                </div>

                                <!-- Earnings By Course -->
                                <div class="card" style="padding:var(--space-8);">
                                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-chart-pie"></i> Earnings by Course</h3>
                                    <div id="earnings-by-course-list" style="display:flex; flex-direction:column; gap:var(--space-3);">
                                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                                    </div>
                                </div>

                                <!-- Student Breakdown -->
                                <div class="card" style="padding:var(--space-8);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                                        <h3 style="margin:0;"><i class="fa-solid fa-person-hiking"></i> Student Revenue Breakdown</h3>
                                        <input type="text" id="filter-students" class="input" placeholder="Search by name..." style="width:200px;">
                                    </div>
                                    <div id="student-breakdown-list" style="display:flex; flex-direction:column; gap:var(--space-3);">
                                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._attachEvents();
        this._initCustomSelect();
        this._initMarkdownPreview();
        this._loadManageContent();
        this._initBuilderTabs();
    }

    /**
     * Initialize custom course select.
     * @returns {void}
     */
    _initCustomSelect() {
        const container = document.getElementById('course-select-container');
        const display = document.getElementById('lesson-course-display');
        const dropdown = document.getElementById('lesson-course-dropdown');
        const searchInput = document.getElementById('lesson-course-search');
        const optionsContainer = document.getElementById('lesson-course-options');
        const hiddenInput = document.getElementById('lesson-course-id');
        const valueDisplay = display?.querySelector('.custom-select-value');

        if (!container || !display || !dropdown) return;

        // Toggle dropdown
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            display.style.borderColor = isOpen ? 'var(--border-subtle)' : 'var(--brand-primary)';
            if (!isOpen) {
                searchInput.value = '';
                this._filterOptions('');
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
                display.style.borderColor = 'var(--border-subtle)';
            }
        });

        // Prevent closing when clicking inside dropdown
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        // Search filtering
        searchInput.addEventListener('input', (e) => {
            this._filterOptions(e.target.value.toLowerCase());
        });

        // Option selection delegator
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (!option) return;

            const val = option.dataset.value;
            const title = option.querySelector('span').textContent;
            
            hiddenInput.value = val;
            valueDisplay.textContent = title;
            valueDisplay.classList.remove('text-muted');
            valueDisplay.style.color = 'var(--text-primary)';
            
            // Mark visually active
            const allOptions = optionsContainer.querySelectorAll('.custom-select-option');
            allOptions.forEach(opt => opt.style.background = 'transparent');
            option.style.background = 'rgba(0, 120, 212, 0.1)';

            dropdown.style.display = 'none';
            display.style.borderColor = 'var(--border-subtle)';
        });

        // Hover effect delegator
        optionsContainer.addEventListener('mouseover', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option && option.dataset.value !== hiddenInput.value) {
                option.style.background = 'var(--bg-tertiary)';
            }
        });
        optionsContainer.addEventListener('mouseout', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option && option.dataset.value !== hiddenInput.value) {
                option.style.background = 'transparent';
            }
        });
    }

    /**
     * Filter course options by query.
     * @param {string} query
     * @returns {void}
     */
    _filterOptions(query) {
        const optionsContainer = document.getElementById('lesson-course-options');
        if (!optionsContainer) return;
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        let hasVisible = false;

        options.forEach(opt => {
            const searchData = opt.dataset.search || '';
            if (searchData.includes(query)) {
                opt.style.display = 'flex';
                hasVisible = true;
            } else {
                opt.style.display = 'none';
            }
        });

        // Handle empty state
        let emptyMsg = optionsContainer.querySelector('.empty-search');
        if (!hasVisible) {
            if (!emptyMsg) {
                optionsContainer.insertAdjacentHTML('beforeend', '<div class="empty-search text-muted" style="padding:var(--space-4); text-align:center; font-size:var(--text-sm);">No courses found matching criteria.</div>');
            } else {
                emptyMsg.style.display = 'block';
            }
        } else if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
    }

    /**
     * Attach UI events.
     * @returns {void}
     */
    _attachEvents() {
        const user = authService.getCurrentUser();

        // Handle pricing type toggle
        const priceRadios = document.querySelectorAll('input[name="course-type"]');
        const priceInputContainer = document.getElementById('price-input-container');
        const priceInput = document.getElementById('course-price');

        priceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'premium') {
                    priceInputContainer.style.display = 'block';
                    priceInput.required = true;
                } else {
                    priceInputContainer.style.display = 'none';
                    priceInput.required = false;
                    priceInput.value = '';
                }
            });
        });

        const thumbnailInput = document.getElementById('course-thumbnail');
        const thumbnailStatus = document.getElementById('course-thumbnail-status');
        if (thumbnailInput) {
            thumbnailInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                this.courseThumbnailFile = file || null;
                if (thumbnailStatus) {
                    thumbnailStatus.textContent = file ? `Selected: ${file.name}` : 'No file selected';
                }
            });
        }

        const videoSourceInput = document.getElementById('lesson-video-source');
        const videoUrlInput = document.getElementById('lesson-video-url');
        const videoStatus = document.getElementById('lesson-video-status');
        const btnUploadVideo = document.getElementById('btn-upload-lesson-video');

        if (videoSourceInput && videoUrlInput) {
            videoSourceInput.addEventListener('change', () => {
                const source = videoSourceInput.value;
                if (source === 'youtube') {
                    videoUrlInput.placeholder = 'YouTube video ID (e.g. dQw4w9WgXcQ)';
                } else if (source === 'vimeo') {
                    videoUrlInput.placeholder = 'Vimeo URL or video ID';
                } else if (source === 'cloudinary') {
                    videoUrlInput.placeholder = 'Cloudinary secure URL (auto-filled after upload)';
                } else {
                    videoUrlInput.placeholder = 'External HTTPS video URL';
                }
            });
        }

        if (btnUploadVideo) {
            btnUploadVideo.addEventListener('click', async () => {
                if (!videoSourceInput || videoSourceInput.value !== 'cloudinary') {
                    showToast('Select Cloudinary Upload as the video source first.', 'warning');
                    return;
                }

                btnUploadVideo.disabled = true;
                if (videoStatus) videoStatus.textContent = 'Opening secure upload widget...';

                await mediaService.openVideoUploadWidget({}, (info) => {
                    if (videoUrlInput) videoUrlInput.value = info?.secure_url || '';
                    if (videoStatus) videoStatus.textContent = info?.secure_url ? `Uploaded: ${info.original_filename || 'video'}` : 'Upload completed';
                    showToast('Video uploaded successfully.', 'success');
                }, (progress) => {
                    if (videoStatus && progress?.percent != null) {
                        videoStatus.textContent = `Uploading... ${Math.round(progress.percent)}%`;
                    }
                });

                btnUploadVideo.disabled = false;
            });
        }

        const btnSaveCourse = document.getElementById('btn-save-course');
        if (btnSaveCourse) {
            btnSaveCourse.addEventListener('click', async (e) => {
                const form = document.getElementById('course-builder-form');
                if (!form.checkValidity()) return;

                btnSaveCourse.disabled = true;
                btnSaveCourse.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const courseId = document.getElementById('course-id').value.trim();
                let thumbnailUrl = '';
                if (this.courseThumbnailFile) {
                    thumbnailUrl = await firestoreService.uploadImage(this.courseThumbnailFile, courseId);
                    if (!thumbnailUrl) {
                        showToast('Thumbnail upload failed. Please try again.', 'error');
                    }
                }

                const courseType = document.querySelector('input[name="course-type"]:checked').value;
                const coursePrice = courseType === 'premium' ? parseFloat(document.getElementById('course-price').value) : 0;

                const courseData = {
                    id: courseId,
                    title: document.getElementById('course-title').value.trim(),
                    icon: document.getElementById('course-icon').value.trim(),
                    difficulty: document.getElementById('course-difficulty').value,
                    description: document.getElementById('course-desc').value.trim(),
                    totalLessons: parseInt(document.getElementById('course-total-lessons').value, 10),
                    thumbnail: thumbnailUrl || '',
                    isDynamic: true, // Flag to identify cloud courses
                    instructorId: user?.uid || null,
                    instructorEmail: user?.email || null,
                    pricing: {
                        type: courseType, // 'free' or 'premium'
                        price: coursePrice // 0 for free, price in USD for premium
                    }
                };

                const success = await firestoreService.saveDynamicCourse(courseData);
                if (success) {
                    showToast('Course successfully published to the cloud!', 'success');
                    form.reset();
                    this.courseThumbnailFile = null;
                    if (thumbnailStatus) thumbnailStatus.textContent = 'No file selected';
                    // Add option to select dynamically
                    const optionsContainer = document.getElementById('lesson-course-options');
                    if (optionsContainer) {
                        const emptyMsg = optionsContainer.querySelector('.empty-search');
                        if (emptyMsg) emptyMsg.style.display = 'none';

                        const newOptionHTML = `
                            <div class="custom-select-option" data-value="${courseData.id}" data-search="${courseData.title.toLowerCase()}" style="padding:var(--space-2) var(--space-4); cursor:pointer; display:flex; align-items:center; gap:var(--space-3); transition:background 0.2s; font-size:var(--text-sm);">
                                <div class="avatar-sm" style="width:24px; height:24px; border-radius:4px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color:white; font-size:10px;"><i class="${courseData.icon}"></i></div>
                                <span style="color:var(--text-primary); font-weight:500;">${courseData.title}</span>
                            </div>
                        `;
                        optionsContainer.insertAdjacentHTML('beforeend', newOptionHTML);
                        
                        // In case it's the first one, auto select it
                        const hiddenInput = document.getElementById('lesson-course-id');
                        if (!hiddenInput.value) {
                            hiddenInput.value = courseData.id;
                            const displayVal = document.getElementById('lesson-course-display')?.querySelector('.custom-select-value');
                            if (displayVal) {
                                displayVal.textContent = courseData.title;
                                displayVal.classList.remove('text-muted');
                                displayVal.style.color = 'var(--text-primary)';
                            }
                        }
                    }
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

                const courseIdVal = document.getElementById('lesson-course-id').value;
                if (!courseIdVal) {
                    showToast('Please select a course first.', 'error');
                    return;
                }

                btnSaveLesson.disabled = true;
                btnSaveLesson.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const lessonData = {
                    id: document.getElementById('lesson-id').value.trim(),
                    courseId: courseIdVal,
                    title: document.getElementById('lesson-title').value.trim(),
                    type: document.getElementById('lesson-type').value,
                    videoSource: document.getElementById('lesson-video-source').value,
                    videoUrl: document.getElementById('lesson-video-url').value.trim(),
                    youtubeId: document.getElementById('lesson-video-source').value === 'youtube' ? document.getElementById('lesson-video-url').value.trim() : '',
                    duration: document.getElementById('lesson-duration').value.trim(),
                    order: parseInt(document.getElementById('lesson-order').value, 10),
                    content: document.getElementById('lesson-content').value.trim(),
                    isDynamic: true,
                    instructorId: user?.uid || null,
                    instructorEmail: user?.email || null
                };

                const success = await firestoreService.saveDynamicLesson(lessonData);
                if (success) {
                    showToast('Lesson successfully published to the cloud!', 'success');
                    form.reset();
                    // Reset custom select visual state
                    const displayVal = document.getElementById('lesson-course-display')?.querySelector('.custom-select-value');
                    if (displayVal) {
                        displayVal.textContent = 'Search and select a course...';
                        displayVal.classList.add('text-muted');
                        displayVal.style.color = '';
                    }
                    document.getElementById('lesson-course-id').value = '';
                    document.getElementById('lesson-video-url').value = '';
                    const allOpts = document.querySelectorAll('#lesson-course-options .custom-select-option');
                    allOpts.forEach(opt => opt.style.background = 'transparent');
                } else {
                    showToast('Failed to publish lesson.', 'error');
                }

                btnSaveLesson.disabled = false;
                btnSaveLesson.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson';
                this._loadManageContent();
            });
        }

        const btnSaveChallenge = document.getElementById('btn-save-challenge');
        if (btnSaveChallenge) {
            btnSaveChallenge.addEventListener('click', async () => {
                const form = document.getElementById('challenge-builder-form');
                if (!form.checkValidity()) return;

                btnSaveChallenge.disabled = true;
                btnSaveChallenge.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const challengeData = {
                    id: document.getElementById('challenge-id').value.trim(),
                    courseId: document.getElementById('challenge-course-id').value.trim(),
                    title: document.getElementById('challenge-title').value.trim(),
                    language: document.getElementById('challenge-language').value,
                    instructions: document.getElementById('challenge-instructions').value.trim(),
                    starterCode: document.getElementById('challenge-starter').value.trim(),
                    validation: document.getElementById('challenge-validation').value.trim(),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicChallenge(challengeData);
                if (success) {
                    showToast('Challenge successfully published!', 'success');
                    form.reset();
                } else {
                    showToast('Failed to publish challenge.', 'error');
                }

                btnSaveChallenge.disabled = false;
                btnSaveChallenge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Challenge';
            });
        }

        const refreshBtn = document.getElementById('btn-refresh-content');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this._loadManageContent());
        }

        const resourceForm = document.getElementById('resource-builder-form');
        const addResourceBtn = document.getElementById('btn-add-resource');
        if (resourceForm && addResourceBtn) {
            addResourceBtn.addEventListener('click', async () => {
                if (!resourceForm.checkValidity()) return;

                const courseId = document.getElementById('resource-course-id').value.trim();
                const payload = {
                    title: document.getElementById('resource-title').value.trim(),
                    url: document.getElementById('resource-url').value.trim(),
                    type: document.getElementById('resource-type').value,
                    addedBy: user?.uid || null
                };

                addResourceBtn.disabled = true;
                addResourceBtn.innerHTML = '<div class="spinner-sm"></div> Attaching...';

                const ok = await instructorService.addResource(courseId, payload);
                if (ok) {
                    resourceForm.reset();
                    showToast('Resource attached successfully.', 'success');
                }

                addResourceBtn.disabled = false;
                addResourceBtn.innerHTML = '<i class="fa-solid fa-paperclip"></i> Attach Resource';
            });
        }

        const quizForm = document.getElementById('quiz-builder-form');
        const createQuizBtn = document.getElementById('btn-create-quiz');
        if (quizForm && createQuizBtn) {
            createQuizBtn.addEventListener('click', async () => {
                if (!quizForm.checkValidity()) return;

                let parsedQuestions = [];
                try {
                    parsedQuestions = JSON.parse(document.getElementById('quiz-questions-json').value.trim());
                    if (!Array.isArray(parsedQuestions)) {
                        throw new Error('Questions must be a JSON array.');
                    }
                } catch (err) {
                    showToast(err.message || 'Invalid quiz JSON format.', 'error');
                    return;
                }

                const courseId = document.getElementById('quiz-course-id').value.trim();
                const quizData = {
                    id: document.getElementById('quiz-id').value.trim(),
                    title: document.getElementById('quiz-title').value.trim(),
                    passingScore: Number(document.getElementById('quiz-passing-score').value || 70),
                    questions: parsedQuestions,
                    instructorId: user?.uid || null,
                    instructorEmail: user?.email || null
                };

                createQuizBtn.disabled = true;
                createQuizBtn.innerHTML = '<div class="spinner-sm"></div> Creating...';

                const quizId = await instructorService.createQuiz(courseId, quizData);
                if (quizId) {
                    quizForm.reset();
                    showToast('Quiz created and linked to course.', 'success');
                }

                createQuizBtn.disabled = false;
                createQuizBtn.innerHTML = '<i class="fa-solid fa-list-check"></i> Create Quiz';
            });
        }
    }

    /**
     * Initialize builder tab switching.
     * @returns {void}
     */
    _initBuilderTabs() {
        const tabs = document.querySelectorAll('#cms-builder-tabs .tab');
        if (!tabs.length) return;
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tabTarget;
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.style.display = panel.dataset.tabPanel === target ? 'block' : 'none';
                });

                // Load data for new tabs
                if (target === 'tab-interactions') {
                    this._loadInteractions();
                    const refreshBtn = document.getElementById('btn-refresh-interactions');
                    if (refreshBtn) {
                        refreshBtn.addEventListener('click', () => this._loadInteractions());
                    }
                } else if (target === 'tab-revenue') {
                    this._loadRevenueTracking();
                }
            });
        });
    }

    /**
     * Load and render dynamic courses/lessons.
     * @returns {Promise<void>}
     */
    async _loadManageContent() {
        const coursesContainer = document.getElementById('manage-courses-list');
        const lessonsContainer = document.getElementById('manage-lessons-list');
        if (coursesContainer) coursesContainer.innerHTML = '<p class="text-muted text-sm">Loading courses...</p>';
        if (lessonsContainer) lessonsContainer.innerHTML = '<p class="text-muted text-sm">Loading lessons...</p>';

        const [courses, lessons] = await Promise.all([
            firestoreService.getDynamicCourses(),
            firestoreService.getDynamicLessons()
        ]);

        this.dynamicCourses = courses || [];
        this.dynamicLessons = lessons || [];

        if (coursesContainer) {
            if (!this.dynamicCourses.length) {
                coursesContainer.innerHTML = '<p class="text-muted text-sm">No dynamic courses found.</p>';
            } else {
                coursesContainer.innerHTML = this.dynamicCourses.map(course => {
                    const lessonCount = this.dynamicLessons.filter(l => l.courseId === course.id).length;
                    const sanitizedTitle = course.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    return `
                        <div class="flex" style="justify-content:space-between;align-items:center;padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);">
                            <div>
                                <strong>${sanitizedTitle}</strong>
                                <div class="text-xs text-muted">${course.id} • ${lessonCount} lessons</div>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-ghost btn-sm" data-edit-course="${course.id}"><i class="fa-solid fa-pen"></i> Edit</button>
                                <button class="btn btn-outline btn-sm" data-delete-course="${course.id}" style="border-color:var(--color-error);color:var(--color-error)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        if (lessonsContainer) {
            if (!this.dynamicLessons.length) {
                lessonsContainer.innerHTML = '<p class="text-muted text-sm">No dynamic lessons found.</p>';
            } else {
                lessonsContainer.innerHTML = this.dynamicLessons.map(lesson => {
                    return `
                        <div class="flex" style="justify-content:space-between;align-items:center;padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);">
                            <div>
                                <strong>${lesson.title}</strong>
                                <div class="text-xs text-muted">${lesson.id} • ${lesson.courseId}</div>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-ghost btn-sm" data-edit-lesson="${lesson.id}"><i class="fa-solid fa-pen"></i> Edit</button>
                                <button class="btn btn-outline btn-sm" data-delete-lesson="${lesson.id}" style="border-color:var(--color-error);color:var(--color-error)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        this._bindManageContentActions();
    }

    /**
     * Bind manage content actions.
     * @returns {void}
     */
    _bindManageContentActions() {
        document.querySelectorAll('[data-edit-course]').forEach(btn => {
            btn.addEventListener('click', () => this._editCourse(btn.dataset.editCourse));
        });
        document.querySelectorAll('[data-delete-course]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteCourse(btn.dataset.deleteCourse));
        });
        document.querySelectorAll('[data-edit-lesson]').forEach(btn => {
            btn.addEventListener('click', () => this._editLesson(btn.dataset.editLesson));
        });
        document.querySelectorAll('[data-delete-lesson]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteLesson(btn.dataset.deleteLesson));
        });
    }

    /**
     * Load course data into the form for editing.
     * @param {string} courseId
     * @returns {void}
     */
    _editCourse(courseId) {
        const course = this.dynamicCourses?.find(c => c.id === courseId);
        if (!course) return;
        document.getElementById('course-id').value = course.id || '';
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-icon').value = course.icon || 'fa-solid fa-code';
        document.getElementById('course-difficulty').value = course.difficulty || 'Beginner';
        document.getElementById('course-desc').value = course.description || '';
        document.getElementById('course-total-lessons').value = course.totalLessons || 1;

        // Load pricing information
        const courseType = course.pricing?.type || 'free';
        const priceRadios = document.querySelectorAll('input[name="course-type"]');
        priceRadios.forEach(radio => {
            radio.checked = radio.value === courseType;
        });

        const priceInputContainer = document.getElementById('price-input-container');
        const priceInput = document.getElementById('course-price');
        if (courseType === 'premium') {
            priceInputContainer.style.display = 'block';
            priceInput.required = true;
            priceInput.value = course.pricing?.price || '';
        } else {
            priceInputContainer.style.display = 'none';
            priceInput.required = false;
            priceInput.value = '';
        }

        document.getElementById('course-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Course loaded for editing.', 'info');
    }

    /**
     * Delete a course by ID.
     * @param {string} courseId
     * @returns {Promise<void>}
     */
    async _deleteCourse(courseId) {
        if (!confirm('Delete this course? This cannot be undone.')) return;
        const ok = await firestoreService.deleteDynamicCourse(courseId);
        if (ok) {
            showToast('Course deleted.', 'success');
            this._loadManageContent();
        } else {
            showToast('Failed to delete course.', 'error');
        }
    }

    /**
     * Load lesson data into the form for editing.
     * @param {string} lessonId
     * @returns {void}
     */
    _editLesson(lessonId) {
        const lesson = this.dynamicLessons?.find(l => l.id === lessonId);
        if (!lesson) return;

        document.getElementById('lesson-id').value = lesson.id || '';
        document.getElementById('lesson-title').value = lesson.title || '';
        document.getElementById('lesson-type').value = lesson.type || 'theory';
        document.getElementById('lesson-video-source').value = lesson.videoSource || (lesson.youtubeId ? 'youtube' : 'external');
        document.getElementById('lesson-video-url').value = lesson.videoUrl || lesson.youtubeId || '';
        document.getElementById('lesson-duration').value = lesson.duration || '';
        document.getElementById('lesson-order').value = lesson.order || 1;
        document.getElementById('lesson-content').value = lesson.content || '';

        const hiddenInput = document.getElementById('lesson-course-id');
        const displayVal = document.getElementById('lesson-course-display')?.querySelector('.custom-select-value');
        if (hiddenInput) hiddenInput.value = lesson.courseId || '';
        if (displayVal) {
            const courseTitle = this.coursesData.find(c => c.id === lesson.courseId)?.title || lesson.courseId;
            displayVal.textContent = courseTitle;
            displayVal.classList.remove('text-muted');
            displayVal.style.color = 'var(--text-primary)';
        }

        if (this._renderLessonPreview) this._renderLessonPreview();
        document.getElementById('lesson-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Lesson loaded for editing.', 'info');
    }

    /**
     * Delete a lesson by ID.
     * @param {string} lessonId
     * @returns {Promise<void>}
     */
    async _deleteLesson(lessonId) {
        if (!confirm('Delete this lesson? This cannot be undone.')) return;
        const ok = await firestoreService.deleteDynamicLesson(lessonId);
        if (ok) {
            showToast('Lesson deleted.', 'success');
            this._loadManageContent();
        } else {
            showToast('Failed to delete lesson.', 'error');
        }
    }

    /**
     * Initialize markdown preview for lesson content.
     * @returns {void}
     */
    _initMarkdownPreview() {
        const textarea = document.getElementById('lesson-content');
        const preview = document.getElementById('lesson-content-preview');
        if (!textarea || !preview) return;

        const render = () => {
            const raw = textarea.value || '';
            const html = window.marked ? window.marked.parse(raw, { breaks: true, gfm: true }) : raw;
            const safe = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
            preview.innerHTML = safe || '<div class="text-muted text-sm">Live preview will appear here.</div>';
        };

        this._renderLessonPreview = render;

        let t;
        const debounce = (fn, delay = 200) => {
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), delay);
            };
        };

        const onInput = debounce(render, 150);
        textarea.addEventListener('input', onInput);
        render();
    }

    // ================== NEW: COURSE INTERACTIONS ==================

    /**
     * Load and render course interactions (reviews/comments).
     * @returns {Promise<void>}
     */
    async _loadInteractions() {
        const user = authService.getCurrentUser();
        if (!user) return;

        const container = document.getElementById('interactions-container');
        container.innerHTML = '<div style="text-align:center; padding:var(--space-8);"><div class="spinner-sm"></div> Loading interactions...</div>';

        const interactions = await instructorService.getInstructorCourseInteractions(user.uid);
        
        if (interactions.length === 0) {
            container.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-8);">No interactions yet. Share your courses to get reviews!</div>';
            return;
        }

        const escapeHtml = (value) => String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const cardsHtml = interactions.map((interaction) => {
            const sanitizedCourseName = escapeHtml(interaction.courseName);
            const sanitizedAuthorName = escapeHtml(interaction.authorName || 'Anonymous');
            const sanitizedText = escapeHtml(interaction.text || interaction.comment || 'No text');
            const interactionType = interaction.type === 'comment' ? 'Lesson Comment' : 'Course Review';
            const lessonTitle = escapeHtml(interaction.lessonTitle || '');
            const rating = Number(interaction.rating || 0);

            const stars = Array.from({ length: 5 }, (_, i) => {
                const color = i < rating ? 'var(--color-success)' : 'var(--border-subtle)';
                return `<i class="fa-solid fa-star" style="color:${color}; font-size:0.8rem;"></i>`;
            }).join('');

            const repliesHtml = (interaction.replies || []).map((reply) => {
                const sanitizedReplyAuthor = escapeHtml(reply.authorName || 'You');
                const sanitizedReplyText = escapeHtml(reply.text || '');
                return `
                    <div style="padding:var(--space-3); background:rgba(0,120,212,0.05); border-radius:var(--radius-md);">
                        <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">${sanitizedReplyAuthor}</p>
                        <p style="margin:var(--space-1) 0 0 0; color:var(--text-primary); font-size:0.9rem;">${sanitizedReplyText}</p>
                    </div>
                `;
            }).join('');

            const contextLine = interaction.type === 'comment'
                ? `<span style="font-size:0.8rem; color:var(--text-muted);">${lessonTitle}</span>`
                : '';

            const repliesSection = repliesHtml
                ? `
                    <div style="margin-top:var(--space-4); padding-top:var(--space-4); border-top:1px solid var(--border-subtle);">
                        <p style="margin:0 0 var(--space-3) 0; font-size:0.85rem; color:var(--text-muted); font-weight:600;"><i class="fa-solid fa-comments"></i> Your replies:</p>
                        <div style="display:flex; flex-direction:column; gap:var(--space-2);">${repliesHtml}</div>
                    </div>
                `
                : '';

            return `
                <div style="padding:var(--space-6); background:var(--bg-tertiary); border-radius:var(--radius-md); border-left:3px solid var(--brand-primary); margin-bottom:var(--space-4);">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:var(--space-4);">
                        <div style="flex:1;">
                            <p style="margin:0; color:var(--text-muted); font-size:0.85rem;"><strong>${sanitizedCourseName}</strong> · ${interactionType}</p>
                            ${contextLine}
                            <h4 style="margin:var(--space-2) 0 0 0; color:var(--text-primary);">${sanitizedAuthorName}</h4>
                            <div style="display:flex; gap:var(--space-2); margin:var(--space-2) 0;">
                                ${stars}
                                <span style="font-size:0.85rem; color:var(--text-muted);">${rating}/5</span>
                            </div>
                            <p style="margin:var(--space-2) 0 0 0; color:var(--text-secondary); font-size:0.9rem;">${sanitizedText}</p>
                        </div>
                    </div>
                    <div style="margin-top:var(--space-3); display:flex; gap:var(--space-2);">
                        <textarea class="input textarea" rows="2" data-reply-input="${interaction.reviewId}" placeholder="Write a direct reply to this student..."></textarea>
                        <button class="btn btn-outline btn-sm reply-button" data-type="${interaction.type || 'review'}" data-course-id="${interaction.courseId}" data-lesson-id="${interaction.lessonId || ''}" data-review-id="${interaction.reviewId}"><i class="fa-solid fa-reply"></i> Send</button>
                    </div>
                    ${repliesSection}
                </div>
            `;
        });

        container.innerHTML = cardsHtml.join('');

        // Attach reply listeners
        container.querySelectorAll('.reply-button').forEach(btn => {
            btn.addEventListener('click', async () => {
                const input = container.querySelector(`[data-reply-input="${btn.dataset.reviewId}"]`);
                const replyText = input?.value?.trim();
                if (replyText) {
                    btn.disabled = true;
                    const success = await instructorService.replyToInteraction({
                        type: btn.dataset.type || 'review',
                        courseId: btn.dataset.courseId,
                        lessonId: btn.dataset.lessonId || null,
                        interactionId: btn.dataset.reviewId,
                        replyData: {
                        authorId: user.uid,
                        authorName: user.displayName || 'Instructor',
                        authorEmail: user.email,
                        text: replyText
                        }
                    });
                    if (success) {
                        this._loadInteractions();
                    }
                    btn.disabled = false;
                }
            });
        });
    }

    // ================== NEW: REVENUE TRACKING ==================

    /**
     * Load and render revenue tracking data.
     * @returns {Promise<void>}
     */
    async _loadRevenueTracking() {
        const user = authService.getCurrentUser();
        if (!user) return;

        // Load stats
        const earnings = await instructorService.getEarningsSummary(user.uid, 'all');
        const enrollments = await instructorService.getTotalEnrollments(user.uid);
        const courses = await instructorService.getInstructorCourses(user.uid);

        document.getElementById('stat-total-earnings').textContent = `$${earnings.totalEarnings}`;
        document.getElementById('stat-total-enrollments').textContent = enrollments;
        document.getElementById('stat-active-courses').textContent = courses.filter(c => (c.status || 'published') !== 'archived').length;

        // Load earnings by course
        const earningsByCoursee = await instructorService.getEarningsByCourse(user.uid);
        this._renderEarningsByCoursee(earningsByCoursee);

        // Load student breakdown
        const studentBreakdown = await instructorService.getStudentEarningsBreakdown(user.uid);
        this._renderStudentBreakdown(studentBreakdown);
    }

    _renderEarningsByCoursee(earnings) {
        const container = document.getElementById('earnings-by-course-list');
        
        if (earnings.length === 0) {
            container.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No earnings data yet.</div>';
            return;
        }

        container.innerHTML = earnings.map(course => {
            const sanitizedCourseName = course.courseName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
            <div style="padding:var(--space-4); background:var(--bg-secondary); border-radius:var(--radius-md); border-left:3px solid var(--color-success); display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 var(--space-1) 0; color:var(--text-primary);">${sanitizedCourseName}</h4>
                    <p style="margin:0; color:var(--text-muted); font-size:0.85rem;">${course.enrolledStudents} students enrolled</p>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:1.5rem; font-weight:800; color:var(--color-success);">$${course.totalRevenue.toFixed(2)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">$${course.revenuePerStudent}/student avg</div>
                </div>
            </div>
        `}).join('');
    }

    _renderStudentBreakdown(students) {
        const container = document.getElementById('student-breakdown-list');
        
        if (students.length === 0) {
            container.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No student data yet.</div>';
            return;
        }

        container.innerHTML = students.map(student => {
            const sanitizedStudentName = student.studentName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const sanitizedStudentEmail = student.studentEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
            <div style="padding:var(--space-4); background:var(--bg-secondary); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; border-left:3px solid var(--brand-primary);">
                <div style="flex:1;">
                    <h4 style="margin:0; color:var(--text-primary);">${sanitizedStudentName}</h4>
                    <p style="margin:var(--space-1) 0 0 0; color:var(--text-muted); font-size:0.85rem;">${sanitizedStudentEmail} • ${student.coursesPurchased} course(s)</p>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:600; color:var(--text-primary);">$${student.totalSpent.toFixed(2)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Total spent</div>
                </div>
            </div>
        `}).join('');

        // Attach search listener
        const searchInput = document.getElementById('filter-students');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                container.querySelectorAll('div[style*="padding"]').forEach(item => {
                    const name = item.querySelector('h4')?.textContent.toLowerCase() || '';
                    const email = item.querySelector('p')?.textContent.toLowerCase() || '';
                    item.style.display = name.includes(query) || email.includes(query) ? '' : 'none';
                });
            });
        }
    }
}

