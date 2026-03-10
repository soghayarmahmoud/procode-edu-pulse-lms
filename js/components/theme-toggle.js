// ============================================
// ProCode EduPulse — Theme Toggle
// ============================================

import { storage } from '../services/storage.js';

export function initTheme() {
    const savedTheme = storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
}
