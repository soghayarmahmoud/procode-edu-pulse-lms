import { $, showToast } from '../utils/dom.js';
import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';
import { mediaService } from '../services/media-service.js';
import { store } from '../store/store.js';

/**
 * Enhanced Admin Dashboard for ProCode Platform
 * Manages users, courses, analytics, content moderation
 */
export class AdminDashboard {
    constructor(containerSelector) {
        this.container = $(containerSelector);
        this.currentTab = 'overview';
        this.adminStats = {};
        this.render();
    }

    async render() {
        if (!this.container) return;

        const user = authService.getCurrentUser();
        if (!user) {
            this.container.innerHTML = '<div class="container" style="padding:var(--space-16)"><div class="card text-center"><h1>Access Denied</h1><p>Please log in to access admin panel.</p></div></div>';
            return;
        }

        // Load admin stats
        try {
            this.adminStats = await firestoreService.getAdminDashboardStats() || {};
        } catch (err) {
            console.error('Failed to load admin stats:', err);
            this.adminStats = {};
        }

        this.container.innerHTML = `
            <div class="admin-dashboard" style="display:flex; min-height:100vh; background:var(--bg-primary);">
                ${this._renderSidebar()}
                ${this._renderWorkspace()}
            </div>
            <style>
                .admin-tab-btn { 
                    color: var(--text-secondary); 
                    border-radius: var(--radius-md); 
                    transition: all 0.2s; 
                    text-align: left;
                    justify-content: flex-start;
                }
                .admin-tab-btn:hover { 
                    background: var(--bg-tertiary); 
                    color: var(--text-primary); 
                }
                .admin-tab-btn.active { 
                    background: rgba(0, 120, 212, 0.1); 
                    color: var(--brand-primary); 
                    font-weight: 600 !important; 
                }
                .admin-stats-card { 
                    background: var(--bg-elevated); 
                    border: 1px solid var(--border-subtle); 
                    border-radius: var(--radius-lg); 
                    padding: var(--space-6); 
                    display: flex; 
                    flex-direction: column; 
                    gap: var(--space-2);
                    transition: transform 0.2s;
                }
                .admin-stats-card:hover { 
                    transform: translateY(-2px); 
                    box-shadow: var(--shadow-md); 
                }
                .admin-stats-value { 
                    font-size: 2.5rem; 
                    font-weight: 800; 
                    background: var(--gradient-primary); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent;
                }
                .admin-content-area { padding: var(--space-8); flex: 1; overflow-y: auto; }
                
                @media (max-width: 900px) {
                    .admin-dashboard { flex-direction: column !important; }
                    .admin-sidebar { width: 100% !important; border-right: none !important; }
                    .admin-nav { flex-direction: row !important; flex-wrap: wrap; }
                    .admin-workspace { height: auto !important; }
                }
            </style>
        `;

        this._attachSidebarEvents();
        this._renderContentArea();
    }

    _renderSidebar() {
        const user = authService.getCurrentUser();
        return `
            <aside class="admin-sidebar" style="width:280px; flex-shrink:0; background:var(--bg-elevated); border-right:1px solid var(--border-subtle); display:flex; flex-direction:column; overflow-y:auto;">
                <div style="padding:var(--space-6) var(--space-6); border-bottom:1px solid var(--border-subtle);">
                    <div style="display:flex; align-items:center; gap:var(--space-3);">
                        <div class="avatar-sm" style="background:var(--brand-primary); color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; width:36px; height:36px;">
                            <i class="fa-solid fa-shield"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.1rem;">Admin Panel</h3>
                            <span class="text-muted" style="font-size:0.75rem;">ProCode v2.0</span>
                        </div>
                    </div>
                </div>

                <nav class="admin-nav" style="padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-2); flex:1;">
                    <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">MAIN</span>
                    
                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-chart-pie" style="width:20px;"></i> Overview
                    </button>
                    
                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-users-gear" style="width:20px;"></i> Users
                    </button>
                    
                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'courses' ? 'active' : ''}" data-tab="courses" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-book" style="width:20px;"></i> Courses
                    </button>

                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'content' ? 'active' : ''}" data-tab="content" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-image" style="width:20px;"></i> Media
                    </button>

                    <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-top:var(--space-4); font-weight:700;">ADVANCED</span>

                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'moderation' ? 'active' : ''}" data-tab="moderation" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-ban" style="width:20px;"></i> Moderation
                    </button>

                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-chart-line" style="width:20px;"></i> Analytics
                    </button>

                    <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'settings' ? 'active' : ''}" data-tab="settings" style="padding:var(--space-3) var(--space-4);">
                        <i class="fa-solid fa-sliders" style="width:20px;"></i> Settings
                    </button>
                </nav>

                <div style="padding:var(--space-4) var(--space-4); border-top:1px solid var(--border-subtle); text-align:center;">
                    <div class="text-muted" style="font-size:0.8rem; margin-bottom:var(--space-2);">
                        ${user.email}
                    </div>
                    <a href="#/" class="btn btn-outline btn-sm" style="width:100%;">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Exit
                    </a>
                </div>
            </aside>
        `;
    }

