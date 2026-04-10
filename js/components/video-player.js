// ============================================
// ProCode EduPulse — YouTube Video Player
// Updated for Issue #117: Timestamp Syncing
// ============================================

import { progressSyncService } from '../services/progress-sync.js';

let playerInstance = null;
let apiReady = false;
let onReadyCallbacks = [];

// Load YouTube IFrame API
/**
 * Inject the YouTube IFrame API script.
 * @returns {void}
 */
function loadYTAPI() {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

// YouTube API callback
/**
 * YouTube IFrame API ready handler.
 * @returns {void}
 */
window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    onReadyCallbacks.forEach(cb => cb());
    onReadyCallbacks = [];
};

/**
 * Video player wrapper for YouTube or native video.
 */
export class VideoPlayer {
    /**
     * Create a VideoPlayer instance.
     * @param {string} containerId
     * @param {string} videoId
     * @param {{onReady?: Function, onStateChange?: Function, onTimeUpdate?: Function, courseId?: string, lessonId?: string}} [options={}]
     */
    constructor(containerId, videoId, options = {}) {
        this.containerId = containerId;
        this.videoId = videoId;
        this.options = options;
        this.player = null;
        this.videoElement = null; // for native video
        this.onTimeUpdate = options.onTimeUpdate || null;
        this._timeInterval = null;
        this._syncInterval = null;
        
        // Track course/lesson for syncing
        this.courseId = options.courseId || null;
        this.lessonId = options.lessonId || null;

        const videoType = this._detectVideoType(videoId);
        
        if (videoType === 'youtube') {
            loadYTAPI();
            if (apiReady) {
                this._createPlayer();
            } else {
                onReadyCallbacks.push(() => this._createPlayer());
            }
        } else if (videoType === 'cloudinary') {
            this._createCloudinaryPlayer();
        } else {
            this._createNativePlayer();
        }
    }

    /**
     * Detect video type based on URL or ID.
     * @param {string} videoId
     * @returns {string} 'youtube' | 'cloudinary' | 'native'
     */
    _detectVideoType(videoId) {
        if (!videoId) return 'native';
        
        if (videoId.includes('youtube.com') || videoId.includes('youtu.be') || (!videoId.includes('/') && !videoId.includes('.'))) {
            return 'youtube';
        }
        
        if (videoId.includes('cloudinary.com')) {
            return 'cloudinary';
        }
        
        return 'native';
    }

    /**
     * Create a Cloudinary video player.
     * @returns {void}
     */
    _createCloudinaryPlayer() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Add transformations for better streaming
        const transformedUrl = this.videoId.replace('/upload/', '/upload/f_auto:video,q_auto/');

