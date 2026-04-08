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
    videoPreset: env.VITE_CLOUDINARY_VIDEO_PRESET || 'procode_course_videos',
    thumbnailPreset: env.VITE_CLOUDINARY_THUMBNAIL_PRESET || 'procode_course_thumbnails'
};
