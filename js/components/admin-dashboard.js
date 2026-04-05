import { $, showToast } from '../utils/dom.js';
import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';
import { mediaService } from '../services/media-service.js';
import { adminManagementService } from '../services/admin-management-service.js';

/**
 * Admin dashboard UI component.
 */
export class AdminDashboard {
    /**
     * Create an AdminDashboard instance.
     * @param {string} containerSelector
     * @param {object} systemData
     */
    constructor(containerSelector, systemData) {
        this.containerContainer = $(containerSelector);
        this.systemData = systemData || {};
        this.currentTab = 'overview';
        // Local state for builders
        this.courseThumbnail = '';
        this.lessonVideoUrl = '';
        this.render();
    }

    /**
     * Render admin dashboard.
     * @returns {Promise<void>}
     */
    async render() {
        if (!this.containerContainer) return;

        const user = authService.getCurrentUser();
        if (!user) {
            this._renderAccessDenied();
            return;
        }

        // Feature: Protected Admin Dashboard Sub-routing & Layout
        // Strict Route Guard: query Firestore to verify administrator privileges.
        this.containerContainer.innerHTML = '<div class="container" style="padding:var(--space-16);text-align:center;"><div class="spinner-sm"></div> Verifying Credentials...</div>';
        
        try {
            const userDoc = await firestoreService.getUserProfile(user.uid);
            // Some profiles might have data nested under .profile
            let isAdmin = userDoc?.isAdmin || (userDoc?.profile && userDoc.profile.isAdmin) || false;
            
            // Super Admin Fallback for immediate access
            if (user.email === 'mahmoudsruby@gmail.com' || user.email === 'mahmoudabdelrauf84@gmail.com') {
                isAdmin = true;
            }
            
            if (!isAdmin) {
                this._renderAccessDenied('Administrator privilege required.');
                return;
            }
        } catch (err) {
            this._renderAccessDenied('Failed to verify credentials.');
            return;
        }

        this.containerContainer.innerHTML = `
            <div class="admin-layout" style="display:flex; min-height:100vh; background:var(--bg-primary);">
                
                <!-- Sidebar -->
                <aside class="admin-sidebar" style="width:280px; flex-shrink:0; background:var(--bg-elevated); border-right:1px solid var(--border-subtle); display:flex; flex-direction:column;">
                    <div style="padding:var(--space-6) var(--space-6); border-bottom:1px solid var(--border-subtle);">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div class="avatar-sm" style="background:var(--brand-primary); color:white; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                <i class="fa-solid fa-server"></i>
                            </div>
                            <div>
                                <h3 style="margin:0; font-size:1.1rem; line-height:1.2;">ProCode Admin</h3>
                                <span class="text-muted" style="font-size:0.8rem;">v2.0.0-alpha</span>
                            </div>
                        </div>
                    </div>

                    <nav class="admin-nav" style="padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-2); flex:1;">
                        <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:var(--space-2); padding-left:var(--space-2); font-weight:700;">Navigation</span>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-chart-pie" style="width:24px; text-align:center;"></i> Dashboard Overview
                        </button>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'courses' ? 'active' : ''}" data-tab="courses" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-layer-group" style="width:24px; text-align:center;"></i> Course Builder
                        </button>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-users-gear" style="width:24px; text-align:center;"></i> User Management
                        </button>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'content' ? 'active' : ''}" data-tab="content" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-photo-film" style="width:24px; text-align:center;"></i> Content & Media
                        </button>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'submissions' ? 'active' : ''}" data-tab="submissions" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                                <span><i class="fa-solid fa-inbox" style="width:24px; text-align:center;"></i> Submissions Inbox</span>
                                <span class="badge" style="background:var(--color-error); color:white; border-radius:12px; font-size:0.7rem;">3</span>
                            </div>
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'challenges' ? 'active' : ''}" data-tab="challenges" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-code" style="width:24px; text-align:center;"></i> Challenge Builder
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'docs' ? 'active' : ''}" data-tab="docs" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-file-code" style="width:24px; text-align:center;"></i> Docs Manager
                        </button>
                        
                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'tasks' ? 'active' : ''}" data-tab="tasks" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-list-check" style="width:24px; text-align:center;"></i> Tasks Manager
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'portfolios' ? 'active' : ''}" data-tab="portfolios" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-briefcase" style="width:24px; text-align:center;"></i> Portfolio Manager
                        </button>

                        <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-top:var(--space-4); margin-bottom:var(--space-2); padding-left:var(--space-2); font-weight:700;">Advanced Controls</span>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-chart-line" style="width:24px; text-align:center;"></i> Analytics & Revenue
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'moderation' ? 'active' : ''}" data-tab="moderation" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-shield" style="width:24px; text-align:center;"></i> Content Moderation
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'settings' ? 'active' : ''}" data-tab="settings" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-sliders" style="width:24px; text-align:center;"></i> System Settings
                        </button>

                        <button class="btn btn-ghost admin-tab-btn ${this.currentTab === 'gamification' ? 'active' : ''}" data-tab="gamification" style="justify-content:flex-start; text-align:left; padding:var(--space-3) var(--space-4); font-weight:500;">
                            <i class="fa-solid fa-gem" style="width:24px; text-align:center;"></i> Gamification Modifiers
                        </button>
                    </nav>

                    <div style="padding:var(--space-6) var(--space-4); border-top:1px solid var(--border-subtle);">
                        <a href="#/" class="btn btn-outline" style="width:100%; justify-content:center;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Exit to App</a>
                    </div>
                </aside>

                <!-- Workspace -->
                <main class="admin-workspace bg-dots-pattern" style="flex:1; display:flex; flex-direction:column; height:100vh; overflow-y:auto;">
                    
                    <header style="padding:var(--space-4) var(--space-8); background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10;">
                        <h2 style="margin:0; font-size:1.4rem;" id="admin-workspace-title">Initializing...</h2>
                        
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <button class="btn btn-ghost btn-icon"><i class="fa-regular fa-bell"></i></button>
                            <a href="#/profile" style="width:36px; height:36px; border-radius:50%; background:var(--brand-primary); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; text-decoration:none; cursor:pointer;" title="Go to Profile">
                                ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                            </a>
                        </div>
                    </header>

                    <div class="admin-content-area" id="admin-content-area" style="padding:var(--space-8); flex:1;">
                        <!-- Dynamic Content Injected Here -->
                    </div>

                </main>
            </div>
            
            <style>
                .admin-tab-btn { color: var(--text-secondary); border-radius: var(--radius-md); transition: all 0.2s; }
                .admin-tab-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
                .admin-tab-btn.active { background: rgba(0, 120, 212, 0.1); color: var(--brand-primary); font-weight: 600 !important; }
                
                .admin-stats-card { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); transition: transform 0.2s; }
                .admin-stats-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
                .admin-stats-value { font-size: 2.5rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

                @media (max-width: 900px) {
                    .admin-layout { flex-direction: column !important; }
                    .admin-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border-subtle); }
                    .admin-nav { flex-direction: row !important; flex-wrap: wrap; gap: var(--space-1) !important; padding: var(--space-3) var(--space-4) !important; }
                    .admin-nav > span { display: none; }
                    .admin-tab-btn { font-size: 0.85rem !important; padding: var(--space-2) var(--space-3) !important; }
                    .admin-workspace { height: auto !important; min-height: calc(100vh - 200px); }
                    .grid-3 { grid-template-columns: 1fr !important; }
                    .grid-2 { grid-template-columns: 1fr !important; }
                }
            </style>
        `;

        this._attachEvents();
        this._renderActiveTab();
    }

