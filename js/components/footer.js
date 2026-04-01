// ============================================
// ProCode EduPulse — Footer Component
// ============================================

import { $, showToast } from '../utils/dom.js';

let deferredPrompt = null;

/**
 * Initialize PWA Install Logic
 */
export function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        const installBtn = $('#footer-install-app');
        if (installBtn) {
            installBtn.style.display = 'flex';
        }
    });

    window.addEventListener('appinstalled', (evt) => {
        showToast('ProCode App installed successfully!', 'success');
        const installBtn = $('#footer-install-app');
        if (installBtn) installBtn.style.display = 'none';
        deferredPrompt = null;
    });
}

/**
 * Render the global Footer.
 */
export function renderFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.id = 'footer';

    const _p = window.location.pathname;
    const _s = _p.split('/').filter(Boolean);
    const _base = (_p !== '/' && _p !== '/index.html' && _s.length > 0 && _s[0] !== 'index.html') ? '/' + _s[0] + '/' : './';

    footer.innerHTML = `
    <div class="container footer-grid">
      <div class="footer-brand-section">
        <a href="#/" class="footer-logo">
          <img src="${_base}logo.png" alt="ProCode">
          <span>ProCode</span>
        </a>
        <p class="footer-tagline">Master the art of coding with interactive, project-based learning. Build your future today.</p>
        <div class="footer-socials">
          <a href="#" aria-label="Github"><i class="fa-brands fa-github"></i></a>
          <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
          <a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
          <a href="#" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
        </div>
      </div>

      <div class="footer-links-group">
        <h4 class="footer-title">Platform</h4>
        <ul class="footer-links">
          <li><a href="#/courses">Courses</a></li>
          <li><a href="#/roadmaps">Roadmaps</a></li>
          <li><a href="#/analytics">Statistics</a></li>
          <li><a href="#/recommendations">AI Mentor</a></li>
        </ul>
      </div>

      <div class="footer-links-group">
        <h4 class="footer-title">Community</h4>
        <ul class="footer-links">
          <li><a href="#/portfolio">Showcase</a></li>
          <li><a href="#/collaborate">Collaborate</a></li>
          <li><a href="#/careers">Volunteer</a></li>
          <li><a href="#/about">Our Story</a></li>
        </ul>
      </div>

      <div class="footer-app-section">
        <h4 class="footer-title">Experience Anywhere</h4>
        <p class="footer-app-text">Learn on the go with our professional PWA mobile application.</p>
        <button class="footer-install-btn" id="footer-install-app" style="display: ${deferredPrompt ? 'flex' : 'none'};">
          <i class="fa-solid fa-mobile-screen-button"></i>
          <span>Install ProCode App</span>
        </button>
        <div class="footer-app-badges">
          <div class="badge-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>Offline Access</span>
          </div>
          <div class="badge-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>Fast Loading</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-content">
        <p>&copy; ${new Date().getFullYear()} ProCode EduPulse. All rights reserved.</p>
        <div class="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </div>
    `;

    // Append/Replace in body
    document.querySelectorAll('footer, .footer').forEach(f => f.remove());
    
    
    // We want it at the end of the body or after #app
    const app = $('#app');
    if (app) {
        app.after(footer);
    } else {
        document.body.appendChild(footer);
    }

    // Install Event
    const installBtn = $('#footer-install-app');
    if (installBtn) {
        installBtn.onclick = async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
        };
    }
}