    _renderWorkspace() {
        const user = authService.getCurrentUser();
        return `
            <main class="admin-workspace bg-dots-pattern" style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
                <header style="padding:var(--space-4) var(--space-8); background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle); position:sticky; top:0; z-index:10;">
                    <h2 style="margin:0; font-size:1.4rem;" id="workspace-title">Dashboard</h2>
                </header>

                <div class="admin-content-area" id="admin-content-area">
                    <div class="spinner-sm"></div> Loading...
                </div>
            </main>
        `;
    }

    _attachSidebarEvents() {
        const tabs = this.container.querySelectorAll('.admin-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this._renderContentArea();
            });
        });
    }

    _renderContentArea() {
        const contentArea = document.getElementById('admin-content-area');
        if (!contentArea) return;

        const title = document.getElementById('workspace-title');
        if (title) {
            const titles = {
                overview: 'Dashboard Overview',
                users: 'User Management',
                courses: 'Course Management',
                content: 'Media Management',
                moderation: 'Content Moderation',
                analytics: 'Analytics & Revenue',
                settings: 'System Settings'
            };
            title.textContent = titles[this.currentTab] || 'Dashboard';
        }

        switch (this.currentTab) {
            case 'overview':
                contentArea.innerHTML = this._renderOverview();
                this._loadOverviewData();
                break;
            case 'users':
                contentArea.innerHTML = this._renderUsers();
                this._loadUsers();
                break;
            case 'courses':
                contentArea.innerHTML = this._renderCourses();
                this._loadCourses();
                break;
            case 'content':
                contentArea.innerHTML = this._renderContent();
                break;
            case 'moderation':
                contentArea.innerHTML = this._renderModeration();
                this._loadModeration();
                break;
            case 'analytics':
                contentArea.innerHTML = this._renderAnalytics();
                this._loadAnalytics();
                break;
            case 'settings':
                contentArea.innerHTML = this._renderSettings();
                break;
        }
    }

    _renderOverview() {
        return `
            <div class="page-wrapper">
                <div style="margin-bottom:var(--space-8);">
                    <h1 class="section-title">Dashboard Overview</h1>
                    <p class="text-muted">Manage all aspects of the ProCode platform.</p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-4" style="gap:var(--space-4); margin-bottom:var(--space-8);">
                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-users"></i> Total Users</div>
                        <div class="admin-stats-value" id="stat-users">-</div>
                        <div class="text-xs text-muted">Active platform users</div>
                    </div>

                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-book"></i> Courses</div>
                        <div class="admin-stats-value" id="stat-courses">-</div>
                        <div class="text-xs text-muted">Published courses</div>
                    </div>

                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-dollar-sign"></i> Revenue</div>
                        <div class="admin-stats-value" id="stat-revenue">$0</div>
                        <div class="text-xs text-muted">Total earnings</div>
                    </div>

                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-chart-line"></i> Growth</div>
                        <div class="admin-stats-value" id="stat-growth">↑ 12%</div>
                        <div class="text-xs text-muted">Month over month</div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-2" style="gap:var(--space-6);">
                    <div class="card" style="padding:var(--space-6);">
                        <h3 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-bolt"></i> Quick Actions</h3>
                        <div style="display:flex; flex-direction:column; gap:var(--space-2);">
                            <button class="btn btn-outline" style="justify-content:flex-start;"><i class="fa-solid fa-user-plus"></i> Add User</button>
                            <button class="btn btn-outline" style="justify-content:flex-start;"><i class="fa-solid fa-book-plus"></i> Create Course</button>
                            <button class="btn btn-outline" style="justify-content:flex-start;"><i class="fa-solid fa-flag"></i> Review Reports</button>
                        </div>
                    </div>

                    <div class="card" style="padding:var(--space-6);">
                        <h3 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-bell"></i> Recent Activity</h3>
                        <div id="activity-feed" style="display:flex; flex-direction:column; gap:var(--space-3);">
                            <div class="text-muted text-sm">Loading activity...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async _loadOverviewData() {
        const stats = this.adminStats;
        document.getElementById('stat-users').textContent = stats.totalUsers || 0;
        document.getElementById('stat-courses').textContent = stats.totalCourses || 0;
        document.getElementById('stat-revenue').textContent = '$' + (stats.totalRevenue || 0).toFixed(2);
    }

    _renderUsers() {
        return `
            <div class="page-wrapper">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <div>
                        <h1 class="section-title">User Management</h1>
                        <p class="text-muted">Manage platform users, roles, and permissions.</p>
                    </div>
                    <button class="btn btn-primary" id="btn-add-user"><i class="fa-solid fa-user-plus"></i> Add User</button>
                </div>

                <div class="card" style="padding:var(--space-6);">
                    <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4);">
                        <input type="text" class="input" id="search-users" placeholder="Search users..." style="flex:1; max-width:300px;">
                        <select class="input" id="filter-role" style="width:150px;">
                            <option value="">All Roles</option>
                            <option value="student">Students</option>
                            <option value="instructor">Instructors</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    <div id="users-list" style="border-top:1px solid var(--border-subtle); padding-top:var(--space-4);">
                        <p class="text-muted">Loading users...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async _loadUsers() {
        try {
            const users = await firestoreService.getAllUsers() || [];
            const usersList = document.getElementById('users-list');
            
            if (!users.length) {
                usersList.innerHTML = '<p class="text-muted">No users found.</p>';
                return;
            }

            usersList.innerHTML = users.map(user => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) 0; border-bottom:1px solid var(--border-subtle);">
                    <div>
                        <strong>${user.email}</strong>
                        <div class="text-xs text-muted">
                            Role: <span style="text-transform:capitalize;">${user.role || 'student'}</span> • 
                            Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    <div style="display:flex; gap:var(--space-2);">
                        <button class="btn btn-ghost btn-sm" data-promote-user="${user.uid}"><i class="fa-solid fa-arrow-up"></i> Promote</button>
                        <button class="btn btn-outline btn-sm" data-ban-user="${user.uid}" style="border-color:var(--color-error); color:var(--color-error);"><i class="fa-solid fa-ban"></i> Ban</button>
                    </div>
                </div>
            `).join('');

            // Attach promote/ban events
            usersList.querySelectorAll('[data-promote-user]').forEach(btn => {
                btn.addEventListener('click', () => this._promoteUser(btn.dataset.promoteUser));
            });
            usersList.querySelectorAll('[data-ban-user]').forEach(btn => {
                btn.addEventListener('click', () => this._banUser(btn.dataset.banUser));
            });
        } catch (err) {
            console.error('Failed to load users:', err);
            document.getElementById('users-list').innerHTML = '<p class="text-error">Failed to load users.</p>';
        }
    }

    async _promoteUser(userId) {
        const newRole = prompt('Enter new role (student/instructor/admin):');
        if (!newRole || !['student', 'instructor', 'admin'].includes(newRole)) {
            showToast('Invalid role.', 'error');
            return;
        }

        const success = await firestoreService.updateUserRole(userId, newRole);
        if (success) {
            showToast(`User promoted to ${newRole}.`, 'success');
            this._loadUsers();
        } else {
            showToast('Failed to update user role.', 'error');
        }
    }

    async _banUser(userId) {
        if (!confirm('Are you sure you want to ban this user?')) return;
        
        const success = await firestoreService.updateUserRole(userId, 'banned');
        if (success) {
            showToast('User has been banned.', 'success');
            this._loadUsers();
        } else {
            showToast('Failed to ban user.', 'error');
        }
    }

    _renderCourses() {
        return `
            <div class="page-wrapper">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <div>
                        <h1 class="section-title">Course Management</h1>
                        <p class="text-muted">Manage all courses, approve submissions, and handle moderation.</p>
                    </div>
                    <button class="btn btn-primary" id="btn-create-course"><i class="fa-solid fa-plus"></i> Create Course</button>
                </div>

                <div class="card" style="padding:var(--space-6);">
                    <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4);">
                        <input type="text" class="input" placeholder="Search courses..." style="flex:1; max-width:300px;">
                        <select class="input" style="width:150px;">
                            <option value="">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="pending">Pending Approval</option>
                        </select>
                    </div>

                    <div id="courses-list" style="border-top:1px solid var(--border-subtle); padding-top:var(--space-4);">
                        <p class="text-muted">Loading courses...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async _loadCourses() {
        try {
            const courses = store.state.courses || [];
            const coursesList = document.getElementById('courses-list');
            
            if (!courses.length) {
                coursesList.innerHTML = '<p class="text-muted">No courses found.</p>';
                return;
            }

            coursesList.innerHTML = courses.map(course => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) 0; border-bottom:1px solid var(--border-subtle);">
                    <div style="display:flex; gap:var(--space-4); align-items:center; flex:1;">
                        <img src="${course.thumbnail || 'placeholder'}" alt="" style="width:60px; height:40px; border-radius:4px; object-fit:cover; background:var(--bg-tertiary);">
                        <div>
                            <strong>${course.title}</strong>
                            <div class="text-xs text-muted">
                                ${course.totalLessons} lessons • ${course.enrollments || 0} students • 
                                <span style="text-transform:capitalize;">${course.status || 'published'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:var(--space-2);">
                        <button class="btn btn-ghost btn-sm" data-edit-course="${course.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-outline btn-sm" data-delete-course="${course.id}" style="border-color:var(--color-error); color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `).join('');

            coursesList.querySelectorAll('[data-delete-course]').forEach(btn => {
                btn.addEventListener('click', () => this._deleteCourse(btn.dataset.deleteCourse));
            });
        } catch (err) {
            console.error('Failed to load courses:', err);
            document.getElementById('courses-list').innerHTML = '<p class="text-error">Failed to load courses.</p>';
        }
    }

    async _deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
        
        showToast('Course deletion queued. This may take a moment...', 'info');
        const success = await firestoreService.deleteDynamicCourse(courseId);
        if (success) {
            showToast('Course deleted successfully.', 'success');
            this._loadCourses();
        } else {
            showToast('Failed to delete course.', 'error');
        }
    }

    _renderContent() {
        return `
            <div class="page-wrapper">
                <h1 class="section-title">Media Management</h1>
                <p class="text-muted">Manage uploaded videos, images, and media files.</p>

                <div class="card" style="padding:var(--space-6); margin-top:var(--space-4);">
                    <div style="text-align:center; padding:var(--space-8);">
                        <i class="fa-solid fa-image" style="font-size:3rem; color:var(--text-muted); margin-bottom:var(--space-4); display:block;"></i>
                        <h3>Media Storage Dashboard</h3>
                        <p class="text-muted">Cloudinary storage metrics visible here.</p>
                        <button class="btn btn-primary"><i class="fa-solid fa-refresh"></i> Sync Cloudinary Status</button>
                    </div>
                </div>
            </div>
        `;
    }

    _renderModeration() {
        return `
            <div class="page-wrapper">
                <h1 class="section-title">Content Moderation</h1>
                <p class="text-muted">Review flagged content, user reports, and take moderation actions.</p>

                <div class="grid grid-2" style="gap:var(--space-6); margin-top:var(--space-4);">
                    <div class="card" style="padding:var(--space-6);">
                        <h3><i class="fa-solid fa-flag"></i> Flagged Reviews</h3>
                        <div id="flagged-reviews" style="margin-top:var(--space-4);">
                            <p class="text-muted">Loading flagged content...</p>
                        </div>
                    </div>

                    <div class="card" style="padding:var(--space-6);">
                        <h3><i class="fa-solid fa-comments"></i> Reported Comments</h3>
                        <div id="reported-comments" style="margin-top:var(--space-4);">
                            <p class="text-muted">No reported comments at this time.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async _loadModeration() {
        // Load flagged content
        try {
            const flaggedReviews = await firestoreService.getFlaggedReviews() || [];
            const container = document.getElementById('flagged-reviews');
            
            if (!flaggedReviews.length) {
                container.innerHTML = '<p class="text-muted">No flagged reviews.</p>';
                return;
            }

            container.innerHTML = flaggedReviews.map(review => `
                <div style="padding:var(--space-3) 0; border-bottom:1px solid var(--border-subtle);">
                    <strong>${review.authorName}</strong>
                    <p class="text-sm" style="margin:var(--space-1) 0;">${review.content}</p>
                    <div style="display:flex; gap:var(--space-2);">
                        <button class="btn btn-ghost btn-sm" data-approve-review="${review.id}"><i class="fa-solid fa-check"></i> Approve</button>
                        <button class="btn btn-outline btn-sm" data-delete-review="${review.id}" style="border-color:var(--color-error);"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Failed to load flagged reviews:', err);
        }
    }

    _renderAnalytics() {
        return `
            <div class="page-wrapper">
                <h1 class="section-title">Analytics & Revenue</h1>
                <p class="text-muted">Platform-wide analytics, revenue tracking, and growth metrics.</p>

                <div class="grid grid-3" style="gap:var(--space-4); margin-top:var(--space-4);">
                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-dollar-sign"></i> Total Revenue</div>
                        <div class="admin-stats-value">$0.00</div>
                        <div class="text-xs text-muted">All time earnings</div>
                    </div>

                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-user-check"></i> Conversion Rate</div>
                        <div class="admin-stats-value">0%</div>
                        <div class="text-xs text-muted">Free to paid</div>
                    </div>

                    <div class="admin-stats-card">
                        <div class="text-muted"><i class="fa-solid fa-hourglass-end"></i> Avg Completion</div>
                        <div class="admin-stats-value">0%</div>
                        <div class="text-xs text-muted">Course completion rate</div>
                    </div>
                </div>

                <div class="card" style="padding:var(--space-6); margin-top:var(--space-4);">
                    <h3>Revenue by Course</h3>
                    <div id="revenue-chart" style="margin-top:var(--space-4); text-align:center; padding:var(--space-8); color:var(--text-muted);">
                        Chart data will appear here
                    </div>
                </div>
            </div>
        `;
    }

    async _loadAnalytics() {
        const stats = this.adminStats;
        // Update analytics when data loads
    }

    _renderSettings() {
        return `
            <div class="page-wrapper">
                <h1 class="section-title">System Settings</h1>
                <p class="text-muted">Configure platform-wide settings and preferences.</p>

                <div class="grid grid-2" style="gap:var(--space-6); margin-top:var(--space-4);">
                    <div class="card" style="padding:var(--space-6);">
                        <h3><i class="fa-solid fa-gear"></i> General Settings</h3>
                        <div style="margin-top:var(--space-4);">
                            <div class="input-group" style="margin-bottom:var(--space-3);">
                                <label>Platform Name</label>
                                <input type="text" class="input" value="ProCode EduPulse" id="setting-name">
                            </div>
                            <div class="input-group" style="margin-bottom:var(--space-3);">
                                <label>Maintenance Mode</label>
                                <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer;">
                                    <input type="checkbox" id="maintenance-mode">
                                    <span>Enable maintenance mode</span>
                                </label>
                            </div>
                            <button class="btn btn-primary"><i class="fa-solid fa-save"></i> Save Settings</button>
                        </div>
                    </div>

                    <div class="card" style="padding:var(--space-6);">
                        <h3><i class="fa-solid fa-bell"></i> Notifications</h3>
                        <div style="margin-top:var(--space-4);">
                            <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer; margin-bottom:var(--space-2);">
                                <input type="checkbox" checked>
                                <span>New course submissions</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer; margin-bottom:var(--space-2);">
                                <input type="checkbox" checked>
                                <span>User reports</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:var(--space-2); cursor:pointer;">
                                <input type="checkbox" checked>
                                <span>Revenue alerts (>$1000)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export default AdminDashboard;
