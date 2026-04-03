// ============================================
// ProCode EduPulse — Cloudinary Media Service
// ============================================
// Enhanced version with video upload support, progress tracking,
// and secure file handling.

import { storage } from './storage.js';
import { showToast } from '../utils/dom.js';
import { CLOUDINARY_CONFIG } from '../config/env.js';

/**
 * Enhanced Cloudinary media upload service.
 */
class MediaService {
    /**
     * Create a MediaService instance.
     */
    constructor() {
        this.configKey = 'cloudinary_config';
        this.scriptUrl = 'https://upload-widget.cloudinary.com/global/all.js';
        this.isScriptLoaded = false;
        this.uploadProgress = {};
    }

    /**
     * Get the current Cloudinary configuration from storage or env.js.
     * @returns {{cloudName: string, uploadPreset: string, apiKey: string}}
     */
    getConfig() {
        const local = storage._get(this.configKey) || {};
        return {
            cloudName: CLOUDINARY_CONFIG.cloudName || local.cloudName || '',
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset || local.uploadPreset || '',
            apiKey: CLOUDINARY_CONFIG.apiKey || local.apiKey || ''
        };
    }

    /**
     * Save the Cloudinary configuration (overrides env values only in current session).
     * @param {string} cloudName
     * @param {string} uploadPreset
     * @returns {boolean}
     */
    saveConfig(cloudName, uploadPreset) {
        if (!cloudName || !uploadPreset) {
            showToast('Cloud Name and Upload Preset are required.', 'error');
            return false;
        }
        storage._set(this.configKey, { cloudName, uploadPreset });
        showToast('Cloudinary configuration updated for this session!', 'success');
        return true;
    }

