// ============================================
// ProCode EduPulse — Navbar Component
// ============================================

import { $, $$ } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { authService } from '../services/auth-service.js';

export function renderNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.id = 'navbar';

    const currentHash = window.location.hash.slice(1) || '/';

    const _p = window.location.pathname;
    const _s = _p.split('/').filter(Boolean);
    const _base = (_p !== '/' && _p !== '/index.html' && _s.length > 0 && _s[0] !== 'index.html') ? '/' + _s[0] + '/' : './';

    const user = authService.getCurrentUser();
    const displayName = authService.getDisplayName();
    const initial = displayName.charAt(0).toUpperCase();

    navbar.innerHTML = `
    <div class="container">
      <a href="#/" class="nav-brand" id="nav-brand">
        <img src="${_base}logo.png" alt="ProCode" onerror="this.style.display='none'">
        <span class="nav-brand-text">
          <span class="nav-brand-pro">Pro</span>Code
        </span>
      </a>

      <div class="nav-links" id="nav-links">
        <a href="#/" class="nav-link ${currentHash === '/' ? 'active' : ''}" data-route="/">Home</a>
        <a href="#/courses" class="nav-link ${currentHash === '/courses' ? 'active' : ''}" data-route="/courses">Courses</a>
        <a href="#/portfolio" class="nav-link ${currentHash === '/portfolio' ? 'active' : ''}" data-route="/portfolio">Portfolio</a>
        <a href="#/profile" class="nav-link ${currentHash === '/profile' ? 'active' : ''}" data-route="/profile">Profile</a>
      </div>

      <div class="nav-actions">
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme" aria-label="Toggle dark/light theme">
          <i class="fa-solid ${storage.getTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
        ${user ? `
          <div class="user-menu">
            <div class="user-avatar-sm">${initial}</div>
            <span class="user-name-display">${displayName}</span>
            <button class="logout-btn" id="logout-btn" title="Sign out">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        ` : `
          <a href="#/login" class="btn btn-sm btn-primary" style="font-size:var(--text-xs)">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In
          </a>
        `}
        <button class="nav-mobile-toggle" id="nav-mobile-toggle" aria-label="Toggle menu">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </div>

    <div class="nav-mobile-menu" id="nav-mobile-menu">
      <a href="#/" class="nav-link" data-route="/">Home</a>
      <a href="#/courses" class="nav-link" data-route="/courses">Courses</a>
      <a href="#/portfolio" class="nav-link" data-route="/portfolio">Portfolio</a>
      <a href="#/profile" class="nav-link" data-route="/profile">Profile</a>
    </div>
  `;

    // Prepend to body
    const existing = $('#navbar');
    if (existing) existing.remove();
    document.body.prepend(navbar);

    // Event: theme toggle
    $('#theme-toggle').addEventListener('click', () => {
        const current = storage.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        storage.setTheme(next);
        const icon = $('#theme-toggle').querySelector('i');
        icon.className = `fa-solid ${next === 'dark' ? 'fa-sun' : 'fa-moon'}`;
    });

    // Event: logout
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await authService.signOut();
            localStorage.removeItem('procode_onboarding_done');
            window.location.hash = '/login';
            renderNavbar();
        });
    }

    // Event: mobile toggle
    $('#nav-mobile-toggle').addEventListener('click', () => {
        $('#nav-mobile-menu').classList.toggle('open');
    });

    // Close mobile menu on link click
    $$('#nav-mobile-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            $('#nav-mobile-menu').classList.remove('open');
        });
    });

    // Update active link on hash change
    window.addEventListener('hashchange', updateActiveLink);
}

function updateActiveLink() {
    const hash = window.location.hash.slice(1) || '/';
    $$('.nav-link').forEach(link => {
        const route = link.dataset.route;
        if (route === hash || (route !== '/' && hash.startsWith(route))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