    /**
     * Attach UI event handlers.
     * @returns {void}
     */
    _attachEvents() {
        const tabs = this.containerContainer.querySelectorAll('.admin-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                const btn = e.currentTarget;
                btn.classList.add('active');
                
                // Switch tab
                this.currentTab = btn.dataset.tab;
                this._renderActiveTab();
            });
        });
    }

    /**
     * Render the active tab panel.
     * @returns {void}
     */
    _renderActiveTab() {
        const area = document.getElementById('admin-content-area');
        const title = document.getElementById('admin-workspace-title');
        if (!area || !title) return;

        area.style.opacity = '0';
        
        setTimeout(() => {
            switch(this.currentTab) {
                case 'overview':
                    title.innerHTML = 'Dashboard Overview';
                    this._renderOverviewTab(area);
                    break;
                case 'users':
                    title.innerHTML = 'User Management Directory';
                    this._renderUsersTab(area);
                    break;
                case 'content':
                    title.innerHTML = 'Media & Asset Library';
                    this._renderContentTab(area);
                    break;
                case 'courses':
                    title.innerHTML = 'Master Course Studio';
                    this._renderCoursesTab(area);
                    break;
                case 'challenges':
                    title.innerHTML = 'Challenge Builder Studio';
                    this._renderChallengesTab(area);
                    break;
                case 'submissions':
                    title.innerHTML = 'Review Submissions';
                    this._renderSubmissionsTab(area);
                    break;
                case 'gamification':
                    title.innerHTML = 'Gamification Logic Modifiers';
                    this._renderGamificationTab(area);
                    break;
                case 'docs':
                    title.innerHTML = 'Documentation Manager';
                    this._renderDocsTab(area);
                    break;
                case 'tasks':
                    title.innerHTML = 'Tasks Manager';
                    this._renderTasksTab(area);
                    break;
                case 'portfolios':
                    title.innerHTML = 'Portfolio Manager';
                    this._renderPortfoliosTab(area);
                    break;
                case 'analytics':
                    title.innerHTML = 'Platform Analytics & Revenue';
                    this._renderAnalyticsTab(area);
                    break;
                case 'moderation':
                    title.innerHTML = 'Content Moderation Hub';
                    this._renderModerationTab(area);
                    break;
                case 'settings':
                    title.innerHTML = 'System Configuration';
                    this._renderSettingsTab(area);
                    break;
            }
            
            area.style.transition = 'opacity 0.3s ease';
            area.style.opacity = '1';
        }, 150);
    }

    // ── Tab Renderers ──

    /**
     * Render overview tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderOverviewTab(container) {
        const staticCourses = (this.systemData.coursesData || []).length;
        container.innerHTML = `
            <div class="grid grid-3" style="gap:var(--space-6); margin-bottom:var(--space-8);">
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Total Registered Users</span>
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="admin-stats-value" id="stat-total-users"><div class="spinner-sm"></div></div>
                    <div style="font-size:0.85rem; color:var(--text-muted);" id="stat-users-sub">Loading from Firestore...</div>
                </div>
                
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Course Catalog Size</span>
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <div class="admin-stats-value" id="stat-total-courses">${staticCourses}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);" id="stat-courses-sub">${staticCourses} static + <span id="stat-dynamic-courses">...</span> cloud</div>
                </div>
                
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Dynamic Challenges</span>
                        <i class="fa-solid fa-code"></i>
                    </div>
                    <div class="admin-stats-value" id="stat-total-challenges"><div class="spinner-sm"></div></div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Cloud-published challenges</div>
                </div>
            </div>

            <div class="card" style="padding:var(--space-6);">
                <h3 style="margin-bottom:var(--space-4);">System Health & APIs</h3>
                <div class="grid grid-2" style="gap:var(--space-4);">
                    <div style="padding:var(--space-4); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div style="width:12px; height:12px; border-radius:50%; background:var(--color-success);"></div>
                            <span style="font-weight:600;">Firestore Database</span>
                        </div>
                        <span class="text-muted" style="font-size:0.9rem;">Connected</span>
                    </div>
                    <div style="padding:var(--space-4); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div style="width:12px; height:12px; border-radius:50%; background:var(--color-success);"></div>
                            <span style="font-weight:600;">Firebase Auth</span>
                        </div>
                        <span class="text-muted" style="font-size:0.9rem;">Active</span>
                    </div>
                    <div style="padding:var(--space-4); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div style="width:12px; height:12px; border-radius:50%; background:var(--color-warning);"></div>
                            <span style="font-weight:600;">Cloudinary Storage</span>
                        </div>
                        <span class="text-muted" style="font-size:0.9rem;">Awaiting API Keys</span>
                    </div>
                    <div style="padding:var(--space-4); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div style="width:12px; height:12px; border-radius:50%; background:var(--color-success);"></div>
                            <span style="font-weight:600;">Piston Execution Engine</span>
                        </div>
                        <span class="text-muted" style="font-size:0.9rem;">Online (sandbox.piston)</span>
                    </div>
                </div>
            </div>
        `;

        // Fetch live stats from Firestore
        firestoreService.getAdminDashboardStats().then(stats => {
            if (!stats) return;
            const usersEl = document.getElementById('stat-total-users');
            const usersSubEl = document.getElementById('stat-users-sub');
            const dynCoursesEl = document.getElementById('stat-dynamic-courses');
            const totalCoursesEl = document.getElementById('stat-total-courses');
            const challengesEl = document.getElementById('stat-total-challenges');

            if (usersEl) usersEl.textContent = stats.totalUsers.toLocaleString();
            if (usersSubEl) usersSubEl.innerHTML = `<i class="fa-solid fa-database" style="margin-right:4px;"></i> Live from Firestore`;
            if (dynCoursesEl) dynCoursesEl.textContent = stats.totalDynamicCourses;
            if (totalCoursesEl) totalCoursesEl.textContent = staticCourses + stats.totalDynamicCourses;
            if (challengesEl) challengesEl.textContent = stats.totalDynamicChallenges;
        });
    }

    /**
     * Render users tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderUsersTab(container) {
        container.innerHTML = `
            <div class="card" style="padding:var(--space-6); margin-bottom:var(--space-6);">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--space-4); margin-bottom:var(--space-6);">
                    <div class="input-group" style="margin:0; width:300px; flex:1; min-width:260px;">
                        <div style="position:relative;">
                            <i class="fa-solid fa-search text-muted" style="position:absolute; left:12px; top:50%; transform:translateY(-50%);"></i>
                            <input type="text" class="input" placeholder="Search by email, UID, or name..." style="padding-left:36px; padding-top:8px; padding-bottom:8px;" id="admin-user-search">
                        </div>
                    </div>
                    <button class="btn btn-outline" id="btn-refresh-users"><i class="fa-solid fa-rotate"></i> Refresh</button>
                </div>

                <div class="card" style="padding:var(--space-4); margin-bottom:var(--space-6); background:var(--bg-tertiary); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
                    <div style="display:flex; flex-wrap:wrap; gap:var(--space-3); align-items:flex-end;">
                        <div class="input-group" style="flex:1; min-width:240px; margin:0;">
                            <label>Promote user to instructor or admin</label>
                            <input type="text" class="input" id="admin-add-instructor-input" placeholder="Enter email or UID">
                        </div>
                        <button class="btn btn-primary" id="btn-promote-instructor" style="min-width:180px;">Make Instructor</button>
                        <button class="btn btn-secondary" id="btn-promote-admin" style="min-width:180px;">Make Admin</button>
                    </div>
                    <p class="text-muted" style="margin-top:var(--space-3); font-size:0.85rem;">Use an existing user email or UID. If the user has not signed in yet, ask them to register first.</p>
                </div>

                <div id="admin-users-table-container" style="overflow-x:auto;">
                    <div style="text-align:center; padding:var(--space-8); color:var(--text-muted);">
                        <div class="spinner-sm" style="margin:0 auto var(--space-4);"></div>
                        Loading users from Firestore...
                    </div>
                </div>
            </div>
        `;

        this._loadUsersData();

        const searchInput = document.getElementById('admin-user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#admin-users-table-container tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(q) ? '' : 'none';
                });
            });
        }

        const btnRefresh = document.getElementById('btn-refresh-users');
        if (btnRefresh) btnRefresh.onclick = () => this._loadUsersData();

        const promoteInput = document.getElementById('admin-add-instructor-input');
        const btnPromoteInstructor = document.getElementById('btn-promote-instructor');
        const btnPromoteAdmin = document.getElementById('btn-promote-admin');

        const promoteRole = async (role) => {
            const value = promoteInput?.value?.trim();
            if (!value) {
                showToast('Enter an email or UID to promote.', 'error');
                return;
            }
            const user = await this._findUserByIdentifier(value);
            if (!user) {
                showToast('User not found. Search by exact email or UID.', 'error');
                return;
            }

            const updates = {
                isInstructor: role === 'instructor' ? true : user.isInstructor || (user.profile?.isInstructor || false),
                isAdmin: role === 'admin' ? true : user.isAdmin || (user.profile?.isAdmin || false)
            };

            const ok = await firestoreService.updateUserRole(user.uid, updates);
            if (ok) {
                showToast(`User ${role === 'admin' ? 'granted admin' : 'made instructor'} successfully.`, 'success');
                promoteInput.value = '';
                this._loadUsersData();
            } else {
                showToast('Failed to update user role.', 'error');
            }
        };

        if (btnPromoteInstructor) btnPromoteInstructor.onclick = () => promoteRole('instructor');
        if (btnPromoteAdmin) btnPromoteAdmin.onclick = () => promoteRole('admin');
    }

    async _loadUsersData() {
        const tableContainer = document.getElementById('admin-users-table-container');
        if (!tableContainer) return;

        const users = await firestoreService.getAllUsers();

        if (users.length === 0) {
            tableContainer.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--text-muted);"><i class="fa-solid fa-users" style="font-size:2rem; display:block; margin-bottom:var(--space-4);"></i>No users found in Firestore.</div>';
            return;
        }

        const rowsHtml = users.map(u => {
            const profile = u.profile || {};
            const name = profile.name || u.displayName || u.email || u.uid.slice(0,8);
            const email = profile.email || u.email || u.uid;
            const initials = name.slice(0,2).toUpperCase();
            const isAdmin = u.isAdmin || profile.isAdmin;
            const isInstructor = u.isInstructor || profile.isInstructor;
            const roleBadge = isAdmin && isInstructor
                ? '<span class="badge" style="background:rgba(231,76,60,0.1); color:var(--color-error);">Admin / Instructor</span>'
                : isAdmin
                    ? '<span class="badge" style="background:rgba(231,76,60,0.1); color:var(--color-error);">Admin</span>'
                    : isInstructor
                        ? '<span class="badge" style="background:rgba(0,120,212,0.1); color:var(--brand-primary);">Instructor</span>'
                        : '<span class="badge" style="background:rgba(136,136,136,0.12); color:var(--text-muted);">Student</span>';
            const lastActive = u.updatedAt?.seconds
                ? new Date(u.updatedAt.seconds * 1000).toLocaleDateString()
                : 'N/A';

            return `
                <tr style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:var(--space-4) var(--space-2);">
                        <div style="display:flex; align-items:center; gap:var(--space-3);">
                            <div class="avatar-sm" style="background:${isAdmin ? 'var(--brand-primary)' : isInstructor ? 'var(--brand-primary)' : 'var(--bg-tertiary)'}; color:${isAdmin || isInstructor ? 'white' : 'var(--text-primary)'}; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:600;">${initials}</div>
                            <div>
                                <div style="font-weight:600;">${name}</div>
                                <div class="text-muted" style="font-size:0.8rem;">${email}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding:var(--space-4) var(--space-2);">${roleBadge}</td>
                    <td style="padding:var(--space-4) var(--space-2);">${lastActive}</td>
                    <td style="padding:var(--space-4) var(--space-2); text-align:right; display:flex; justify-content:flex-end; gap:6px;">
                        <button class="btn btn-ghost btn-sm btn-toggle-instructor" data-uid="${u.uid}" data-instructor="${isInstructor ? 'true' : 'false'}" title="${isInstructor ? 'Revoke Instructor' : 'Make Instructor'}"><i class="fa-solid fa-chalkboard-user"></i></button>
                        <button class="btn btn-ghost btn-sm btn-toggle-admin" data-uid="${u.uid}" data-admin="${isAdmin ? 'true' : 'false'}" title="${isAdmin ? 'Revoke Admin' : 'Make Admin'}"><i class="fa-solid fa-shield-halved"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        tableContainer.innerHTML = `
            <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                    <tr style="border-bottom:2px solid var(--border-subtle); color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">
                        <th style="padding:var(--space-3) var(--space-2);">User</th>
                        <th style="padding:var(--space-3) var(--space-2);">Role</th>
                        <th style="padding:var(--space-3) var(--space-2);">Last Active</th>
                        <th style="padding:var(--space-3) var(--space-2); text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div style="margin-top:var(--space-4); color:var(--text-muted); font-size:0.9rem;">Showing ${users.length} users</div>
        `;

        // Wire toggle admin buttons
        tableContainer.querySelectorAll('.btn-toggle-instructor').forEach(btn => {
            btn.onclick = async () => {
                const uid = btn.dataset.uid;
                const isCurrentlyInstructor = btn.dataset.instructor === 'true';
                const action = isCurrentlyInstructor ? 'revoke instructor role from' : 'grant instructor role to';
                if (!confirm(`Are you sure you want to ${action} this user?`)) return;
                btn.disabled = true;
                const ok = await firestoreService.updateUserRole(uid, { isInstructor: !isCurrentlyInstructor });
                if (ok) {
                    showToast('Instructor role updated successfully.', 'success');
                    this._loadUsersData();
                } else {
                    showToast('Failed to update instructor role.', 'error');
                    btn.disabled = false;
                }
            };
        });

        tableContainer.querySelectorAll('.btn-toggle-admin').forEach(btn => {
            btn.onclick = async () => {
                const uid = btn.dataset.uid;
                const isCurrentlyAdmin = btn.dataset.admin === 'true';
                const action = isCurrentlyAdmin ? 'revoke admin from' : 'grant admin to';
                if (!confirm(`Are you sure you want to ${action} this user?`)) return;
                btn.disabled = true;
                const ok = await firestoreService.updateUserRole(uid, { isAdmin: !isCurrentlyAdmin });
                if (ok) {
                    showToast(`User role updated successfully.`, 'success');
                    this._loadUsersData();
                } else {
                    showToast('Failed to update user role.', 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    async _findUserByIdentifier(identifier) {
        if (!identifier) return null;
        const users = await firestoreService.getAllUsers();
        const normalized = identifier.trim().toLowerCase();
        return users.find(u =>
            u.uid === identifier ||
            (u.email && u.email.toLowerCase() === normalized) ||
            (u.profile?.email && u.profile.email.toLowerCase() === normalized) ||
            (u.profile?.name && u.profile.name.toLowerCase() === normalized)
        ) || null;
    }

    /**
     * Render content tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderContentTab(container) {
        const cloudConfig = mediaService.getConfig ? mediaService.getConfig() : { cloudName: '', uploadPreset: '' };
        const cfgCloudName = cloudConfig.cloudName || localStorage.getItem('cloudinary_cloud_name') || '';
        const cfgUploadPreset = cloudConfig.uploadPreset || localStorage.getItem('cloudinary_upload_preset') || '';

        container.innerHTML = `
            <div class="grid grid-2" style="gap:var(--space-6);">
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
                        <h3 style="margin:0;"><i class="fa-solid fa-folder-tree"></i> Static Catalogs</h3>
                    </div>
                    <p class="text-muted" style="margin-bottom:var(--space-6);">These counts represent locally stored JSON manifests currently being served to clients.</p>
                    <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:var(--space-3);">
                        <li style="display:flex; justify-content:space-between; padding:var(--space-3); background:var(--bg-tertiary); border-radius:var(--radius-md);">
                            <span><i class="fa-solid fa-book" style="color:var(--brand-primary); margin-right:8px;"></i> Courses.json</span>
                            <span style="font-weight:bold;">${(this.systemData.coursesData || []).length} items</span>
                        </li>
                        <li style="display:flex; justify-content:space-between; padding:var(--space-3); background:var(--bg-tertiary); border-radius:var(--radius-md);">
                            <span><i class="fa-solid fa-video" style="color:var(--brand-primary); margin-right:8px;"></i> Lessons.json</span>
                            <span style="font-weight:bold;">${(this.systemData.lessonsData || []).length} items</span>
                        </li>
                        <li style="display:flex; justify-content:space-between; padding:var(--space-3); background:var(--bg-tertiary); border-radius:var(--radius-md);">
                            <span><i class="fa-solid fa-map" style="color:var(--brand-primary); margin-right:8px;"></i> Roadmaps.json</span>
                            <span style="font-weight:bold;">${(this.systemData.roadmapsData || []).length} items</span>
                        </li>
                    </ul>
                </div>
                
                <div class="card" style="display:flex; flex-direction:column;">
                    <h3 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-cloud"></i> Cloudinary Integrations</h3>
                    <p class="text-muted" style="margin-bottom:var(--space-6);">To upload custom Course Thumbnails and Video materials, enter your free Cloudinary API credentials below. This allows massive scale via their CDN.</p>
                    
                    <form id="cloudinary-config-form" style="display:flex; flex-direction:column; gap:var(--space-4); flex:1;">
                        <div class="input-group">
                            <label>Cloud Name</label>
                            <input type="text" id="cloud-name" class="input" placeholder="e.g. dpqjxyz12" value="${cfgCloudName}">
                        </div>
                        <div class="input-group">
                            <label>Upload Preset (Unsigned)</label>
                            <input type="text" id="upload-preset" class="input" placeholder="e.g. procode_uploads" value="${cfgUploadPreset}">
                        </div>
                        <div style="margin-top:auto; display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-save"></i> Save Config</button>
                        </div>
                    </form>
                </div>
                
                <div class="card" style="grid-column: 1 / -1; display:flex; justify-content:center; padding:var(--space-8);">
                    <div style="text-align:center;">
                        <i class="fa-solid fa-wand-magic-sparkles text-muted" style="font-size:3rem; margin-bottom:var(--space-4);"></i>
                        <h3>Media Optimization</h3>
                        <p class="text-muted" style="max-width:400px; margin:0 auto var(--space-4);">Use Cloudinary to ensure your media is optimized for mobile performance (Phase 2).</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render courses tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderCoursesTab(container) {
        // Integrate InstructorDashboard logic here
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <!-- Course Builder -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:48px; height:48px; border-radius:12px; background:rgba(108, 92, 231, 0.1); color:var(--brand-primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                            <div>
                                <h3 style="margin:0;">Create New Course</h3>
                                <p class="text-muted" style="font-size:0.9rem;">Define a new learning path in the catalog.</p>
                            </div>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-open-media-library" type="button">
                            <i class="fa-solid fa-photo-film"></i> Course Media Library
                        </button>
                    </div>
                    
                    <form id="course-builder-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Course ID (unique-slug)</label>
                                <input type="text" id="course-id" class="input" placeholder="e.g. advanced-react" required>
                            </div>
                            <div class="input-group">
                                <label>Course Title</label>
                                <input type="text" id="course-title" class="input" placeholder="e.g. React.js: The Deep Dive" required>
                            </div>
                            <div class="input-group">
                                <label>FontAwesome Icon</label>
                                <input type="text" id="course-icon" class="input" value="fa-solid fa-code" required>
                            </div>
                            <div class="input-group">
                                <label>Difficulty Level</label>
                                <select id="course-difficulty" class="input">
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Course Description</label>
                            <textarea id="course-desc" class="input textarea" rows="3" placeholder="What will students learn?" required></textarea>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Total Estimated Lessons</label>
                            <input type="number" id="course-total-lessons" class="input" value="10" required>
                        </div>

                        <!-- Course Thumbnail Upload -->
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Course Thumbnail (Image)</label>
                            <div style="display:flex; gap:var(--space-4); align-items:center;">
                                <button type="button" class="btn btn-secondary" id="btn-upload-thumbnail">
                                    <i class="fa-solid fa-image"></i> Upload Thumbnail
                                </button>
                                <div id="thumbnail-preview" style="width:60px; height:40px; border-radius:4px; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid var(--border-subtle);">
                                    <i class="fa-solid fa-photo-film text-muted"></i>
                                </div>
                                <span id="thumbnail-status" class="text-muted" style="font-size:var(--text-xs);">No file uploaded</span>
                            </div>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-course" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Course to Cloud</button>
                        </div>
                    </form>
                </div>

                <!-- Lesson Builder -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(0, 184, 148, 0.1); color:var(--color-success); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-video"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Add Lesson to Course</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Attach rich media or coding labs to a specific course.</p>
                        </div>
                    </div>

                    <form id="lesson-builder-form" onsubmit="event.preventDefault();">
                        <div class="input-group" style="margin-bottom:var(--space-6);">
                            <label>Target Course</label>
                            <div class="custom-select-container" id="course-select-container" style="position:relative;">
                                <div class="input custom-select-display" tabindex="0" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" id="lesson-course-display">
                                    <span class="custom-select-value text-muted" data-value="">Select target course...</span>
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
                                        ${(this.systemData.coursesData || []).map(c => `
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
                                <label>Lesson Slug (unique)</label>
                                <input type="text" id="lesson-id" class="input" placeholder="e.g. state-management" required>
                            </div>
                            <div class="input-group">
                                <label>Lesson Title</label>
                                <input type="text" id="lesson-title" class="input" placeholder="e.g. Deep Dive into useState" required>
                            </div>
                            <div class="input-group">
                                <label>Lesson Type</label>
                                <select id="lesson-type" class="input">
                                    <option value="theory">Theory (Video)</option>
                                    <option value="practice">Practice (Interactive Code)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>YouTube Video ID (Optional)</label>
                                <input type="text" id="lesson-youtube" class="input" placeholder="e.g. dQw4w9WgXcQ">
                            </div>
                            <div class="input-group">
                                <label>Cloudinary Video (Phase 2)</label>
                                <div style="display:flex; gap:var(--space-2); align-items:center;">
                                    <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-video" style="padding: 0 var(--space-3); height:38px;">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Upload
                                    </button>
                                    <div id="video-preview-icon" style="color:var(--color-success); display:none;">
                                        <i class="fa-solid fa-circle-check"></i>
                                    </div>
                                    <span id="video-status" class="text-muted" style="font-size:var(--text-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;">No video</span>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Duration (minutes)</label>
                                <input type="text" id="lesson-duration" class="input" value="10 min">
                            </div>
                            <div class="input-group">
                                <label>Order #</label>
                                <input type="number" id="lesson-order" class="input" value="1">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Lesson Notes (Markdown)</label>
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
                            <button class="btn btn-primary" id="btn-save-lesson" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson to Cloud</button>
                        </div>
                    </form>
                </div>

                <!-- Manage Existing Courses -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list"></i> Manage Existing Courses</h3>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-courses"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="courses-list-container">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>

                <!-- Manage Existing Lessons -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list"></i> Manage Existing Lessons</h3>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-lessons"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="lessons-list-container">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>

            </div>
        `;
        
        // Initialize dynamic logic for this tab
        this._initCourseBuilderLogic();
        this._initMarkdownPreview();
        setTimeout(() => {
            this._loadExistingCourses();
            this._loadExistingLessons();
        }, 100);
    }

    /**
     * Initialize course/lesson builder logic.
     * @returns {void}
     */
    _initCourseBuilderLogic() {
        // This is a port of the logic from InstructorDashboard._initCustomSelect and _attachEvents
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
        const closeHandler = (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
                display.style.borderColor = 'var(--border-subtle)';
            }
        };
        document.addEventListener('click', closeHandler);
        // Store cleanup if needed (though single page app usually doesn't care)

        // Prevent closing when clicking inside dropdown
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        // Search filtering
        searchInput.addEventListener('input', (e) => {
            this._filterOptions(e.target.value.toLowerCase());
        });

        // Option selection
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (!option) return;

            const val = option.dataset.value;
            const title = option.querySelector('span').textContent;
            
            hiddenInput.value = val;
            valueDisplay.textContent = title;
            valueDisplay.classList.remove('text-muted');
            valueDisplay.style.color = 'var(--text-primary)';
            
            const allOptions = optionsContainer.querySelectorAll('.custom-select-option');
            allOptions.forEach(opt => opt.style.background = 'transparent');
            option.style.background = 'rgba(0, 120, 212, 0.1)';

            dropdown.style.display = 'none';
            display.style.borderColor = 'var(--border-subtle)';
        });

        // -- Cloudinary Config Form --
        const configForm = document.getElementById('cloudinary-config-form');
        if (configForm) {
            configForm.onsubmit = (e) => {
                e.preventDefault();
                const cloudName = document.getElementById('cloud-name').value.trim();
                const uploadPreset = document.getElementById('upload-preset').value.trim();
                mediaService.saveConfig(cloudName, uploadPreset);
            };
        }

        // -- Course Thumbnail Upload --
        const btnUploadThumbnail = document.getElementById('btn-upload-thumbnail');
        if (btnUploadThumbnail) {
            btnUploadThumbnail.onclick = () => {
                mediaService.openUploadWidget({
                    clientAllowedFormats: ["jpg", "png", "jpeg", "webp"],
                    maxFileSize: 2000000, // 2MB
                    multiple: false,
                    folder: 'course_thumbnails'
                }, (info) => {
                    this.courseThumbnail = info.secure_url;
                    const preview = document.getElementById('thumbnail-preview');
                    const status = document.getElementById('thumbnail-status');
                    if (preview) preview.innerHTML = `<img src="${info.secure_url}" style="width:100%; height:100%; object-fit:cover;">`;
                    if (status) status.textContent = 'Upload successful!';
                });
            };
        }

        // -- Lesson Video Upload --
        const btnUploadVideo = document.getElementById('btn-upload-video');
        if (btnUploadVideo) {
            btnUploadVideo.onclick = () => {
                mediaService.openUploadWidget({
                    resourceType: 'video',
                    clientAllowedFormats: ["mp4", "mov", "avi"],
                    maxFileSize: 100000000, // 100MB
                    multiple: false,
                    folder: 'lesson_videos'
                }, (info) => {
                    this.lessonVideoUrl = info.secure_url;
                    const icon = document.getElementById('video-preview-icon');
                    const status = document.getElementById('video-status');
                    if (icon) icon.style.display = 'block';
                    if (status) status.textContent = info.original_filename || 'Video uploaded';
                    showToast('Video uploaded successfully!', 'success');
                });
            };
        }

        // -- Form Submits --
        const btnSaveCourse = document.getElementById('btn-save-course');
        if (btnSaveCourse) {
            btnSaveCourse.onclick = async () => {
                const form = document.getElementById('course-builder-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }

                btnSaveCourse.disabled = true;
                btnSaveCourse.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const courseData = {
                    id: document.getElementById('course-id').value.trim(),
                    title: document.getElementById('course-title').value.trim(),
                    icon: document.getElementById('course-icon').value.trim(),
                    thumbnail: this.courseThumbnail || '', // Cloudinary URL
                    difficulty: document.getElementById('course-difficulty').value,
                    description: document.getElementById('course-desc').value.trim(),
                    totalLessons: parseInt(document.getElementById('course-total-lessons').value, 10),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicCourse(courseData);
                if (success) {
                    showToast('Course successfully published to the cloud!', 'success');
                    form.reset();
                    // Reset internal state and preview
                    this.courseThumbnail = '';
                    const preview = document.getElementById('thumbnail-preview');
                    const status = document.getElementById('thumbnail-status');
                    if (preview) preview.innerHTML = '<i class="fa-solid fa-photo-film text-muted"></i>';
                    if (status) status.textContent = 'No file uploaded';

                    // Update dropdown
                    if (optionsContainer) {
                        const newOptionHTML = `
                            <div class="custom-select-option" data-value="${courseData.id}" data-search="${courseData.title.toLowerCase()}" style="padding:var(--space-2) var(--space-4); cursor:pointer; display:flex; align-items:center; gap:var(--space-3); transition:background 0.2s; font-size:var(--text-sm);">
                                <div class="avatar-sm" style="width:24px; height:24px; border-radius:4px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color:white; font-size:10px;"><i class="${courseData.icon}"></i></div>
                                <span style="color:var(--text-primary); font-weight:500;">${courseData.title}</span>
                            </div>
                        `;
                        optionsContainer.insertAdjacentHTML('beforeend', newOptionHTML);
                    }
                } else {
                    showToast('Failed to publish course.', 'error');
                }
                btnSaveCourse.disabled = false;
                btnSaveCourse.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Course to Cloud';
            };
        }

        const btnSaveLesson = document.getElementById('btn-save-lesson');
        if (btnSaveLesson) {
            btnSaveLesson.onclick = async () => {
                const form = document.getElementById('lesson-builder-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }

                const courseIdVal = document.getElementById('lesson-course-id').value;
                if (!courseIdVal) { showToast('Please select a course first.', 'error'); return; }

                btnSaveLesson.disabled = true;
                btnSaveLesson.innerHTML = '<div class="spinner-sm"></div> Publishing...';

                const lessonData = {
                    id: document.getElementById('lesson-id').value.trim(),
                    courseId: courseIdVal,
                    title: document.getElementById('lesson-title').value.trim(),
                    type: document.getElementById('lesson-type').value,
                    youtubeId: document.getElementById('lesson-youtube').value.trim(),
                    videoUrl: this.lessonVideoUrl || '', // Cloudinary URL
                    duration: document.getElementById('lesson-duration').value.trim(),
                    order: parseInt(document.getElementById('lesson-order').value, 10),
                    content: document.getElementById('lesson-content').value.trim(),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicLesson(lessonData);
                if (success) {
                    showToast('Lesson successfully published to the cloud!', 'success');
                    form.reset();
                    // Reset internal state and UI
                    this.lessonVideoUrl = '';
                    const icon = document.getElementById('video-preview-icon');
                    const videoStatus = document.getElementById('video-status');
                    if (icon) icon.style.display = 'none';
                    if (videoStatus) videoStatus.textContent = 'No video';

                    valueDisplay.textContent = 'Select target course...';
                    valueDisplay.classList.add('text-muted');
                    hiddenInput.value = '';
                } else {
                    showToast('Failed to publish lesson.', 'error');
                }
                btnSaveLesson.disabled = false;
                btnSaveLesson.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson to Cloud';
            };
        }

        const btnRefreshCourses = document.getElementById('btn-refresh-courses');
        if (btnRefreshCourses) btnRefreshCourses.onclick = () => this._loadExistingCourses();
        const btnRefreshLessons = document.getElementById('btn-refresh-lessons');
        if (btnRefreshLessons) btnRefreshLessons.onclick = () => this._loadExistingLessons();

        const btnOpenMediaLibrary = document.getElementById('btn-open-media-library');
        if (btnOpenMediaLibrary) {
            btnOpenMediaLibrary.onclick = () => {
                this.currentTab = 'content';
                this._renderActiveTab();
            };
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

    /**
     * Filter course select options.
     * @param {string} query
     * @returns {void}
     */
    _filterOptions(query) {
        const optionsContainer = document.getElementById('lesson-course-options');
        if (!optionsContainer) return;
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            const searchData = opt.dataset.search || '';
            opt.style.display = searchData.includes(query) ? 'flex' : 'none';
        });
    }

    async _loadExistingCourses() {
        const lc = document.getElementById('courses-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
        const staticCourses = this.systemData.coursesData || [];
        const courses = await firestoreService.getDynamicCourses();

        if (staticCourses.length === 0 && courses.length === 0) {
            lc.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No courses found in the static catalog or cloud library.</div>';
            return;
        }

        const courseSections = [];

        if (staticCourses.length > 0) {
            courseSections.push(`
                <div style="display:flex; flex-direction:column; gap:var(--space-3);">
                    <div style="font-weight:700; color:var(--text-primary);">Static Course Catalog</div>
                    ${staticCourses.map(c => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                            <div><strong style="color:var(--text-primary);">${c.title}</strong> <span class="badge" style="background:rgba(0, 120, 212, 0.1); color:var(--brand-primary);">Static</span><span class="text-muted text-sm" style="margin-left:8px;">${c.id}</span></div>
                            <div style="display:flex; gap:var(--space-2);">
                                <button class="btn btn-ghost btn-sm btn-edit-course" data-source="static" data-json='${JSON.stringify(c).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `);
        }

        if (courses.length > 0) {
            courseSections.push(`
                <div style="display:flex; flex-direction:column; gap:var(--space-3);">
                    <div style="font-weight:700; color:var(--text-primary);">Published Course Library</div>
                    ${courses.map(c => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                            <div><strong style="color:var(--text-primary);">${c.title}</strong> <span class="badge" style="background:rgba(40, 180, 99, 0.1); color:var(--color-success);">Cloud</span><span class="text-muted text-sm" style="margin-left:8px;">${c.id}</span></div>
                            <div style="display:flex; gap:var(--space-2);">
                                <button class="btn btn-ghost btn-sm btn-edit-course" data-source="dynamic" data-json='${JSON.stringify(c).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-ghost btn-sm btn-delete-course" data-id="${c.id}" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `);
        }

        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-6);">${courseSections.join('')}</div>`;

        lc.querySelectorAll('.btn-delete-course').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this course permanently?')) return;
                await firestoreService.deleteDynamicCourse(btn.dataset.id);
                this._loadExistingCourses();
            };
        });

        lc.querySelectorAll('.btn-edit-course').forEach(btn => {
            btn.onclick = () => {
                const c = JSON.parse(btn.dataset.json);
                document.getElementById('course-id').value = c.id;
                document.getElementById('course-title').value = c.title || '';
                document.getElementById('course-icon').value = c.icon || 'fa-solid fa-code';
                document.getElementById('course-difficulty').value = c.difficulty || 'Beginner';
                document.getElementById('course-desc').value = c.description || '';
                document.getElementById('course-total-lessons').value = c.totalLessons || 10;
                this.courseThumbnail = c.thumbnail || '';
                if (c.thumbnail) {
                    const preview = document.getElementById('thumbnail-preview');
                    if (preview) preview.innerHTML = `<img src="${c.thumbnail}" style="width:100%; height:100%; object-fit:cover;">`;
                }
                document.getElementById('course-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        });
    }

    async _loadExistingLessons() {
        const lc = document.getElementById('lessons-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
        const lessons = await firestoreService.getDynamicLessons();
        if (lessons.length === 0) {
            lc.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No dynamic lessons found.</div>';
            return;
        }
        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-3);">${lessons.map(l => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div style="display:flex; flex-direction:column;">
                    <strong style="color:var(--text-primary);">${l.title}</strong>
                    <span class="text-muted text-sm">Course: ${l.courseId} &bull; ${l.id}</span>
                </div>
                <div style="display:flex; gap:var(--space-2); align-items:center;">
                    <button class="btn btn-ghost btn-sm btn-edit-lesson" data-json='${JSON.stringify(l).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete-lesson" data-id="${l.id}" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')}</div>`;

        lc.querySelectorAll('.btn-delete-lesson').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this lesson permanently?')) return;
                await firestoreService.deleteDynamicLesson(btn.dataset.id);
                this._loadExistingLessons();
            };
        });

        lc.querySelectorAll('.btn-edit-lesson').forEach(btn => {
            btn.onclick = () => {
                const l = JSON.parse(btn.dataset.json);
                document.getElementById('lesson-id').value = l.id;
                document.getElementById('lesson-course-id').value = l.courseId;
                document.getElementById('lesson-title').value = l.title || '';
                document.getElementById('lesson-type').value = l.type || 'theory';
                document.getElementById('lesson-youtube').value = l.youtubeId || '';
                document.getElementById('lesson-duration').value = l.duration || '10 min';
                document.getElementById('lesson-order').value = l.order || 1;
                document.getElementById('lesson-content').value = l.content || '';
                
                const display = document.getElementById('lesson-course-display');
                if (display && l.courseId) {
                    const valueDisplay = display.querySelector('.custom-select-value');
                    valueDisplay.textContent = l.courseId;
                    valueDisplay.classList.remove('text-muted');
                    valueDisplay.style.color = 'var(--text-primary)';
                }
                
                this.lessonVideoUrl = l.videoUrl || '';
                const ev = new Event('input', { bubbles: true });
                document.getElementById('lesson-content').dispatchEvent(ev);
                document.getElementById('lesson-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        });
    }

    // ── Challenge Builder Tab ──

    _renderChallengesTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(231, 76, 60, 0.1); color:var(--color-error); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-code"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Create Coding Challenge</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Build interactive coding exercises for students.</p>
                        </div>
                    </div>
                    <form id="challenge-builder-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Challenge ID (unique-slug)</label>
                                <input type="text" id="challenge-id" class="input" placeholder="e.g. css-flexbox-layout" required>
                            </div>
                            <div class="input-group">
                                <label>Challenge Title</label>
                                <input type="text" id="challenge-title" class="input" placeholder="e.g. Build a Flexbox Layout" required>
                            </div>
                            <div class="input-group">
                                <label>Difficulty</label>
                                <select id="challenge-difficulty" class="input">
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Language</label>
                                <select id="challenge-language" class="input">
                                    <option value="html">HTML / CSS / JS</option>
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript (Node)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Challenge Type</label>
                                <select id="challenge-type" class="input">
                                    <option value="frontend">Frontend (DOM/Regex Validation)</option>
                                    <option value="backend">Backend (Assertions/Test Code)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Attached Course ID (optional)</label>
                                <input type="text" id="challenge-course-id" class="input" placeholder="e.g. html-fundamentals">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Instructions (Markdown)</label>
                            <textarea id="challenge-instructions" class="input textarea" rows="4" placeholder="Describe what the student needs to build..." required></textarea>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Starter Code</label>
                            <textarea id="challenge-starter-code" class="input textarea" rows="6" style="font-family:monospace; font-size:0.9rem;" placeholder="<!-- Write starter code here -->" required></textarea>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Validation / Test Code</label>
                            <p class="text-muted" style="font-size:0.85rem; margin-bottom:var(--space-2);">
                                For <strong>Frontend</strong>: Enter JSON validation rules array. For <strong>Backend</strong>: Enter assertion test code.
                            </p>
                            <textarea id="challenge-test-code" class="input textarea" rows="6" style="font-family:monospace; font-size:0.9rem;" placeholder='[{"type":"dom-query","selector":"h1","errorMessage":"Missing h1"}]' required></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-challenge" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Challenge</button>
                        </div>
                    </form>
                </div>
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list-check"></i> Manage Existing Challenges</h3>
                            <p class="text-muted" style="font-size:0.9rem; margin-top:4px;">Cloud-published challenges from Firestore.</p>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-challenges"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="challenges-list-container">
                        <div style="text-align:center; padding:var(--space-8); color:var(--text-muted);">
                            <div class="spinner-sm" style="margin:0 auto var(--space-4);"></div>
                            Loading challenges...
                        </div>
                    </div>
                </div>
            </div>
        `;
        this._initChallengeBuilderLogic();
        this._loadExistingChallenges();
    }

    _initChallengeBuilderLogic() {
        const btnSave = document.getElementById('btn-save-challenge');
        if (!btnSave) return;
        btnSave.onclick = async () => {
            const form = document.getElementById('challenge-builder-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }
            btnSave.disabled = true;
            btnSave.innerHTML = '<div class="spinner-sm"></div> Publishing...';
            const challengeType = document.getElementById('challenge-type').value;
            const testCodeRaw = document.getElementById('challenge-test-code').value.trim();
            let validationRules = null;
            let testCode = null;
            if (challengeType === 'frontend') {
                try { validationRules = JSON.parse(testCodeRaw); }
                catch (e) {
                    showToast('Invalid JSON in validation rules. Please check syntax.', 'error');
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Challenge';
                    return;
                }
            } else { testCode = testCodeRaw; }
            const challengeData = {
                id: document.getElementById('challenge-id').value.trim(),
                title: document.getElementById('challenge-title').value.trim(),
                difficulty: document.getElementById('challenge-difficulty').value,
                language: document.getElementById('challenge-language').value,
                type: challengeType,
                courseId: document.getElementById('challenge-course-id').value.trim() || null,
                instructions: document.getElementById('challenge-instructions').value.trim(),
                starterCode: document.getElementById('challenge-starter-code').value,
                validationRules, testCode, isDynamic: true
            };
            const success = await firestoreService.saveDynamicChallenge(challengeData);
            if (success) { showToast('Challenge published to the cloud!', 'success'); form.reset(); this._loadExistingChallenges(); }
            else { showToast('Failed to publish challenge.', 'error'); }
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Challenge';
        };
        const btnRefresh = document.getElementById('btn-refresh-challenges');
        if (btnRefresh) btnRefresh.onclick = () => this._loadExistingChallenges();
    }

    async _loadExistingChallenges() {
        const lc = document.getElementById('challenges-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-6); color:var(--text-muted);"><div class="spinner-sm" style="margin:0 auto var(--space-4);"></div> Loading...</div>';
        const challenges = await firestoreService.getDynamicChallenges();
        if (challenges.length === 0) {
            lc.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:2.5rem; margin-bottom:var(--space-4); display:block;"></i>No dynamic challenges published yet.</div>';
            return;
        }
        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-3);">${challenges.map(ch => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div style="display:flex; align-items:center; gap:var(--space-3);">
                    <div style="width:36px; height:36px; border-radius:8px; background:rgba(231,76,60,0.1); display:flex; align-items:center; justify-content:center; color:var(--color-error);"><i class="fa-solid fa-code"></i></div>
                    <div><div style="font-weight:600;">${ch.title || ch.id}</div><div class="text-muted" style="font-size:0.8rem;">${ch.language || 'html'} &bull; ${ch.difficulty || 'Medium'} &bull; ${ch.type || 'frontend'}</div></div>
                </div>
                <div style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-ghost btn-sm btn-edit-challenge" data-json='${JSON.stringify(ch).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete-challenge" data-id="${ch.id}" title="Delete" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')}</div>`;
        lc.querySelectorAll('.btn-delete-challenge').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this challenge permanently?')) return;
                btn.disabled = true;
                const ok = await firestoreService.deleteDynamicChallenge(btn.dataset.id);
                if (ok) { showToast('Challenge deleted.', 'success'); this._loadExistingChallenges(); }
                else { showToast('Failed to delete.', 'error'); btn.disabled = false; }
            };
        });
        lc.querySelectorAll('.btn-edit-challenge').forEach(btn => {
            btn.onclick = () => {
                const c = JSON.parse(btn.dataset.json);
                document.getElementById('challenge-id').value = c.id;
                document.getElementById('challenge-title').value = c.title || '';
                document.getElementById('challenge-difficulty').value = c.difficulty || 'Easy';
                document.getElementById('challenge-language').value = c.language || 'html';
                document.getElementById('challenge-type').value = c.type || 'frontend';
                document.getElementById('challenge-course-id').value = c.courseId || '';
                document.getElementById('challenge-instructions').value = c.instructions || '';
                document.getElementById('challenge-starter-code').value = c.starterCode || '';
                const testCodeVal = c.type === 'frontend' ? (c.validationRules ? JSON.stringify(c.validationRules) : '') : (c.testCode || '');
                document.getElementById('challenge-test-code').value = testCodeVal;
                document.getElementById('challenge-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        });
    }

    /**
     * Render gamification tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderGamificationTab(container) {
        container.innerHTML = `
            <div class="card" style="padding:var(--space-6); max-width:800px; margin:0 auto;">
                <div style="margin-bottom:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-2);"><i class="fa-solid fa-sliders"></i> Gamification Tuner</h3>
                    <p class="text-muted">Adjust the global multipliers and thresholds for the platform. Changes will apply immediately to all users upon their next action.</p>
                </div>
                
                <div class="grid grid-2" style="gap:var(--space-6); margin-bottom:var(--space-8); padding-bottom:var(--space-8); border-bottom:1px solid var(--border-subtle);">
                    <div>
                        <h4 style="margin-bottom:var(--space-4); color:var(--brand-primary);"><i class="fa-solid fa-star"></i> XP Awards</h4>
                        <div class="input-group" style="margin-bottom:var(--space-4);">
                            <label>Theory Lesson Completion (Base XP)</label>
                            <input type="number" class="input" value="10">
                        </div>
                        <div class="input-group" style="margin-bottom:var(--space-4);">
                            <label>Practice Lesson Completion (Base XP)</label>
                            <input type="number" class="input" value="15">
                        </div>
                        <div class="input-group">
                            <label>Perfect Quiz Multiplier (e.g. 1.5x)</label>
                            <input type="number" class="input" value="1.5" step="0.1">
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="margin-bottom:var(--space-4); color:var(--color-success);"><i class="fa-solid fa-gem"></i> Gems Economy</h4>
                        <div class="input-group" style="margin-bottom:var(--space-4);">
                            <label>Code Challenge Passed (Base Gems)</label>
                            <input type="number" class="input" value="25">
                        </div>
                        <div class="input-group" style="margin-bottom:var(--space-4);">
                            <label>Code Challenge Perfect Eval Bonus</label>
                            <input type="number" class="input" value="50">
                        </div>
                        <div class="input-group">
                            <label>Daily Streak Bonus (Gems)</label>
                            <input type="number" class="input" value="10">
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom:var(--space-4);"><i class="fa-solid fa-ranking-star"></i> Rank Thresholds</h4>
                    <p class="text-muted" style="margin-bottom:var(--space-4); font-size:0.9rem;">Define the minimum XP required for users to achieve these global ranks.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:var(--space-3);">
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#7f8c8d;">Novice</div>
                            <input type="number" class="input" value="0" disabled style="width:100px;">
                            <span class="text-muted text-sm">Default starting rank</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#2ecc71;">Apprentice</div>
                            <input type="number" class="input" value="100" style="width:100px;">
                        </div>
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#3498db;">Coder</div>
                            <input type="number" class="input" value="500" style="width:100px;">
                        </div>
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#9b59b6;">Developer</div>
                            <input type="number" class="input" value="1500" style="width:100px;">
                        </div>
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#e67e22;">Expert</div>
                            <input type="number" class="input" value="3000" style="width:100px;">
                        </div>
                        <div style="display:flex; align-items:center; gap:var(--space-4);">
                            <div style="width:120px; font-weight:bold; color:#e74c3c;">Master</div>
                            <input type="number" class="input" value="5000" style="width:100px;">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top:var(--space-8); padding-top:var(--space-6); border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary" onclick="showToast('Gamification configurations updated successfully', 'success')"><i class="fa-solid fa-save"></i> Save Global Settings</button>
                </div>
            </div>
        `;
    }

    /**
     * Render submissions tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderSubmissionsTab(container) {
        container.innerHTML = `
            <div class="card" style="padding:var(--space-6);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <div>
                        <h3 style="margin:0;"><i class="fa-solid fa-inbox"></i> Task & Project Inbox</h3>
                        <p class="text-muted" style="margin-top:4px;">Review student Github repositories or manual project submissions.</p>
                    </div>
                    <div style="display:flex; gap:var(--space-2);">
                        <button class="btn btn-outline active">Pending (3)</button>
                        <button class="btn btn-outline">Graded</button>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:var(--space-4);">
                    
                    <!-- Submission UI Item 1 -->
                    <div style="border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:var(--space-5); background:var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:var(--space-4); align-items:center;">
                            <div style="width:48px; height:48px; border-radius:50%; background:var(--brand-primary); display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem;">
                                AL
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; gap:var(--space-2);">
                                    <h4 style="margin:0;">Alex Lee</h4>
                                    <span class="badge" style="background:rgba(231, 76, 60, 0.1); color:var(--color-error);">Needs Review</span>
                                </div>
                                <div class="text-muted" style="font-size:0.85rem; margin-top:4px;">Submitted project: <strong>React Portfolio Clone</strong> • 15 mins ago</div>
                                <div style="margin-top:var(--space-2);">
                                    <a href="#" style="color:var(--brand-primary); font-size:0.85rem;"><i class="fa-brands fa-github"></i> github.com/alexlee/portfolio-clone</a>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:var(--space-3);">
                            <button class="btn btn-outline text-error"><i class="fa-solid fa-xmark"></i> Reject</button>
                            <button class="btn btn-primary"><i class="fa-solid fa-check"></i> Approve & Award XP</button>
                        </div>
                    </div>
                    
                    <!-- Submission UI Item 2 -->
                    <div style="border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:var(--space-5); background:var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:var(--space-4); align-items:center;">
                            <div style="width:48px; height:48px; border-radius:50%; background:var(--color-success); display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem;">
                                SJ
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; gap:var(--space-2);">
                                    <h4 style="margin:0;">Samantha Jones</h4>
                                    <span class="badge" style="background:rgba(231, 76, 60, 0.1); color:var(--color-error);">Needs Review</span>
                                </div>
                                <div class="text-muted" style="font-size:0.85rem; margin-top:4px;">Submitted project: <strong>Node CLI App</strong> • 2 hours ago</div>
                                <div style="margin-top:var(--space-2);">
                                    <a href="#" style="color:var(--brand-primary); font-size:0.85rem;"><i class="fa-solid fa-link"></i> repl.it/@sjones/node-cli</a>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:var(--space-3);">
                            <button class="btn btn-outline text-error"><i class="fa-solid fa-xmark"></i> Reject</button>
                            <button class="btn btn-primary"><i class="fa-solid fa-check"></i> Approve & Award XP</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    /**
     * Render access denied state.
     * @param {string} [reason='You must be an authenticated Administrator to access this control panel.']
     * @returns {void}
     */
    _renderAccessDenied(reason = 'You must be an authenticated Administrator to access this control panel.') {
        this.containerContainer.innerHTML = `
            <div class="container" style="padding:var(--space-16); min-height:80vh; display:flex; align-items:center; justify-content:center;">
                <div class="card text-center animate-scaleIn" style="max-width:400px; padding:var(--space-10);">
                    <i class="fa-solid fa-shield-halved text-muted" style="font-size:4rem; margin-bottom:var(--space-6);"></i>
                    <h2 style="margin-bottom:var(--space-2);">Restricted Access</h2>
                    <p class="text-muted" style="margin-bottom:var(--space-6);">${reason}</p>
                    <a href="#/" class="btn btn-primary">Return Home</a>
                </div>
            </div>`;
    }

    // ── Docs Manager ──
    _renderDocsTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(0, 120, 212, 0.1); color:var(--brand-primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-file-code"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Create / Edit Documentation</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Write articles, tutorials, or api guides.</p>
                        </div>
                    </div>
                    <form id="doc-builder-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Doc ID (unique-slug)</label>
                                <input type="text" id="doc-id" class="input" placeholder="e.g. intro-to-react" required>
                            </div>
                            <div class="input-group">
                                <label>Doc Title</label>
                                <input type="text" id="doc-title" class="input" placeholder="e.g. Introduction to React" required>
                            </div>
                            <div class="input-group">
                                <label>Category</label>
                                <input type="text" id="doc-category" class="input" placeholder="e.g. Guides" required>
                            </div>
                            <div class="input-group">
                                <label>Order #</label>
                                <input type="number" id="doc-order" class="input" value="1">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Content (Markdown)</label>
                            <textarea id="doc-content" class="input textarea" rows="10" placeholder="# Overview..." required></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-doc" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Doc</button>
                        </div>
                    </form>
                </div>
                
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list"></i> Manage Docs</h3>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-docs"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="docs-list-container">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>
            </div>`;
            
        this._initDocBuilderLogic();
    }

    _initDocBuilderLogic() {
        const btnSave = document.getElementById('btn-save-doc');
        if (btnSave) {
            btnSave.onclick = async () => {
                const form = document.getElementById('doc-builder-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }
                btnSave.disabled = true;
                const docData = {
                    id: document.getElementById('doc-id').value.trim(),
                    title: document.getElementById('doc-title').value.trim(),
                    category: document.getElementById('doc-category').value.trim(),
                    order: parseInt(document.getElementById('doc-order').value, 10),
                    content: document.getElementById('doc-content').value
                };
                const ok = await firestoreService.saveDynamicDoc(docData);
                if (ok) {
                    showToast('Doc saved!', 'success');
                    form.reset();
                    this._loadExistingDocs();
                } else {
                    showToast('Failed to save doc.', 'error');
                }
                btnSave.disabled = false;
            };
        }
        const refreshBtn = document.getElementById('btn-refresh-docs');
        if (refreshBtn) refreshBtn.onclick = () => this._loadExistingDocs();
        setTimeout(() => this._loadExistingDocs(), 100);
    }

    async _loadExistingDocs() {
        const lc = document.getElementById('docs-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
        const docs = await firestoreService.getDynamicDocs();
        if (docs.length === 0) {
            lc.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No docs found.</div>';
            return;
        }
        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-3);">${docs.map(d => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div><strong style="color:var(--text-primary);">${d.title}</strong></div>
                <div style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-ghost btn-sm btn-edit-doc" data-json='${JSON.stringify(d).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete-doc" data-id="${d.id}" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')}</div>`;

        lc.querySelectorAll('.btn-delete-doc').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this doc?')) return;
                await firestoreService.deleteDynamicDoc(btn.dataset.id);
                this._loadExistingDocs();
            };
        });
        lc.querySelectorAll('.btn-edit-doc').forEach(btn => {
            btn.onclick = () => {
                const d = JSON.parse(btn.dataset.json);
                document.getElementById('doc-id').value = d.id;
                document.getElementById('doc-title').value = d.title;
                document.getElementById('doc-category').value = d.category || '';
                document.getElementById('doc-order').value = d.order || 1;
                document.getElementById('doc-content').value = d.content || '';
                document.getElementById('doc-id').scrollIntoView();
            };
        });
    }

    // ── Tasks Manager ──
    _renderTasksTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(46, 204, 113, 0.1); color:var(--color-success); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Create / Edit Tasks</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Assign standalone projects or tasks.</p>
                        </div>
                    </div>
                    <form id="task-builder-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Task ID (unique-slug)</label>
                                <input type="text" id="task-id" class="input" placeholder="e.g. portfolio-cli" required>
                            </div>
                            <div class="input-group">
                                <label>Task Title</label>
                                <input type="text" id="task-title" class="input" placeholder="e.g. Build a Portfolio CLI" required>
                            </div>
                            <div class="input-group">
                                <label>Difficulty</label>
                                <select id="task-difficulty" class="input">
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Reward (XP / Gems)</label>
                                <input type="number" id="task-reward" class="input" value="100">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Description & Requirements (Markdown)</label>
                            <textarea id="task-content" class="input textarea" rows="6" placeholder="Objective..." required></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-task" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Task</button>
                        </div>
                    </form>
                </div>
                
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list"></i> Manage Tasks</h3>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-tasks"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="tasks-list-container">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>
            </div>`;
            
        this._initTaskBuilderLogic();
    }

    _initTaskBuilderLogic() {
        const btnSave = document.getElementById('btn-save-task');
        if (btnSave) {
            btnSave.onclick = async () => {
                const form = document.getElementById('task-builder-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }
                btnSave.disabled = true;
                const taskData = {
                    id: document.getElementById('task-id').value.trim(),
                    title: document.getElementById('task-title').value.trim(),
                    difficulty: document.getElementById('task-difficulty').value,
                    reward: parseInt(document.getElementById('task-reward').value, 10),
                    content: document.getElementById('task-content').value
                };
                const ok = await firestoreService.saveDynamicTask(taskData);
                if (ok) {
                    showToast('Task saved!', 'success');
                    form.reset();
                    this._loadExistingTasks();
                } else {
                    showToast('Failed to save task.', 'error');
                }
                btnSave.disabled = false;
            };
        }
        const refreshBtn = document.getElementById('btn-refresh-tasks');
        if (refreshBtn) refreshBtn.onclick = () => this._loadExistingTasks();
        setTimeout(() => this._loadExistingTasks(), 100);
    }

    async _loadExistingTasks() {
        const lc = document.getElementById('tasks-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
        const tasks = await firestoreService.getDynamicTasks();
        if (tasks.length === 0) {
            lc.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No tasks found.</div>';
            return;
        }
        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-3);">${tasks.map(t => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div><strong style="color:var(--text-primary);">${t.title}</strong></div>
                <div style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-ghost btn-sm btn-edit-task" data-json='${JSON.stringify(t).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete-task" data-id="${t.id}" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')}</div>`;

        lc.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this task?')) return;
                await firestoreService.deleteDynamicTask(btn.dataset.id);
                this._loadExistingTasks();
            };
        });
        lc.querySelectorAll('.btn-edit-task').forEach(btn => {
            btn.onclick = () => {
                const t = JSON.parse(btn.dataset.json);
                document.getElementById('task-id').value = t.id;
                document.getElementById('task-title').value = t.title;
                document.getElementById('task-difficulty').value = t.difficulty || 'Beginner';
                document.getElementById('task-reward').value = t.reward || 100;
                document.getElementById('task-content').value = t.content || '';
                document.getElementById('task-id').scrollIntoView();
            };
        });
    }

    // ── Portfolios Manager ──
    _renderPortfoliosTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(0, 206, 201, 0.1); color:#00cec9; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-briefcase"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Create / Edit Portfolio Projects</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Add tutorial projects to the portfolio showcase.</p>
                        </div>
                    </div>
                    <form id="portfolio-builder-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Project ID (unique-slug)</label>
                                <input type="text" id="portfolio-id" class="input" placeholder="e.g. build-a-calculator" required>
                            </div>
                            <div class="input-group">
                                <label>Project Title</label>
                                <input type="text" id="portfolio-title" class="input" placeholder="e.g. Build a Web Calculator" required>
                            </div>
                            <div class="input-group">
                                <label>Difficulty</label>
                                <select id="portfolio-difficulty" class="input">
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Estimated Time (e.g. 2h)</label>
                                <input type="text" id="portfolio-time" class="input" value="2h">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Description (Short)</label>
                            <textarea id="portfolio-desc" class="input textarea" rows="2" placeholder="Brief summary for the card..." required></textarea>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Tutorial Content (Markdown)</label>
                            <textarea id="portfolio-content" class="input textarea" rows="10" placeholder="# Step 1..." required></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-portfolio" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Project</button>
                        </div>
                    </form>
                </div>
                
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <div>
                            <h3 style="margin:0;"><i class="fa-solid fa-list"></i> Manage Projects</h3>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-refresh-portfolios"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="portfolios-list-container">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>
            </div>`;
            
        this._initPortfolioBuilderLogic();
    }

    _initPortfolioBuilderLogic() {
        const btnSave = document.getElementById('btn-save-portfolio');
        if (btnSave) {
            btnSave.onclick = async () => {
                const form = document.getElementById('portfolio-builder-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }
                btnSave.disabled = true;
                const portfolioData = {
                    id: document.getElementById('portfolio-id').value.trim(),
                    title: document.getElementById('portfolio-title').value.trim(),
                    difficulty: document.getElementById('portfolio-difficulty').value,
                    estimatedTime: document.getElementById('portfolio-time').value.trim(),
                    description: document.getElementById('portfolio-desc').value.trim(),
                    content: document.getElementById('portfolio-content').value
                };
                const ok = await firestoreService.saveDynamicPortfolio(portfolioData);
                if (ok) {
                    showToast('Project saved!', 'success');
                    form.reset();
                    this._loadExistingPortfolios();
                } else {
                    showToast('Failed to save project.', 'error');
                }
                btnSave.disabled = false;
            };
        }
        const refreshBtn = document.getElementById('btn-refresh-portfolios');
        if (refreshBtn) refreshBtn.onclick = () => this._loadExistingPortfolios();
        setTimeout(() => this._loadExistingPortfolios(), 100);
    }

    async _loadExistingPortfolios() {
        const lc = document.getElementById('portfolios-list-container');
        if (!lc) return;
        lc.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
        const portfolios = await firestoreService.getDynamicPortfolios();
        if (portfolios.length === 0) {
            lc.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No projects found.</div>';
            return;
        }
        lc.innerHTML = `<div style="display:flex; flex-direction:column; gap:var(--space-3);">${portfolios.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div><strong style="color:var(--text-primary);">${p.title}</strong></div>
                <div style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-ghost btn-sm btn-edit-portfolio" data-json='${JSON.stringify(p).replace(/'/g, "&#39;")}'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete-portfolio" data-id="${p.id}" style="color:var(--color-error);"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')}</div>`;

        lc.querySelectorAll('.btn-delete-portfolio').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this project?')) return;
                await firestoreService.deleteDynamicPortfolio(btn.dataset.id);
                this._loadExistingPortfolios();
            };
        });
        lc.querySelectorAll('.btn-edit-portfolio').forEach(btn => {
            btn.onclick = () => {
                const p = JSON.parse(btn.dataset.json);
                document.getElementById('portfolio-id').value = p.id;
                document.getElementById('portfolio-title').value = p.title;
                document.getElementById('portfolio-difficulty').value = p.difficulty || 'Beginner';
                document.getElementById('portfolio-time').value = p.estimatedTime || '2h';
                document.getElementById('portfolio-desc').value = p.description || '';
                document.getElementById('portfolio-content').value = p.content || '';
                document.getElementById('portfolio-id').scrollIntoView();
            };
        });
    }

    // ================== NEW: ANALYTICS & REVENUE TAB ==================

    /**
     * Render analytics and revenue tracking tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderAnalyticsTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                
                <!-- Key Metrics -->
                <div class="grid grid-4" style="gap:var(--space-4); margin-bottom:var(--space-4);">
                    <div class="admin-stats-card">
                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-dollar-sign"></i> Total Revenue</div>
                        <div class="admin-stats-value" id="stat-revenue">$0.00</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">All time</div>
                    </div>
                    
                    <div class="admin-stats-card">
                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-users"></i> Total Subscriptions</div>
                        <div class="admin-stats-value" id="stat-subscriptions">0</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Active users</div>
                    </div>
                    
                    <div class="admin-stats-card">
                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-chart-line"></i> Platform Growth</div>
                        <div class="admin-stats-value" id="stat-growth">+0%</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">This month</div>
                    </div>
                    
                    <div class="admin-stats-card">
                        <div class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-book-open"></i> Enrollments</div>
                        <div class="admin-stats-value" id="stat-enrollments">0</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Total course enrollments</div>
                    </div>
                </div>

                <!-- Analytics Dashboard -->
                <div class="card" style="padding:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-chart-bar"></i> Revenue & Analytics</h3>
                    
                    <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-6); flex-wrap: wrap;">
                        <button class="btn btn-outline stats-period-btn" data-period="month">This Month</button>
                        <button class="btn btn-outline stats-period-btn" data-period="quarter">This Quarter</button>
                        <button class="btn btn-outline stats-period-btn" data-period="year">This Year</button>
                        <button class="btn btn-outline stats-period-btn" data-period="all">All Time</button>
                    </div>

                    <div id="analytics-container" style="min-height:300px;">
                        <div style="text-align:center; padding:var(--space-8);"><div class="spinner-sm"></div> Loading analytics...</div>
                    </div>
                </div>

                <!-- Revenue Transactions -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <h3 style="margin:0;"><i class="fa-solid fa-receipt"></i> Recent Transactions</h3>
                        <input type="text" class="input" id="filter-transactions" placeholder="Search transactions..." style="width:250px;">
                    </div>
                    <div id="transactions-list" style="display:flex; flex-direction:column; gap:var(--space-3);">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>
            </div>
        `;
        
        this._initAnalyticsLogic();
    }

    async _initAnalyticsLogic() {
        // Load analytics data
        const analytics = await adminManagementService.computeRealTimeAnalytics();
        
        document.getElementById('stat-revenue').textContent = `$${analytics.totalRevenue.toFixed(2)}`;
        document.getElementById('stat-subscriptions').textContent = analytics.totalUsers;
        document.getElementById('stat-growth').textContent = `+${analytics.platformGrowth.newUsersThisMonth}`;
        document.getElementById('stat-enrollments').textContent = analytics.totalEnrollments;

        // Add period filter listeners
        document.querySelectorAll('.stats-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stats-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._renderAnalyticsChart(btn.dataset.period);
            });
        });

        // Load default month view
        this._renderAnalyticsChart('month');
    }

    _renderAnalyticsChart(period) {
        const container = document.getElementById('analytics-container');
        container.innerHTML = `
            <div style="background:var(--bg-tertiary); border-radius:var(--radius-lg); padding:var(--space-6);">
                <p style="color:var(--text-muted); text-align:center;">Analytics visualization for <strong>${period}</strong></p>
                <div style="height:250px; background:var(--bg-secondary); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                    <i class="fa-solid fa-chart-line" style="font-size:3rem; opacity:0.3;"></i>
                </div>
                <p style="color:var(--text-muted); text-align:center; margin-top:var(--space-4); font-size:0.9rem;">Chart ready for integration with analytics library (e.g., Chart.js, Recharts)</p>
            </div>
        `;
    }

    // ================== NEW: CONTENT MODERATION TAB ==================

    /**
     * Render content moderation tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderModerationTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                
                <!-- Course Approval Queue -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <h3 style="margin:0;"><i class="fa-solid fa-hourglass-end"></i> Pending Course Approvals</h3>
                        <button class="btn btn-outline btn-sm" id="refresh-pending-courses"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="pending-courses-list">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>

                <!-- Content Flags Queue -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <h3 style="margin:0;"><i class="fa-solid fa-flag"></i> Flagged Content for Review</h3>
                        <button class="btn btn-outline btn-sm" id="refresh-flagged-content"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    </div>
                    <div id="flagged-content-list">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>

                <!-- Manual Flag -->
                <div class="card" style="padding:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-plus"></i> Flag Content Manually</h3>
                    <form id="flag-content-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Course ID</label>
                                <input type="text" id="flag-course-id" class="input" placeholder="course_123" required>
                            </div>
                            <div class="input-group">
                                <label>Review/Comment ID</label>
                                <input type="text" id="flag-review-id" class="input" placeholder="review_456" required>
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Reason for Flagging</label>
                            <textarea id="flag-reason" class="input textarea" rows="3" placeholder="Describe why this content needs review..." required></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-flag"></i> Flag for Review</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this._initModerationLogic();
    }

    async _initModerationLogic() {
        const loadPendingCourses = async () => {
            const list = document.getElementById('pending-courses-list');
            list.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
            
            const courses = await adminManagementService.getPendingCourses();
            if (courses.length === 0) {
                list.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No pending courses.</div>';
                return;
            }
            
            list.innerHTML = courses.map(course => {
                const sanitizedTitle = (course.title || 'Untitled Course').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const sanitizedDesc = (course.description || 'No description').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const sanitizedInstructor = course.instructorId.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                <div style="padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border-left:3px solid var(--color-warning); margin-bottom:var(--space-3);">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div style="flex:1;">
                            <h4 style="margin:0 0 var(--space-2) 0; color:var(--text-primary);">${sanitizedTitle}</h4>
                            <p style="margin:0; color:var(--text-muted); font-size:0.9rem;">${sanitizedDesc}</p>
                            <p style="margin:var(--space-2) 0 0 0; font-size:0.85rem; color:var(--text-muted);">Instructor: ${sanitizedInstructor}</p>
                        </div>
                        <div style="display:flex; gap:var(--space-2);">
                            <button class="btn btn-success btn-sm approve-course" data-id="${course.id}"><i class="fa-solid fa-thumbs-up"></i> Approve</button>
                            <button class="btn btn-danger btn-sm reject-course" data-id="${course.id}"><i class="fa-solid fa-thumbs-down"></i> Reject</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Attach event listeners
            list.querySelectorAll('.approve-course').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (await adminManagementService.approveCourse(btn.dataset.id)) {
                        loadPendingCourses();
                    }
                });
            });

            list.querySelectorAll('.reject-course').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason && await adminManagementService.rejectCourse(btn.dataset.id, reason)) {
                        loadPendingCourses();
                    }
                });
            });
        };

        const loadFlaggedContent = async () => {
            const list = document.getElementById('flagged-content-list');
            list.innerHTML = '<div style="text-align:center; padding:var(--space-4);"><div class="spinner-sm"></div></div>';
            
            const queue = await adminManagementService.getModerationQueue();
            if (queue.length === 0) {
                list.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No flagged content.</div>';
                return;
            }

            list.innerHTML = queue.map(flag => {
                const sanitizedReason = (flag.reason || 'No reason provided').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                <div style="padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border-left:3px solid var(--color-error); margin-bottom:var(--space-3);">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div style="flex:1;">
                            <p style="margin:0; color:var(--text-primary); font-weight:600;">Flagged Item</p>
                            <p style="margin:var(--space-2) 0 0 0; color:var(--text-muted); font-size:0.9rem;"><strong>Reason:</strong> ${sanitizedReason}</p>
                        </div>
                        <div style="display:flex; gap:var(--space-2);">
                            <button class="btn btn-success btn-sm approve-flag" data-id="${flag.id}"><i class="fa-solid fa-check"></i> Approve</button>
                            <button class="btn btn-danger btn-sm remove-content" data-flag-id="${flag.id}" data-course-id="${flag.courseId}" data-review-id="${flag.reviewId}"><i class="fa-solid fa-trash"></i> Remove</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Attach event listeners
            list.querySelectorAll('.approve-flag').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (await adminManagementService.approveModerationFlag(btn.dataset.id)) {
                        loadFlaggedContent();
                    }
                });
            });

            list.querySelectorAll('.remove-content').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Remove this content permanently?')) {
                        if (await adminManagementService.removeFlaggedContent(btn.dataset.flagId, btn.dataset.courseId, btn.dataset.reviewId)) {
                            loadFlaggedContent();
                        }
                    }
                });
            });
        };

        // Initial loads
        loadPendingCourses();
        loadFlaggedContent();

        // Refresh buttons
        document.getElementById('refresh-pending-courses').addEventListener('click', loadPendingCourses);
        document.getElementById('refresh-flagged-content').addEventListener('click', loadFlaggedContent);

        // Flag form
        document.getElementById('flag-content-form').addEventListener('submit', async (e) => {
            const courseId = document.getElementById('flag-course-id').value;
            const reviewId = document.getElementById('flag-review-id').value;
            const reason = document.getElementById('flag-reason').value;
            
            if (await adminManagementService.flagForModeration(courseId, reviewId, reason)) {
                document.getElementById('flag-content-form').reset();
                loadFlaggedContent();
            }
        });
    }

    // ================== NEW: SYSTEM SETTINGS TAB ==================

    /**
     * Render system settings tab.
     * @param {Element} container
     * @returns {void}
     */
    _renderSettingsTab(container) {
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                
                <!-- Subscription Pricing -->
                <div class="card" style="padding:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-tag"></i> Subscription Pricing</h3>
                    <div class="grid grid-3" style="gap:var(--space-6);">
                        <div style="padding:var(--space-6); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                            <label style="font-weight:600; color:var(--text-primary);">Basic Plan</label>
                            <div style="margin-top:var(--space-4); display:flex; align-items:baseline; gap:var(--space-2);">
                                <span style="font-size:2rem; font-weight:800;">$</span>
                                <input type="number" id="price-basic" class="input" placeholder="9.99" style="width:120px;" step="0.01">
                                <span style="color:var(--text-muted);">/month</span>
                            </div>
                            <button class="btn btn-primary btn-sm" style="margin-top:var(--space-4); width:100%;" onclick="this.updatePricing('basic')"><i class="fa-solid fa-save"></i> Save</button>
                        </div>

                        <div style="padding:var(--space-6); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle); border-color:var(--brand-primary);">
                            <label style="font-weight:600; color:var(--text-primary);">Pro Plan</label>
                            <div style="margin-top:var(--space-4); display:flex; align-items:baseline; gap:var(--space-2);">
                                <span style="font-size:2rem; font-weight:800;">$</span>
                                <input type="number" id="price-pro" class="input" placeholder="19.99" style="width:120px;" step="0.01">
                                <span style="color:var(--text-muted);">/month</span>
                            </div>
                            <button class="btn btn-primary btn-sm" style="margin-top:var(--space-4); width:100%;" onclick="this.updatePricing('pro')"><i class="fa-solid fa-save"></i> Save</button>
                        </div>

                        <div style="padding:var(--space-6); background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                            <label style="font-weight:600; color:var(--text-primary);">Premium Plan</label>
                            <div style="margin-top:var(--space-4); display:flex; align-items:baseline; gap:var(--space-2);">
                                <span style="font-size:2rem; font-weight:800;">$</span>
                                <input type="number" id="price-premium" class="input" placeholder="49.99" style="width:120px;" step="0.01">
                                <span style="color:var(--text-muted);">/month</span>
                            </div>
                            <button class="btn btn-primary btn-sm" style="margin-top:var(--space-4); width:100%;" onclick="this.updatePricing('premium')"><i class="fa-solid fa-save"></i> Save</button>
                        </div>
                    </div>
                </div>

                <!-- Promotional Banner -->
                <div class="card" style="padding:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-megaphone"></i> Promotional Banner</h3>
                    <form id="banner-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label><input type="checkbox" id="banner-active"> Active</label>
                            </div>
                            <div class="input-group">
                                <label>Banner Color</label>
                                <input type="color" id="banner-color" class="input" value="#FF6B6B">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Banner Text</label>
                            <input type="text" id="banner-text" class="input" placeholder="e.g. 50% Off Summer Sale!">
                        </div>
                        <div class="input-group" style="margin-top:var(--space-4);">
                            <label>Banner Link (Optional)</label>
                            <input type="url" id="banner-url" class="input" placeholder="https://...">
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-save"></i> Update Banner</button>
                        </div>
                    </form>
                </div>

                <!-- Platform Announcements -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                        <h3 style="margin:0;"><i class="fa-solid fa-bullhorn"></i> Platform Announcements</h3>
                        <button class="btn btn-primary btn-sm" id="btn-new-announcement"><i class="fa-solid fa-plus"></i> New Announcement</button>
                    </div>

                    <div id="announcements-list" style="display:flex; flex-direction:column; gap:var(--space-3);">
                        <div style="text-align:center; padding:var(--space-4); color:var(--text-muted);"><div class="spinner-sm"></div></div>
                    </div>
                </div>

                <!-- Cloudinary Config -->
                <div class="card" style="padding:var(--space-8);">
                    <h3 style="margin-bottom:var(--space-6);"><i class="fa-solid fa-cloud"></i> Cloudinary Configuration</h3>
                    <form id="cloudinary-form" onsubmit="event.preventDefault();">
                        <div class="grid grid-2" style="gap:var(--space-4);">
                            <div class="input-group">
                                <label>Cloud Name</label>
                                <input type="text" id="cloudinary-name" class="input" placeholder="your-cloud-name" required>
                            </div>
                            <div class="input-group">
                                <label>Upload Preset</label>
                                <input type="text" id="cloudinary-preset" class="input" placeholder="your-upload-preset" required>
                            </div>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-save"></i> Save Configuration</button>
                        </div>
                    </form>
                    <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-secondary); border-radius:var(--radius-md); border-left:2px solid var(--color-info);">
                        <p style="color:var(--text-muted); margin:0; font-size:0.9rem;"><i class="fa-solid fa-circle-info"></i> Get these credentials from your Cloudinary dashboard at console.cloudinary.com</p>
                    </div>
                </div>
            </div>
        `;
        
        this._initSettingsLogic();
    }

    async _initSettingsLogic() {
        // Load current settings
        const settings = await adminManagementService.getSystemSettings();
        
        // Populate pricing
        if (settings.subscriptionPricing) {
            document.getElementById('price-basic').value = settings.subscriptionPricing.basic?.price || '9.99';
            document.getElementById('price-pro').value = settings.subscriptionPricing.pro?.price || '19.99';
            document.getElementById('price-premium').value = settings.subscriptionPricing.premium?.price || '49.99';
        }

        // Populate banner
        if (settings.promotionalBanner) {
            document.getElementById('banner-active').checked = settings.promotionalBanner.active;
            document.getElementById('banner-text').value = settings.promotionalBanner.text || '';
            document.getElementById('banner-color').value = settings.promotionalBanner.color || '#FF6B6B';
            document.getElementById('banner-url').value = settings.promotionalBanner.url || '';
        }

        // Populate Cloudinary config
        const cloudinaryConfig = mediaService.getConfig();
        document.getElementById('cloudinary-name').value = cloudinaryConfig.cloudName || '';
        document.getElementById('cloudinary-preset').value = cloudinaryConfig.uploadPreset || '';

        // Banner form handler
        document.getElementById('banner-form').addEventListener('submit', async () => {
            const banner = {
                active: document.getElementById('banner-active').checked,
                text: document.getElementById('banner-text').value,
                color: document.getElementById('banner-color').value,
                url: document.getElementById('banner-url').value
            };
            await adminManagementService.setPromotionalBanner(banner);
        });

        // Cloudinary form handler
        document.getElementById('cloudinary-form').addEventListener('submit', () => {
            const cloudName = document.getElementById('cloudinary-name').value;
            const uploadPreset = document.getElementById('cloudinary-preset').value;
            mediaService.saveConfig(cloudName, uploadPreset);
        });

        // New announcement button
        document.getElementById('btn-new-announcement').addEventListener('click', () => {
            const text = prompt('Enter announcement text:');
            if (text) {
                adminManagementService.createAnnouncement({
                    title: prompt('Announcement title:') || 'Announcement',
                    text,
                    type: 'info'
                }).then(() => this._loadAnnouncements());
            }
        });

        // Load announcements
        this._loadAnnouncements();
    }

    async _loadAnnouncements() {
        const list = document.getElementById('announcements-list');
        const announcements = await adminManagementService.getAnnouncements();
        
        if (announcements.length === 0) {
            list.innerHTML = '<div class="text-muted text-center" style="padding:var(--space-4);">No active announcements.</div>';
            return;
        }

        list.innerHTML = announcements.map(ann => `
            <div style="padding:var(--space-4); background:var(--bg-tertiary); border-radius:var(--radius-md); border-left:3px solid var(--brand-primary); display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <h4 style="margin:0; color:var(--text-primary);">${ann.title || 'Announcement'}</h4>
                    <p style="margin:var(--space-1) 0 0 0; color:var(--text-muted); font-size:0.9rem;">${ann.text || ''}</p>
                </div>
                <button class="btn btn-ghost btn-sm deactivate-ann" data-id="${ann.id}" style="color:var(--color-error);"><i class="fa-solid fa-times"></i></button>
            </div>
        `).join('');

        list.querySelectorAll('.deactivate-ann').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await adminManagementService.deactivateAnnouncement(btn.dataset.id)) {
                    this._loadAnnouncements();
                }
            });
        });
    }
}
