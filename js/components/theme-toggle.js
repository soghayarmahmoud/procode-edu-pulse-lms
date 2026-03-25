// ============================================
// ProCode EduPulse — Theme Toggle
// ============================================

import { storage } from '../services/storage.js';

/**
 * Initialize theme from storage.
 * @returns {void}
 */
export function initTheme() {
    const savedTheme = storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
}
