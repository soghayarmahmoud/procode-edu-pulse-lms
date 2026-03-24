import { $, showToast } from '../utils/dom.js';
import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';

export class AdminDashboard {
    constructor(containerSelector, systemData) {
        this.containerContainer = $(containerSelector);
        this.systemData = systemData || {};
        this.currentTab = 'overview';
        this.render();
    }

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
            const isAdmin = userDoc?.isAdmin === true || userDoc?.profile?.isAdmin === true;
            
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
                            <div style="width:36px; height:36px; border-radius:50%; background:var(--brand-primary); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                                ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                            </div>
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
            </style>
        `;

        this._attachEvents();
        this._renderActiveTab();
    }

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
                case 'submissions':
                    title.innerHTML = 'Review Submissions';
                    this._renderSubmissionsTab(area);
                    break;
                case 'gamification':
                    title.innerHTML = 'Gamification Logic Modifiers';
                    this._renderGamificationTab(area);
                    break;
            }
            
            area.style.transition = 'opacity 0.3s ease';
            area.style.opacity = '1';
        }, 150);
    }

    // ── Tab Renderers ──

    _renderOverviewTab(container) {
        container.innerHTML = `
            <div class="grid grid-3" style="gap:var(--space-6); margin-bottom:var(--space-8);">
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Total Registered Users</span>
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="admin-stats-value">1,492</div>
                    <div style="font-size:0.85rem; color:var(--color-success);"><i class="fa-solid fa-arrow-trend-up"></i> +12% this week</div>
                </div>
                
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Course Catalog Size</span>
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <div class="admin-stats-value">${(this.systemData.coursesData || []).length}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Live courses actively served</div>
                </div>
                
