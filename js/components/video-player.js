// ============================================
// ProCode EduPulse — YouTube Video Player
// ============================================

let playerInstance = null;
let apiReady = false;
let onReadyCallbacks = [];

// Load YouTube IFrame API
function loadYTAPI() {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

// YouTube API callback
window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    onReadyCallbacks.forEach(cb => cb());
    onReadyCallbacks = [];
};

export class VideoPlayer {
    constructor(containerId, videoId, options = {}) {
        this.containerId = containerId;
        this.videoId = videoId;
        this.options = options;
        this.player = null;
        this.videoElement = null; // for native video
        this.onTimeUpdate = options.onTimeUpdate || null;
        this._timeInterval = null;

        const isUrl = videoId && (videoId.startsWith('http') || videoId.includes('/'));
        
        if (isUrl) {
            this._createNativePlayer();
        } else {
            loadYTAPI();
            if (apiReady) {
                this._createPlayer();
            } else {
                onReadyCallbacks.push(() => this._createPlayer());
            }
        }
    }

    _createNativePlayer() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <video id="${this.containerId}-native" class="video-native" controls style="width:100%; height:100%; border-radius:var(--radius-lg); overflow:hidden;">
                <source src="${this.videoId}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;

        this.videoElement = document.getElementById(`${this.containerId}-native`);
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

    _onReady(event) {
        if (this.options.onReady) {
            this.options.onReady(event);
        }
    }

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

    _startTimeTracking() {
        this._stopTimeTracking();
        this._timeInterval = setInterval(() => {
            if (this.onTimeUpdate) {
                const time = this.getCurrentTime();
                this.onTimeUpdate(time);
            }
        }, 1000);
    }

    _stopTimeTracking() {
        if (this._timeInterval) {
            clearInterval(this._timeInterval);
            this._timeInterval = null;
        }
    }

    getCurrentTime() {
        if (this.videoElement) return this.videoElement.currentTime;
        return this.player ? (this.player.getCurrentTime ? this.player.getCurrentTime() : 0) : 0;
    }

    seekTo(seconds) {
        if (this.videoElement) {
            this.videoElement.currentTime = seconds;
        } else if (this.player && this.player.seekTo) {
            this.player.seekTo(seconds, true);
        }
    }

    play() {
        if (this.videoElement) this.videoElement.play();
        else if (this.player && this.player.playVideo) this.player.playVideo();
    }

    pause() {
        if (this.videoElement) this.videoElement.pause();
        else if (this.player && this.player.pauseVideo) this.player.pauseVideo();
    }

    destroy() {
        this._stopTimeTracking();
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

export function getCurrentPlayer() {
    return playerInstance;
}
