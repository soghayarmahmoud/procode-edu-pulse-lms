// ============================================
// ProCode EduPulse — Navbar Component
// ============================================

import { $, $$ } from '../utils/dom.js';
import { storage } from '../services/storage.js';

export function renderNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.id = 'navbar';

    const currentHash = window.location.hash.slice(1) || '/';

    const _p = window.location.pathname;
    const _s = _p.split('/').filter(Boolean);
    const _base = (_p !== '/' && _p !== '/index.html' && _s.length > 0 && _s[0] !== 'index.html') ? '/' + _s[0] + '/' : './';
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
          ${storage.getTheme() === 'dark' ? '☀️' : '🌙'}
        </button>
        <button class="nav-mobile-toggle" id="nav-mobile-toggle" aria-label="Toggle menu">
          ☰
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
        $('#theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
    });

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
