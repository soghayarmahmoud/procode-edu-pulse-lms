// ============================================
// ProCode EduPulse — Cloudinary Config
// Production-grade video & image hosting
// API Key: 736918845124244 | Cloud: procode
// ============================================

const CLOUDINARY_CONFIG = {
    cloud_name: 'procode',
    api_key: '736918845124244',
    api_secret: 'XMbbdgH7dS1MJgyiE3R-rhxzM4g', // ⚠️ Server-side only, never expose to client
    upload_preset_video: 'procode_courses',      // Create in Cloudinary dashboard
    upload_preset_image: 'procode_images'       // Create in Cloudinary dashboard
};

/**
 * Initialize Cloudinary Widgets SDK
 */
export function initCloudinaryWidget() {
    if (window.cloudinary) return; // Already loaded
    
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/latest/global/loader.js';
    script.async = true;
    script.onload = () => {
        window._cloudinaryLoaded = true;
    };
    document.head.appendChild(script);
    
    return new Promise(resolve => {
        const checkLoad = setInterval(() => {
            if (window._cloudinaryLoaded) {
                clearInterval(checkLoad);
                resolve(true);
            }
        }, 100);
        setTimeout(() => clearInterval(checkLoad), 5000); // Timeout after 5s
    });
}

/**
 * Sanitize filename for storage safety
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_') // Replace invalid chars
        .replace(/_+/g, '_')              // Collapse underscores
        .replace(/^_+|_+$/g, '');         // Trim edges
}

/**
 * Open Cloudinary widget for video upload with progress tracking
 * @param {Object} options - Upload options
 * @param {Function} onSuccess - Callback with upload result
 * @param {Function} onProgress - Callback with progress percentage
 * @returns {Promise<Object>} Upload result
 */
export function openCloudinaryUploadWidget(options = {}, onSuccess, onProgress) {
    return initCloudinaryWidget().then(() => {
        if (!window.cloudinary) {
            console.error('Cloudinary SDK failed to load');
            return Promise.reject(new Error('Cloudinary SDK not available'));
        }

        const uploadWidget = window.cloudinary.openUploadWidget(
            {
                cloudName: CLOUDINARY_CONFIG.cloud_name,
                uploadPreset: CLOUDINARY_CONFIG.upload_preset_video,
                resourceType: 'video',
                clientAllowedFormats: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'flv'],
                maxFileSize: 500 * 1024 * 1024, // 500MB limit
                sources: ['local', 'url', 'dropbox'],
                folder: 'procode/courses/videos',
                publicId: options.publicId || undefined,
                tags: ['procode', 'course', 'video', options.courseId || 'uncategorized'],
                context: {
                    courseId: options.courseId || '',
                    lessonId: options.lessonId || '',
                    instructorId: options.instructorId || '',
                    uploadedAt: new Date().toISOString()
                },
                // Transformations to apply on upload
                transformation: [
                    {
                        width: 1280,
                        height: 720,
                        crop: 'fill',
                        quality: 'auto:good',
                        fetchFormat: 'auto'
                    }
                ],
                showAdvancedOptions: true,
                showPoweredBy: false,
                croppingAspectRatio: 16 / 9,
                croppingShowDimensions: true
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    if (onSuccess) onSuccess(null);
                    return;
                }

                if (result?.event === 'queues-start') {
                    console.log('Upload queue started');
                    if (onProgress) onProgress({ percent: 0 });
                }

                if (result?.event === 'uploaded') {
                    console.log('Video uploaded successfully:', result.info);
                    if (onSuccess) onSuccess(result.info);
                }

                if (result?.event === 'upload-added') {
                    if (onProgress) onProgress({ percent: 5 });
                }

                if (result?.event === 'queues-end') {
                    if (onProgress) onProgress({ percent: 100 });
                }
            }
        );

        return uploadWidget;
    }).catch(err => {
        console.error('Failed to open upload widget:', err);
        if (onSuccess) onSuccess(null);
    });
}

/**
 * Open Cloudinary widget for image upload (thumbnails)
 * @param {Object} options - Upload options (courseId, lessonId, etc.)
 * @param {Function} onSuccess - Success callback
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>}
 */
