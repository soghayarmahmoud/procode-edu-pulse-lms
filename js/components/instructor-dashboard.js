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
                        <div class="tabs" id="cms-builder-tabs" style="margin-bottom:var(--space-2)">
                            <span class="tab active" data-tab-target="tab-course">Course Builder</span>
                            <span class="tab" data-tab-target="tab-lesson">Lesson Builder</span>
                            <span class="tab" data-tab-target="tab-challenge">Create Challenge</span>
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
                                <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                                    <button class="btn btn-primary" id="btn-save-course" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Course</button>
                                </div>
                            </form>
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

    _attachEvents() {
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

                const courseData = {
                    id: courseId,
                    title: document.getElementById('course-title').value.trim(),
                    icon: document.getElementById('course-icon').value.trim(),
                    difficulty: document.getElementById('course-difficulty').value,
                    description: document.getElementById('course-desc').value.trim(),
                    totalLessons: parseInt(document.getElementById('course-total-lessons').value, 10),
                    thumbnail: thumbnailUrl || '',
                    isDynamic: true // Flag to identify cloud courses
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
                    // Reset custom select visual state
                    const displayVal = document.getElementById('lesson-course-display')?.querySelector('.custom-select-value');
                    if (displayVal) {
                        displayVal.textContent = 'Search and select a course...';
                        displayVal.classList.add('text-muted');
                        displayVal.style.color = '';
                    }
                    document.getElementById('lesson-course-id').value = '';
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
    }

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
            });
        });
    }

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
                    return `
                        <div class="flex" style="justify-content:space-between;align-items:center;padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);">
                            <div>
                                <strong>${course.title}</strong>
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

    _editCourse(courseId) {
        const course = this.dynamicCourses?.find(c => c.id === courseId);
        if (!course) return;
        document.getElementById('course-id').value = course.id || '';
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-icon').value = course.icon || 'fa-solid fa-code';
        document.getElementById('course-difficulty').value = course.difficulty || 'Beginner';
        document.getElementById('course-desc').value = course.description || '';
        document.getElementById('course-total-lessons').value = course.totalLessons || 1;
        document.getElementById('course-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Course loaded for editing.', 'info');
    }

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

    _editLesson(lessonId) {
        const lesson = this.dynamicLessons?.find(l => l.id === lessonId);
        if (!lesson) return;

        document.getElementById('lesson-id').value = lesson.id || '';
        document.getElementById('lesson-title').value = lesson.title || '';
        document.getElementById('lesson-type').value = lesson.type || 'theory';
        document.getElementById('lesson-youtube').value = lesson.youtubeId || '';
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
}
