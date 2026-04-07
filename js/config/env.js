// ============================================
// ProCode EduPulse — Environment Configuration
// ============================================

/**
 * Cloudinary client-side settings.
 * Keep only public values in the frontend.
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

export const CLOUDINARY_CONFIG = {
    cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || '',
    apiKey: env.VITE_CLOUDINARY_API_KEY || '',
    uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
};
