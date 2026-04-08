class VideoPlayer {
    constructor(container) {
        this.container = container;
        this.video = container.querySelector('video');
        this.playPauseBtn = container.querySelector('.play-pause-btn');
        this.playIcon = this.playPauseBtn.querySelector('div');
        this.backdrop = document.getElementById('backdrop');
        this.isFullscreen = false;
        this.clickTimeout = null;
        this.isSourceLoaded = false;
        this.thumbnailCaptured = false;
        this.thumbnail = container.querySelector('.video-thumbnail');

        this.init();
        this.setupLazyLoad();
    }

    init() {
        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handlePlayRequest();
        });

        this.video.addEventListener('click', (e) => this.handleVideoClick(e));
        this.video.addEventListener('dblclick', (e) => this.handleVideoDoubleClick(e));
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.updateButton());

        this.video.setAttribute('tabindex', '0');
        this.updateButton();
    }

    // ── Lazy loading ──────────────────────────────────────────────────────────

    setupLazyLoad() {
        if (!this.video.dataset.src) return;

        this.dataSrc = this.video.dataset.src;
        this.dataMime = this.video.dataset.type || 'video/mp4';

        // Begin loading when the container nears the viewport
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadSource();
                    this.observer.disconnect();
                }
            });
        }, { rootMargin: '400px 0px' });

        this.observer.observe(this.container);
    }

    loadSource() {
        if (this.isSourceLoaded) return;
        this.isSourceLoaded = true;
        if (!this.dataSrc) return;

        const source = document.createElement('source');
        source.src = this.dataSrc;
        source.type = this.dataMime;
        this.video.appendChild(source);
        this.video.preload = 'metadata';
        this.video.load();

        // Seek to first frame once metadata is ready, then capture thumbnail
        this.video.addEventListener('loadedmetadata', () => {
            this.video.currentTime = 0.001;
        }, { once: true });

        this.video.addEventListener('seeked', () => {
            if (!this.thumbnailCaptured) {
                this.captureThumbnail();
            }
        }, { once: true });
    }

    // ── Thumbnail capture ─────────────────────────────────────────────────────

    captureThumbnail() {
        if (!this.thumbnail) return;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = this.video.videoWidth || 320;
            canvas.height = this.video.videoHeight || 180;
            canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);

            let img = this.thumbnail.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                this.thumbnail.appendChild(img);
            }
            img.src = canvas.toDataURL('image/jpeg', 0.85);
            this.thumbnailCaptured = true;
            this.thumbnail.classList.remove('loading');
        } catch (e) {
            // Canvas tainted (CORS) or draw failed — keep gradient placeholder
        }
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    handlePlayRequest() {
        if (!this.isSourceLoaded) {
            // Source not yet loaded: load it, then auto-play when ready
            this.loadSource();
            this.video.addEventListener('canplay', () => {
                VideoPlayer.pauseAllOthers(this);
                this.video.play();
            }, { once: true });
        } else {
            this.togglePlayPause();
        }
    }

    togglePlayPause() {
        if (this.video.paused) {
            VideoPlayer.pauseAllOthers(this);
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        VideoPlayer.exitAllFullscreen();

        this.isFullscreen = true;
        this.container.classList.add('fullscreen');
        this.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';

        VideoPlayer.currentFullscreenPlayer = this;
    }

    exitFullscreen() {
        this.isFullscreen = false;
        this.container.classList.remove('fullscreen');
        this.backdrop.classList.remove('active');
        document.body.style.overflow = 'auto';
        VideoPlayer.currentFullscreenPlayer = null;
    }

    updateButton() {
        if (this.video.paused) {
            this.playIcon.className = 'play-icon';
            this.container.classList.remove('playing');
        } else {
            this.playIcon.className = 'pause-icon';
            this.container.classList.add('playing');
        }
    }

    onPlay() {
        this.updateButton();
        // Hide thumbnail permanently once the video starts playing
        if (this.thumbnail) {
            this.thumbnail.classList.add('hidden');
        }
    }

    handleVideoClick(e) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = setTimeout(() => {
            this.handlePlayRequest();
        }, 200);
    }

    handleVideoDoubleClick(e) {
        clearTimeout(this.clickTimeout);
        this.toggleFullscreen();
    }

    // ── Static helpers ────────────────────────────────────────────────────────

    static pauseAllOthers(currentPlayer) {
        VideoPlayer.players.forEach(player => {
            if (player !== currentPlayer && !player.video.paused) {
                player.video.pause();
            }
        });
    }

    static exitAllFullscreen() {
        VideoPlayer.players.forEach(player => {
            if (player.isFullscreen) {
                player.exitFullscreen();
            }
        });
    }
}

// Initialize all video players
VideoPlayer.players = [];
VideoPlayer.currentFullscreenPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    const videoContainers = document.querySelectorAll('.video-container');
    videoContainers.forEach(container => {
        const player = new VideoPlayer(container);
        VideoPlayer.players.push(player);
    });

    // Global event listeners
    const backdrop = document.getElementById('backdrop');
    backdrop.addEventListener('click', () => {
        if (VideoPlayer.currentFullscreenPlayer) {
            VideoPlayer.currentFullscreenPlayer.exitFullscreen();
        }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && VideoPlayer.currentFullscreenPlayer) {
            VideoPlayer.currentFullscreenPlayer.exitFullscreen();
        }
    });
});