// ============================================
// ProCode EduPulse — Navbar Component
// ============================================

import { $, $$, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { authService } from '../services/auth-service.js';
import { db, isFirebaseConfigured } from '../services/firebase-config.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/**
 * Render the global navigation bar.
 * @returns {void}
 */
export function renderNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.id = 'navbar';

    const currentHash = window.location.hash.slice(1) || '/';
    const user = authService.getCurrentUser();
    const isAdmin = authService.isAdminSync();
    
    const _p = window.location.pathname;
    const _s = _p.split('/').filter(Boolean);
    const _base = (_p !== '/' && _p !== '/index.html' && _s.length > 0 && _s[0] !== 'index.html') ? '/' + _s[0] + '/' : './';

    const displayName = authService.getDisplayName();
    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

    navbar.innerHTML = `
    <div class="container">
      <a href="#/" class="nav-brand" id="nav-brand">
        <img src="${_base}logo.png" alt="ProCode" onerror="this.style.display='none'">
        <span class="nav-brand-text">
          <span class="nav-brand-pro">Pro</span>Code
        </span>
      </a>

      <!-- Desktop Core Links -->
      <div class="nav-links desktop-only" id="nav-links">
        <a href="#/" class="nav-link ${currentHash === '/' ? 'active' : ''}" data-route="/">Home</a>
        <a href="#/courses" class="nav-link ${currentHash.startsWith('/course') ? 'active' : ''}" data-route="/courses">Courses</a>
        <a href="#/roadmaps" class="nav-link ${currentHash.startsWith('/roadmap') ? 'active' : ''}" data-route="/roadmaps">Roadmaps</a>
      </div>

      <div class="nav-actions">
        <div class="desktop-only" style="display:flex; align-items:center; gap:var(--space-3);">
          <button class="theme-toggle" id="theme-toggle-desktop" title="Toggle theme" aria-label="Toggle dark/light theme">
            <i class="fa-solid ${storage.getTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
          </button>
          
          ${user ? `
            <div class="user-mini-profile" style="display:flex; align-items:center; gap:var(--space-3); padding: var(--space-1) var(--space-2); background: var(--bg-tertiary); border-radius: 30px; border: 1px solid var(--border-subtle)">
               <div class="user-avatar-sm" style="width: 28px; height: 28px; font-size: 10px;">${initial}</div>
               <div class="nav-gems" style="font-size: var(--text-xs); font-weight: bold; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-gem" style="color: #00cec9;"></i> ${storage.getGems()}
               </div>
            </div>
          ` : `
            <a href="#/login" class="btn btn-sm btn-primary" style="font-size:var(--text-xs); border-radius: 20px;">
              Sign In
            </a>
          `}
        </div>

        <button class="nav-menu-btn" id="nav-menu-btn" aria-label="Open menu">
          <span class="menu-btn-text desktop-only">Menu</span>
          <i class="fa-solid fa-bars-staggered"></i>
        </button>
      </div>
    </div>

    <!-- Unified Sidebar Menu -->
    <div class="nav-sidebar-overlay" id="nav-sidebar-overlay"></div>
    <div class="nav-sidebar" id="nav-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="${_base}logo.png" alt="ProCode">
          <span>ProCode</span>
        </div>
        <button class="sidebar-close" id="sidebar-close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="sidebar-content">
        <!-- User Section (if logged in) -->
        ${user ? `
          <div class="sidebar-user-card">
            <div class="user-info">
              <div class="user-avatar-lg">${initial}</div>
              <div class="user-details">
                <span class="user-name">${displayName}</span>
                <span class="user-role">Student Learner</span>
              </div>
            </div>
            <div class="user-stats">
              <div class="stat">
                <i class="fa-solid fa-gem"></i>
                <span>${storage.getGems()} Gems</span>
              </div>
              <div class="stat">
                <i class="fa-solid fa-fire"></i>
                <span>${storage.getStreak?.() || 0} Day Streak</span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Menu Groups -->
        <div class="sidebar-groups">
          <div class="sidebar-group">
            <h3 class="group-title">Learning</h3>
            <div class="group-links">
              <a href="#/" class="sidebar-link"><i class="fa-solid fa-house"></i> Home</a>
              <a href="#/courses" class="sidebar-link"><i class="fa-solid fa-graduation-cap"></i> Courses</a>
              <a href="#/roadmaps" class="sidebar-link"><i class="fa-solid fa-map"></i> Roadmaps</a>
              <a href="#/docs" class="sidebar-link"><i class="fa-solid fa-book"></i> Documentation</a>
              <a href="#/recommendations" class="sidebar-link"><i class="fa-solid fa-robot"></i> AI Coach</a>
            </div>
          </div>

          <div class="sidebar-group">
            <h3 class="group-title">Community</h3>
            <div class="group-links">
              <a href="#/portfolio" class="sidebar-link"><i class="fa-solid fa-briefcase"></i> Portfolio</a>
              <a href="#/collaborate" class="sidebar-link"><i class="fa-solid fa-users"></i> Collaborate</a>
              <a href="#/careers" class="sidebar-link"><i class="fa-solid fa-handshake-angle"></i> Volunteer</a>
              <a href="#/about" class="sidebar-link"><i class="fa-solid fa-circle-info"></i> About Us</a>
            </div>
          </div>

          <div class="sidebar-group">
            <h3 class="group-title">Dashboard</h3>
            <div class="group-links">
              <a href="#/analytics" class="sidebar-link"><i class="fa-solid fa-chart-line"></i> Analytics</a>
              <a href="#/gamification" class="sidebar-link"><i class="fa-solid fa-trophy"></i> Achievements</a>
              <a href="#/search" class="sidebar-link"><i class="fa-solid fa-magnifying-glass"></i> Search</a>
              ${isAdmin ? `<a href="#/admin" class="sidebar-link admin-link"><i class="fa-solid fa-gauge-high"></i> Admin Panel</a>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-settings">
          <button class="theme-toggle-btn" id="theme-toggle-sidebar">
            <i class="fa-solid ${storage.getTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
            <span>${storage.getTheme() === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
        ${user ? `
          <button class="sidebar-logout logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        ` : `
          <a href="#/login" class="sidebar-login-btn">
            <i class="fa-solid fa-right-to-bracket"></i>
            <span>Sign In</span>
          </a>
        `}
      </div>
    </div>
  `;

    // Prepend to body
    const existing = $('#navbar');
    if (existing) existing.remove();
    document.body.prepend(navbar);

    // Sidebar Toggles
    const menuBtn = $('#nav-menu-btn');
    const closeBtn = $('#sidebar-close');
    const overlay = $('#nav-sidebar-overlay');
    const sidebar = $('#nav-sidebar');

    const openSidebar = () => {
        sidebar.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    };

    menuBtn?.addEventListener('click', openSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Close on link click
    $$('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // Theme Toggle
    const toggleTheme = () => {
        const current = storage.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        storage.setTheme(next);
        
        // Update all theme icons
        const icons = $$('.theme-toggle i, .theme-toggle-btn i');
        icons.forEach(icon => {
            icon.className = `fa-solid ${next === 'dark' ? 'fa-sun' : 'fa-moon'}`;
        });
        
        // Update text if exists
        const themeTexts = $$('.theme-toggle-btn span');
        themeTexts.forEach(span => {
            span.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
        });
    };
    $('#theme-toggle-desktop')?.addEventListener('click', toggleTheme);
    $('#theme-toggle-sidebar')?.addEventListener('click', toggleTheme);

    // Logout
    const handleLogout = async () => {
        await authService.signOut();
        localStorage.removeItem('procode_onboarding_done');
        if (window.__notificationsUnsub) window.__notificationsUnsub();
        window.location.hash = '/login';
        renderNavbar();
    };

    $$('.logout-btn').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    // Update active link on hash change
    window.addEventListener('hashchange', updateActiveLink);
    updateActiveLink(); // Initial call
}

function updateActiveLink() {
    const hash = window.location.hash.slice(1) || '/';
    // Update both navbar and sidebar links
    $$('.nav-link, .sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const route = href.replace('#', '');
        
        if (route === hash || (route !== '/' && hash.startsWith(route))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
