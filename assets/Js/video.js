class VideoPlayer {
    constructor(container) {
        this.container = container;
        this.video = container.querySelector('video');
        this.playPauseBtn = container.querySelector('.play-pause-btn');
        this.playIcon = this.playPauseBtn.querySelector('div');
        this.backdrop = document.getElementById('backdrop');
        this.isFullscreen = false;
        this.clickTimeout = null;
        
        this.init();
    }

    init() {
        // Event listeners
        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayPause();
        });
        
        this.video.addEventListener('click', (e) => this.handleVideoClick(e));
        this.video.addEventListener('dblclick', (e) => this.handleVideoDoubleClick(e));
        this.video.addEventListener('play', () => this.updateButton());
        this.video.addEventListener('pause', () => this.updateButton());

        // Make video focusable
        this.video.setAttribute('tabindex', '0');
        
        // Initialize button state
        this.updateButton();
    }

    togglePlayPause() {
        if (this.video.paused) {
            // Pause all other videos first
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
        // Exit fullscreen for any other video
        VideoPlayer.exitAllFullscreen();
        
        this.isFullscreen = true;
        this.container.classList.add('fullscreen');
        this.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set this as the current fullscreen player
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

    handleVideoClick(e) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = setTimeout(() => {
            this.togglePlayPause();
        }, 200);
    }

    handleVideoDoubleClick(e) {
        clearTimeout(this.clickTimeout);
        this.toggleFullscreen();
    }

    // Static methods for managing multiple players
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