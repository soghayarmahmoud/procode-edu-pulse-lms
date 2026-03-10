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
        this.onTimeUpdate = options.onTimeUpdate || null;
        this._timeInterval = null;

        loadYTAPI();

        if (apiReady) {
            this._createPlayer();
        } else {
            onReadyCallbacks.push(() => this._createPlayer());
        }
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
            if (this.onTimeUpdate && this.player) {
                const time = this.player.getCurrentTime();
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
        return this.player ? this.player.getCurrentTime() : 0;
    }

    seekTo(seconds) {
        if (this.player) {
            this.player.seekTo(seconds, true);
        }
    }

    play() {
        if (this.player) this.player.playVideo();
    }

    pause() {
        if (this.player) this.player.pauseVideo();
    }

    destroy() {
        this._stopTimeTracking();
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        playerInstance = null;
    }
}

export function getCurrentPlayer() {
    return playerInstance;
}