        container.innerHTML = `
            <video id="${this.containerId}-cloudinary" class="video-cloudinary" controls style="width:100%; height:100%; border-radius:var(--radius-lg); overflow:hidden;">
                <source src="${transformedUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;

        this.videoElement = document.getElementById(`${this.containerId}-cloudinary`);
        this.videoElement.onplay = () => this._startTimeTracking();
        this.videoElement.onpause = () => this._stopTimeTracking();
        this.videoElement.onended = () => {
            this._stopTimeTracking();
            if (this.options.onStateChange) this.options.onStateChange({ data: 0 }); // simulate YT.PlayerState.ENDED
        };

        if (this.options.onReady) {
            setTimeout(() => this.options.onReady({ target: this.videoElement }), 100);
        }

        playerInstance = this;
    }

    /**
     * Create a YouTube player instance.
     * @returns {void}
     */
    _createPlayer() {
        this.player = new YT.Player(this.containerId, {
            videoId: this.videoId,
            width: '100%',
            height: '100%',
            playerVars: {
                autoplay: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                controls: 1,
                cc_load_policy: 0,
                iv_load_policy: 3
            },
            events: {
                onReady: (e) => this._onReady(e),
                onStateChange: (e) => this._onStateChange(e)
            }
        });

        playerInstance = this;
    }

    /**
     * Handle player ready event.
     * @param {object} event
     * @returns {void}
     */
    _onReady(event) {
        if (this.options.onReady) {
            this.options.onReady(event);
        }
    }

    /**
     * Handle player state change.
     * @param {object} event
     * @returns {void}
     */
    _onStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this._startTimeTracking();
        } else {
            this._stopTimeTracking();
        }

        if (this.options.onStateChange) {
            this.options.onStateChange(event);
        }
    }

    /**
     * Start time tracking callback and sync.
     * @returns {void}
     */
    _startTimeTracking() {
        this._stopTimeTracking();
        
        // Track time updates (UI updates every second)
        this._timeInterval = setInterval(() => {
            if (this.onTimeUpdate) {
                const time = this.getCurrentTime();
                this.onTimeUpdate(time);
            }
        }, 1000);

        // Sync to Firestore every 15 seconds (throttled)
        this._syncInterval = setInterval(() => {
            if (this.courseId && this.lessonId) {
                const currentTime = this.getCurrentTime();
                const duration = this.getDuration();
                progressSyncService.syncVideoTimestamp(
                    this.courseId,
                    this.lessonId,
                    currentTime,
                    duration
                );
            }
        }, 15000);
    }

    /**
     * Stop time tracking callback and sync.
     * @returns {void}
     */
    _stopTimeTracking() {
        if (this._timeInterval) {
            clearInterval(this._timeInterval);
            this._timeInterval = null;
        }
        if (this._syncInterval) {
            clearInterval(this._syncInterval);
            this._syncInterval = null;
        }
    }

    /**
     * Get current playback time in seconds.
     * @returns {number}
     */
    getCurrentTime() {
        if (this.videoElement) return this.videoElement.currentTime;
        return this.player ? (this.player.getCurrentTime ? this.player.getCurrentTime() : 0) : 0;
    }

    /**
     * Get video duration in seconds.
     * @returns {number}
     */
    getDuration() {
        if (this.videoElement) return this.videoElement.duration;
        return this.player ? (this.player.getDuration ? this.player.getDuration() : 0) : 0;
    }

    /**
     * Seek to time in seconds.
     * @param {number} seconds
     * @returns {void}
     */
    seekTo(seconds) {
        if (this.videoElement) {
            this.videoElement.currentTime = seconds;
        } else if (this.player && this.player.seekTo) {
            this.player.seekTo(seconds, true);
        }
    }

    /**
     * Play the video.
     * @returns {void}
     */
    play() {
        if (this.videoElement) this.videoElement.play();
        else if (this.player && this.player.playVideo) this.player.playVideo();
    }

    /**
     * Pause the video.
     * @returns {void}
     */
    pause() {
        if (this.videoElement) this.videoElement.pause();
        else if (this.player && this.player.pauseVideo) this.player.pauseVideo();
    }

    /**
     * Destroy the player instance and force sync final state.
     * @returns {void}
     */
    async destroy() {
        this._stopTimeTracking();
        
        // Force final sync before destroying
        if (this.courseId && this.lessonId) {
            const currentTime = this.getCurrentTime();
            const duration = this.getDuration();
            await progressSyncService.syncVideoTimestamp(
                this.courseId,
                this.lessonId,
                currentTime,
                duration
            );
        }
        
        if (this.videoElement) {
            this.videoElement.onplay = null;
            this.videoElement.onpause = null;
            this.videoElement.onended = null;
            this.videoElement.src = "";
            this.videoElement.load();
            this.videoElement.remove();
            this.videoElement = null;
        }
        if (this.player && this.player.destroy) {
            this.player.destroy();
            this.player = null;
        }
        playerInstance = null;
    }
}

/**
 * Get current player instance.
 * @returns {VideoPlayer|null}
 */
export function getCurrentPlayer() {
    return playerInstance;
}