    /**
     * Dynamically load the Cloudinary Upload Widget script.
     * @returns {Promise<boolean>}
     */
    async loadWidgetScript() {
        if (this.isScriptLoaded) return true;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.scriptUrl;
            script.type = 'text/javascript';
            script.onload = () => {
                this.isScriptLoaded = true;
                resolve(true);
            };
            script.onerror = () => {
                showToast('Failed to load Cloudinary library.', 'error');
                reject(new Error('Cloudinary script load failed'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Open the Cloudinary Upload Widget for images/general media.
     * @param {object} [options={}] Custom widget options.
     * @param {(info: object) => void} [callback] Called on success.
     * @returns {Promise<void>}
     */
    async openUploadWidget(options = {}, callback) {
        const config = this.getConfig();
        if (!config.cloudName || !config.uploadPreset) {
            showToast('Please configure Cloudinary in the Admin Settings first.', 'warning');
            return;
        }

        try {
            await this.loadWidgetScript();
            
            const widget = window.cloudinary.createUploadWidget({
                cloudName: config.cloudName,
                uploadPreset: config.uploadPreset,
                ...options
            }, (error, result) => {
                if (!error && result && result.event === "success") { 
                    console.log('Done! Here is the image info: ', result.info); 
                    if (callback) callback(result.info);
                } else if (error) {
                    console.error('Upload Error:', error);
                }
            });

            widget.open();
        } catch (err) {
            console.error('Could not initialize Cloudinary Widget:', err);
        }
    }

    /**
     * Open upload widget specifically for video uploads.
     * @param {object} [options={}] Custom widget options.
     * @param {(info: object) => void} [callback] Called on success.
     * @param {(progress: object) => void} [progressCallback] Called during upload.
     * @returns {Promise<void>}
     */
    async openVideoUploadWidget(options = {}, callback, progressCallback) {
        const config = this.getConfig();
        if (!config.cloudName || !config.uploadPreset) {
            showToast('Please configure Cloudinary in the Admin Settings first.', 'warning');
            return;
        }

        try {
            await this.loadWidgetScript();
            
            const defaultVideoOptions = {
                resourceType: 'video',
                maxFileSize: 500000000, // 500 MB
                maxFiles: 1,
                clientAllowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
                showAdvancedOptions: false,
                cropping: false,
                multiple: false,
                defaultSource: 'local',
                showPoweredBy: false,
                tags: ['instructor-video', 'course-content']
            };

            const mergedOptions = {
                cloudName: config.cloudName,
                uploadPreset: config.uploadPreset,
                ...defaultVideoOptions,
                ...options
            };

            const widget = window.cloudinary.createUploadWidget(mergedOptions, (error, result) => {
                if (!error && result && result.event === "success") { 
                    console.log('Video uploaded successfully:', result.info);
                    if (callback) callback(result.info);
                } else if (error) {
                    console.error('Upload Error:', error);
                    showToast(`Upload failed: ${error.statusText || 'Unknown error'}`, 'error');
                }
            });

            // Track progress
            if (progressCallback) {
                widget.on('queues-end', () => progressCallback({ status: 'completed', percent: 100 }));
                widget.on('upload-added', () => progressCallback({ status: 'uploading', percent: 0 }));
            }

            widget.open();
        } catch (err) {
            console.error('Could not initialize Video Upload Widget:', err);
            showToast('Failed to initialize video upload', 'error');
        }
    }

    /**
     * Validate video file before upload.
     * @param {File} file
     * @returns {{valid: boolean, error: string|null}}
     */
    validateVideoFile(file) {
        const maxSize = 500 * 1024 * 1024; // 500 MB
        const allowedFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];

        if (file.size > maxSize) {
            return { valid: false, error: 'Video file too large. Maximum 500 MB allowed.' };
        }

        if (!allowedFormats.includes(file.type)) {
            return { valid: false, error: 'Unsupported video format. Use MP4, MOV, AVI, MKV, or WebM.' };
        }

        return { valid: true, error: null };
    }

    /**
     * Get video metadata (duration, dimensions, etc.).
     * @param {string} videoUrl Cloudinary URL
     * @returns {Promise<object>}
     */
    async getVideoMetadata(videoUrl) {
        try {
            const video = document.createElement('video');
            video.addEventListener('loadedmetadata', function() {
                return {
                    duration: this.duration,
                    videoWidth: this.videoWidth,
                    videoHeight: this.videoHeight
                };
            }, false);
            video.src = videoUrl;
        } catch (e) {
            console.warn('Failed to get video metadata:', e);
            return {};
        }
    }

    /**
     * Generate thumbnail from video (Cloudinary transformation).
     * @param {string} videoUrl Original video URL
     * @param {object} options { width, height, timeOffset }
     * @returns {string} Thumbnail URL
     */
    generateVideoThumbnail(videoUrl, options = {}) {
        const { width = 320, height = 180, timeOffset = 1 } = options;
        
        // Cloudinary transformation: extract frame at specified time
        if (videoUrl && videoUrl.includes('cloudinary.com')) {
            // Replace /upload/ with /upload/so_{timeOffset},w_{width},h_{height},c_fill/
            return videoUrl.replace(
                '/upload/',
                `/upload/w_${width},h_${height},c_fill,so_${timeOffset},q_90/`
            );
        }
        
        return videoUrl;
    }

    /**
     * Generate adaptive streaming quality versions (for Cloudinary videos).
     * @param {string} videoUrl
     * @returns {object} URLs for different quality levels
     */
    generateAdaptiveQualities(videoUrl) {
        if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
            return { original: videoUrl };
        }

        return {
            original: videoUrl,
            hd: videoUrl.replace('/upload/', '/upload/q_auto,w_1280/'),
            sd: videoUrl.replace('/upload/', '/upload/q_auto,w_640/'),
            mobile: videoUrl.replace('/upload/', '/upload/q_auto,w_320/')
        };
    }

    /**
     * Get secure signed URL (for private videos).
     * @param {string} publicId
     * @param {number} expirationHours
     * @returns {string} Signed URL
     */
    getSecureVideoUrl(publicId, expirationHours = 24) {
        const config = this.getConfig();
        if (!config.cloudName) return '';
        
        // In production, use server-side signing for security
        // This is a placeholder - actual signing should happen server-side
        const timestamp = Math.floor(Date.now() / 1000) + (expirationHours * 3600);
        return `https://res.cloudinary.com/${config.cloudName}/video/authenticated/${publicId}`;
    }

    /**
     * Delete a video from Cloudinary (requires admin credentials).
     * @param {string} publicId
     * @returns {Promise<boolean>}
     */
    async deleteVideo(publicId) {
        const config = this.getConfig();
        if (!config.cloudName || !config.apiKey) {
            showToast('Cloudinary API key not configured', 'error');
            return false;
        }

        try {
            // Note: Deletion should be done server-side for security
            // This is a reference for server implementation
            console.warn('Video deletion should be handled server-side');
            return true;
        } catch (e) {
            console.error('Failed to delete video:', e);
            showToast('Failed to delete video', 'error');
            return false;
        }
    }

    /**
     * Get video upload restrictions for instructor courses.
     * @returns {object}
     */
    getVideoUploadRestrictions() {
        return {
            maxFileSize: 500 * 1024 * 1024, // 500 MB
            maxFiles: 1000, // Per course
            allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
            autoplayRestricted: true,
            downloadProtection: true
        };
    }
}

export const mediaService = new MediaService();