                <div class="admin-stats-card">
                    <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                        <span>Pending Submissions</span>
                        <i class="fa-solid fa-inbox"></i>
                    </div>
                    <div class="admin-stats-value" style="background:var(--color-error); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">3</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Requires manual grading</div>
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
                        <span class="text-muted" style="font-size:0.9rem;">Connected (0ms)</span>
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
    }

    _renderUsersTab(container) {
        container.innerHTML = `
            <div class="card" style="padding:var(--space-6); margin-bottom:var(--space-6);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                    <div class="input-group" style="margin:0; width:300px;">
                        <div style="position:relative;">
                            <i class="fa-solid fa-search text-muted" style="position:absolute; left:12px; top:50%; transform:translateY(-50%);"></i>
                            <input type="text" class="input" placeholder="Search by email, UID, or name..." style="padding-left:36px; padding-top:8px; padding-bottom:8px;">
                        </div>
                    </div>
                    <button class="btn btn-outline"><i class="fa-solid fa-filter"></i> Filters</button>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="border-bottom:2px solid var(--border-subtle); color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">
                                <th style="padding:var(--space-3) var(--space-2);">User</th>
                                <th style="padding:var(--space-3) var(--space-2);">Role</th>
                                <th style="padding:var(--space-3) var(--space-2);">Last Active</th>
                                <th style="padding:var(--space-3) var(--space-2);">Level</th>
                                <th style="padding:var(--space-3) var(--space-2); text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody style="font-size:0.95rem;">
                            <!-- Mock Data Row -->
                            <tr style="border-bottom:1px solid var(--border-subtle);">
                                <td style="padding:var(--space-4) var(--space-2);">
                                    <div style="display:flex; align-items:center; gap:var(--space-3);">
                                        <div class="avatar-sm" style="background:var(--bg-tertiary); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">JD</div>
                                        <div>
                                            <div style="font-weight:600;">John Doe</div>
                                            <div class="text-muted" style="font-size:0.8rem;">johndoe@example.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:var(--space-4) var(--space-2);"><span class="badge" style="background:rgba(0,120,212,0.1); color:var(--brand-primary);">Student</span></td>
                                <td style="padding:var(--space-4) var(--space-2);">2 hours ago</td>
                                <td style="padding:var(--space-4) var(--space-2);"><span style="color:var(--color-warning); font-weight:bold;">14</span></td>
                                <td style="padding:var(--space-4) var(--space-2); text-align:right;">
                                    <button class="btn btn-ghost btn-sm" title="View Profile"><i class="fa-solid fa-eye"></i></button>
                                    <button class="btn btn-ghost btn-sm" title="Edit Roles"><i class="fa-solid fa-shield-halved"></i></button>
                                    <button class="btn btn-ghost btn-sm" style="color:var(--color-error);" title="Block User"><i class="fa-solid fa-ban"></i></button>
                                </td>
                            </tr>
                            
                            <tr style="border-bottom:1px solid var(--border-subtle);">
                                <td style="padding:var(--space-4) var(--space-2);">
                                    <div style="display:flex; align-items:center; gap:var(--space-3);">
                                        <div class="avatar-sm" style="background:var(--brand-primary); color:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">S</div>
                                        <div>
                                            <div style="font-weight:600;">Sarah Admin</div>
                                            <div class="text-muted" style="font-size:0.8rem;">admin@procode.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:var(--space-4) var(--space-2);"><span class="badge" style="background:rgba(231, 76, 60, 0.1); color:var(--color-error);">Admin</span></td>
                                <td style="padding:var(--space-4) var(--space-2);">Online</td>
                                <td style="padding:var(--space-4) var(--space-2);"><span style="color:var(--color-warning); font-weight:bold;">99</span></td>
                                <td style="padding:var(--space-4) var(--space-2); text-align:right;">
                                    <button class="btn btn-ghost btn-sm" title="View Profile"><i class="fa-solid fa-eye"></i></button>
                                    <button class="btn btn-ghost btn-sm" title="Edit Roles"><i class="fa-solid fa-shield-halved"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-6); color:var(--text-muted); font-size:0.9rem;">
                    <span>Showing 2 of 1,492 users</span>
                    <div style="display:flex; gap:var(--space-2);">
                        <button class="btn btn-outline btn-sm" disabled>Previous</button>
                        <button class="btn btn-outline btn-sm">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    _renderContentTab(container) {
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
                    
                    <form onsubmit="event.preventDefault();" style="display:flex; flex-direction:column; gap:var(--space-4); flex:1;">
                        <div class="input-group">
                            <label>Cloud Name</label>
                            <input type="text" class="input" placeholder="e.g. dpqjxyz12">
                        </div>
                        <div class="input-group">
                            <label>Upload Preset (Unsigned)</label>
                            <input type="text" class="input" placeholder="e.g. procode_uploads">
                        </div>
                        <div style="margin-top:auto; display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary"><i class="fa-solid fa-save"></i> Save Config</button>
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

    _renderCoursesTab(container) {
        // Integrate InstructorDashboard logic here
        container.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr; gap:var(--space-8);">
                <!-- Course Builder -->
                <div class="card" style="padding:var(--space-8);">
                    <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6);">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(108, 92, 231, 0.1); color:var(--brand-primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fa-solid fa-plus"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;">Create New Course</h3>
                            <p class="text-muted" style="font-size:0.9rem;">Define a new learning path in the catalog.</p>
                        </div>
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
                                <label>YouTube Video ID</label>
                                <input type="text" id="lesson-youtube" class="input" placeholder="e.g. dQw4w9WgXcQ">
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
                            <label>Lesson Notes (Markdown/HTML)</label>
                            <textarea id="lesson-content" class="input textarea" rows="5" placeholder="<h2>Welcome</h2><p>Here are your notes.</p>"></textarea>
                        </div>
                        <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" id="btn-save-lesson" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Publish Lesson to Cloud</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Initialize dynamic logic for this tab
        this._initCourseBuilderLogic();
    }

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
                    difficulty: document.getElementById('course-difficulty').value,
                    description: document.getElementById('course-desc').value.trim(),
                    totalLessons: parseInt(document.getElementById('course-total-lessons').value, 10),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicCourse(courseData);
                if (success) {
                    showToast('Course successfully published to the cloud!', 'success');
                    form.reset();
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
                    duration: document.getElementById('lesson-duration').value.trim(),
                    order: parseInt(document.getElementById('lesson-order').value, 10),
                    content: document.getElementById('lesson-content').value.trim(),
                    isDynamic: true
                };

                const success = await firestoreService.saveDynamicLesson(lessonData);
                if (success) {
                    showToast('Lesson successfully published to the cloud!', 'success');
                    form.reset();
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
    }

    _filterOptions(query) {
        const optionsContainer = document.getElementById('lesson-course-options');
        if (!optionsContainer) return;
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            const searchData = opt.dataset.search || '';
            opt.style.display = searchData.includes(query) ? 'flex' : 'none';
        });
    }

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
}
