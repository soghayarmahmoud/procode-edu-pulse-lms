// ============================================
// ProCode EduPulse — Cloudinary Media Service
// ============================================

import { storage } from './storage.js';
import { showToast } from '../utils/dom.js';
import { CLOUDINARY_CONFIG } from '../config/env.js';

/**
 * Cloudinary media upload helper.
 */
class MediaService {
    /**
     * Create a MediaService instance.
     */
    constructor() {
        this.configKey = 'cloudinary_config';
        this.scriptUrl = 'https://upload-widget.cloudinary.com/global/all.js';
        this.isScriptLoaded = false;
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
     * Open the Cloudinary Upload Widget.
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
}

export const mediaService = new MediaService();
