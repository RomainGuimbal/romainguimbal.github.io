// Initialize Masonry
let msnry;

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.masonry-grid');
    imagesLoaded(grid, function() {
        msnry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: getColumnWidth(),
            gutter: getGutterSize(),
            fitWidth: true,
            transitionDuration: '0.3s'
        });
    });

    // Ensure .grid-item.project applies border-radius to videos
    document.querySelectorAll('.grid-item.project').forEach(function(item) {
        // Add border-radius to images and videos inside .grid-item.project
        item.querySelectorAll('img, video').forEach(function(media) {
            media.style.borderRadius = '3px';
        });
    });
    
    // Multi-image logic for .grid-item.project
    document.querySelectorAll('.grid-item.project').forEach(function(item) {
        const multiImage = item.querySelector('.multi-image');
        const dots = item.querySelectorAll('.image-dot');
        if (multiImage && dots.length > 0) {
            const imageLinks = Array.from(multiImage.children).filter(child =>
                (child.classList.contains('image-link') || 
                child.classList.contains('video-container') ||
                child.classList.contains('note-card'))
            );
            dots.forEach(function(dot, idx) {
                dot.addEventListener('click', function() {
                    // Remove active from all
                    imageLinks.forEach(a => a.classList.remove('active'));
                    dots.forEach(d => d.classList.remove('active'));
                    // Show only the active item
                    imageLinks.forEach((a, i) => {
                        if (i === idx) {
                            a.classList.add('active');
                            a.style.display = '';
                        } else {
                            a.style.display = 'none';
                        }
                    });
                    dot.classList.add('active');
                });
            });
            // Ensure only one item is active at start
            let foundActive = false;
            imageLinks.forEach((a, i) => {
                if (a.classList.contains('active')) {
                    foundActive = true;
                    dots[i]?.classList.add('active');
                    a.style.display = '';
                } else {
                    dots[i]?.classList.remove('active');
                    a.style.display = 'none';
                }
            });
            if (!foundActive && imageLinks.length > 0) {
                imageLinks[0].classList.add('active');
                dots[0]?.classList.add('active');
                imageLinks[0].style.display = '';
            }
        }
    });
});

function animateIn(element) {
    setTimeout(() => {
        element.style.transition = 'opacity 0.3s, transform 0.3s';
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }, 100);
}

// Add these functions before the window resize event handler
function getColumnWidth() {
    if (window.innerWidth <= 480) {
        return '.grid-item';
    }
    if (window.innerWidth <= 767) {
        return '.grid-item';
    }
    return 300;
}

function getGutterSize() {
    if (window.innerWidth <= 480) {
        return 10;
    }
    if (window.innerWidth <= 767) {
        return 20;
    }
    return 20;
}

// Handle window resize
window.addEventListener('resize', function() {
    if (msnry) {
        msnry.options.columnWidth = getColumnWidth();
        msnry.options.gutter = getGutterSize();
        msnry.layout();
    }
});