export function openCloudinaryImageUploadWidget(options = {}, onSuccess, onProgress) {
    return initCloudinaryWidget().then(() => {
        if (!window.cloudinary) {
            console.error('Cloudinary SDK failed to load');
            return;
        }

        window.cloudinary.openUploadWidget(
            {
                cloudName: CLOUDINARY_CONFIG.cloud_name,
                uploadPreset: CLOUDINARY_CONFIG.upload_preset_image,
                resourceType: 'image',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                maxFileSize: 10 * 1024 * 1024, // 10MB
                sources: ['local', 'url', 'dropbox'],
                folder: 'procode/courses/thumbnails',
                tags: ['procode', 'thumbnail', options.courseId || 'uncategorized'],
                showAdvancedOptions: true,
                showPoweredBy: false,
                cropping: true,
                croppingAspectRatio: 16 / 9,
                croppingShowDimensions: true
            },
            (error, result) => {
                if (error) {
                    console.error('Image upload error:', error);
                    if (onSuccess) onSuccess(null);
                    return;
                }

                if (result?.event === 'success') {
                    console.log('Image uploaded:', result.info);
                    if (onSuccess) onSuccess(result.info);
                }
            }
        );
    }).catch(err => {
        console.error('Failed to open image upload widget:', err);
        if (onSuccess) onSuccess(null);
    });
}

/**
 * Generate optimized video URL with transformations
 * @param {string} videoUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} Transformed URL
 */
export function getOptimizedVideoUrl(videoUrl, options = {}) {
    if (!videoUrl) return '';
    
    const {
        quality = 'auto:good',
        fetchFormat = 'auto',
        width = 1280,
        height = 720,
        crop = 'fill'
    } = options;

    // Extract public ID from URL
    const match = videoUrl.match(/\/v\d+\/([^.]+)/);
    if (!match) {
        console.warn('Invalid Cloudinary URL format:', videoUrl);
        return videoUrl;
    }

    const publicId = match[1];
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/video/upload`;
    
    // Build transformation string
    const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${fetchFormat}`;
    
    return `${baseUrl}/${transformation}/${publicId}.mp4`;
}

/**
 * Generate video thumbnail URL
 * @param {string} videoUrl - Cloudinary video URL
 * @param {Object} options - Thumbnail options
 * @returns {string} Thumbnail URL
 */
export function getVideoThumbnail(videoUrl, options = {}) {
    if (!videoUrl) return '';
    
    const {
        width = 400,
        height = 300,
        timestamp = null // seconds into video for thumbnail
    } = options;

    const match = videoUrl.match(/\/v\d+\/([^.]+)/);
    if (!match) return '';

    const publicId = match[1];
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/video/upload`;
    
    // Use Cloudinary's video to image transformation
    const transformation = timestamp 
        ? `w_${width},h_${height},c_fill,q_80,f_auto,so_${timestamp}s`
        : `w_${width},h_${height},c_fill,q_80,f_auto`;
    
    return `${baseUrl}/${transformation}/${publicId}.jpg`;
}

/**
 * Generate image thumbnail with caching
 * @param {string} imageUrl - Cloudinary image URL
 * @param {Object} options - Thumbnail options
 * @returns {string} Thumbnail URL
 */
export function getImageThumbnail(imageUrl, options = {}) {
    if (!imageUrl) return '';
    
    const {
        width = 200,
        height = 150,
        format = 'webp'
    } = options;

    const match = imageUrl.match(/\/v\d+\/([^.]+)/);
    if (!match) return imageUrl; // Return original if not recognized

    const publicId = match[1];
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
    const transformation = `w_${width},h_${height},c_fill,q_auto,f_${format}`;
    
    return `${baseUrl}/${transformation}/${publicId}.${format}`;
}

/**
 * Build secure signed URL (server-side use only)
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Signing options
 * @returns {string} Signed URL
 */
export function buildSignedUrl(publicId, options = {}) {
    // ⚠️ This should only be called on the backend
    // Never expose api_secret to frontend
    console.warn('buildSignedUrl should only be used on backend. Never expose API secret.');
    return '';
}

/**
 * Get resource metadata and stats
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Resource metadata
 */
export async function getResourceMetadata(publicId) {
    try {
        const response = await fetch(`https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/metadata/${publicId}`);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        return await response.json();
    } catch (err) {
        console.error('Metadata fetch error:', err);
        return null;
    }
}

/**
 * Delete resource from Cloudinary (requires backend authentication)
 * @param {string} publicId - Public ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteResource(publicId) {
    console.warn('deleteResource should be called from backend with authenticated API key');
    // This should be implemented on the backend to avoid exposing API secret
    return false;
}

/**
 * Batch upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {Object} options - Upload options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object[]>} Upload results
 */
export async function batchUpload(files, options = {}, onProgress) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sanitized = sanitizeFilename(file.name);
        
        const result = await openCloudinaryUploadWidget(
            {
                ...options,
                publicId: sanitized
            },
            (info) => results.push(info),
            (progress) => {
                if (onProgress) {
                    const overallProgress = ((i + progress.percent / 100) / files.length) * 100;
                    onProgress({ percent: Math.round(overallProgress) });
                }
            }
        );
    }
    
    return results;
}

// Export config for reference
export { CLOUDINARY_CONFIG };
