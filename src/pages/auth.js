// src/pages/auth.js
import { $, showToast } from '../../js/utils/dom.js';
import { authService } from '../../js/services/auth-service.js';
import { firestoreService } from '../../js/services/firestore-service.js';
import { storage } from '../../js/services/storage.js';
import { getAuthErrorMessage } from '../utils/auth.js';
import { loadData } from '../api/data.js';
import { renderNavbar } from '../../js/components/navbar.js';

function getBasePath() {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html') {
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0 && segments[0] !== 'index.html') {
            return '/' + segments[0] + '/';
        }
    }
    return './';
}

export function renderLoginPage() {
    const app = $('#app');
    const base = getBasePath();
    app.innerHTML = `
    <div class="auth-page bg-dots-pattern">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">
            <img src="${base}logo.png" alt="ProCode" onerror="this.style.display='none'">
            <span class="auth-logo-text"><span class="pro">Pro</span>Code</span>
          </div>
          <h2 class="auth-card-title">Welcome Back</h2>
          <p class="auth-card-subtitle">Sign in to continue your learning journey</p>
        </div>

        <div class="auth-alert" id="auth-alert"></div>

        <form class="auth-form" id="login-form">
          <div class="input-group">
            <label><i class="fa-solid fa-envelope"></i> Email</label>
            <input type="email" class="input" id="login-email" placeholder="your@email.com" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-lock"></i> Password</label>
            <input type="password" class="input" id="login-password" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="auth-submit-btn" id="login-submit">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In
          </button>
        </form>

        <div class="auth-divider">or</div>

        <button class="auth-google-btn" id="google-signin-btn">
          <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div class="auth-footer">
          Don't have an account? <a href="#/signup">Create one</a>
        </div>
      </div>
    </div>
    `;

    // Form submit
    $('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const btn = $('#login-submit');
        const alert = $('#auth-alert');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Signing in...';
        alert.classList.remove('visible', 'error', 'success');

        try {
            await authService.signIn(email, password);
            // Sync cloud data
            const uid = authService.getUid();
            if (uid) {
                const cloudData = await firestoreService.loadCloudData(uid);
                if (cloudData) {
                    if (cloudData.progress) storage._set('progress', cloudData.progress);
                    if (cloudData.profile) storage._set('profile', cloudData.profile);
                    if (cloudData.enrollments) storage._set('enrollments', cloudData.enrollments);
                }
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            // await startMainApp(); // TODO: import or pass as param
            window.location.hash = '/';
        } catch (err) {
            alert.classList.add('error', 'visible');
            alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code, err.message)}`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }
    });

    // Google sign-in
    $('#google-signin-btn').addEventListener('click', async () => {
        const alert = $('#auth-alert');
        try {
            await authService.signInWithGoogle();
            const uid = authService.getUid();
            const name = authService.getDisplayName();
            if (uid) {
                await storage.hydrateFromCloud(); // Pull existing cloud data back to local storage
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            renderNavbar();
            await loadData();
            window.location.hash = '#/';
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                alert.classList.add('error', 'visible');
                alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code, err.message)}`;
            }
        }
    });
}

export function renderSignupPage() {
    const app = $('#app');
    const base = getBasePath();
    app.innerHTML = `
    <div class="auth-page bg-dots-pattern">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">
            <img src="${base}logo.png" alt="ProCode" onerror="this.style.display='none'">
            <span class="auth-logo-text"><span class="pro">Pro</span>Code</span>
          </div>
          <h2 class="auth-card-title">Create Account</h2>
          <p class="auth-card-subtitle">Start your coding journey today</p>
        </div>

        <div class="auth-alert" id="auth-alert"></div>

        <form class="auth-form" id="signup-form">
          <div class="input-group">
            <label><i class="fa-solid fa-user"></i> Display Name</label>
            <input type="text" class="input" id="signup-name" placeholder="Your name" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-envelope"></i> Email</label>
            <input type="email" class="input" id="signup-email" placeholder="your@email.com" required>
          </div>
          <div class="input-group">
            <label><i class="fa-solid fa-lock"></i> Password</label>
            <input type="password" class="input" id="signup-password" placeholder="Minimum 6 characters" required minlength="6">
          </div>
          <button type="submit" class="auth-submit-btn" id="signup-submit">
            <i class="fa-solid fa-user-plus"></i> Create Account
          </button>
        </form>

        <div class="auth-divider">or</div>

        <button class="auth-google-btn" id="google-signup-btn">
          <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>
    `;

    // Form submit
    $('#signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#signup-name').value.trim();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value;
        const btn = $('#signup-submit');
        const alert = $('#auth-alert');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Creating account...';
        alert.classList.remove('visible', 'error', 'success');

        try {
            await authService.signUp(email, password, name);
            const uid = authService.getUid();
            // Set profile
            storage.updateProfile({ name, joinDate: new Date().toISOString() });
            if (uid) {
                await firestoreService.saveUserProfile(uid, {
                    name, email,
                    profile: storage.getProfile(),
                    progress: {},
                    enrollments: {},
                    submissions: {},
                    notes: {}
                });
                await storage.hydrateFromCloud();
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            localStorage.setItem('procode_user_name', name);
            renderNavbar();
            await loadData();
            window.location.hash = '#/';
        } catch (err) {
            alert.classList.add('error', 'visible');
            alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code, err.message)}`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
        }
    });

    // Google sign-up
    $('#google-signup-btn').addEventListener('click', async () => {
        const alert = $('#auth-alert');
        try {
            await authService.signInWithGoogle();
            const uid = authService.getUid();
            const name = authService.getDisplayName();
            if (uid) {
                await storage.hydrateFromCloud();
            }
            localStorage.setItem('procode_onboarding_done', 'true');
            localStorage.setItem('procode_user_name', name);
            renderNavbar();
            await loadData();
            window.location.hash = '#/';
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                alert.classList.add('error', 'visible');
                alert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getAuthErrorMessage(err.code, err.message)}`;
            }
        }
    });
}