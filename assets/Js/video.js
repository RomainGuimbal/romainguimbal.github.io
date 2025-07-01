const video = document.getElementsByClassName('video');
const playPauseBtn = document.getElementById('playPauseBtn');
const videoContainer = document.getElementById('videoContainer');
const backdrop = document.getElementById('backdrop');
const playIcon = playPauseBtn.querySelector('div');
let isFullscreen = false;

// Toggle play/pause
function togglePlayPause() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

// Toggle fullscreen mode
function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
        videoContainer.classList.add('fullscreen');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        videoContainer.classList.remove('fullscreen');
        backdrop.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Update button appearance
function updateButton() {
    if (video.paused) {
        playIcon.className = 'play-icon';
        videoContainer.classList.remove('playing');
    } else {
        playIcon.className = 'pause-icon';
        videoContainer.classList.add('playing');
    }
}

// Single click handler
let clickTimeout;
function handleVideoClick(e) {
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        togglePlayPause();
    }, 200);
}

// Double click handler
function handleVideoDoubleClick(e) {
    clearTimeout(clickTimeout);
    toggleFullscreen();
}

// Event listeners
playPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
});

video.addEventListener('click', handleVideoClick);
video.addEventListener('dblclick', handleVideoDoubleClick);
video.addEventListener('play', updateButton);
video.addEventListener('pause', updateButton);

// Exit fullscreen when clicking backdrop
backdrop.addEventListener('click', () => {
    if (isFullscreen) {
        toggleFullscreen();
    }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    } else if (e.code === 'Escape' && isFullscreen) {
        toggleFullscreen();
    } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
    }
});

// Make video focusable for keyboard support
video.setAttribute('tabindex', '0');

// Initialize button state
updateButton();