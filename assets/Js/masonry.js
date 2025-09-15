// Initialize Masonry
let msnry;
let refreshTimeout;

// Debounce function to limit the rate of layout updates
function debounce(func, wait) {
    return function() {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => func(), wait);
    }
}

// Refresh Masonry layout
function refreshMasonryLayout() {
    if (msnry) {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            msnry.layout();
        }, 300); // Increased from 100ms to 300ms
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.masonry-grid');
    
    // Initialize Masonry only after ALL images are loaded
    imagesLoaded(grid, function() {
        msnry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: getColumnWidth(),
            gutter: getGutterSize(),
            fitWidth: true,
            transitionDuration: '0.3s'
        });

        // Add layout refresh after each individual image loads
        grid.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', refreshMasonryLayout);
        });
    });
    
    // Multi-image logic for .grid-item.project
    document.querySelectorAll('.grid-item.project').forEach(function(item) {
        const multiImage = item.querySelector('.multi-image');
        const dots = item.querySelectorAll('.image-dot');
        if (multiImage && dots.length > 0) {
            
            // Get all image links, video containers, and note cards
            const imageLinks = Array.from(multiImage.children).filter(child =>
                (child.classList.contains('image-link') || 
                child.classList.contains('video-container') ||
                child.classList.contains('note-card'))
            );

            // Add dots click handler
            dots.forEach(function(dot, idx) {
                dot.addEventListener('click', function() {
                    updateActiveImage(imageLinks, dots, idx);
                });
            });
            
            // Add navigation arrows
            // $(multiImage).append('<button class="nav-arrow prev">&#60;</button>');
            $(multiImage).append('<button class="nav-arrow next">&#62</button>');

            // Handle arrow navigation
            $(multiImage).on('click', '.nav-arrow', function(e) {
                update_image_and_dots_from_nav_arrow(multiImage, e.currentTarget);
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

            // If none active, activate the first
            if (!foundActive && imageLinks.length > 0) {
                imageLinks[0].classList.add('active');
                dots[0]?.classList.add('active');
                imageLinks[0].style.display = '';
            }
        }
    });
});

function updateActiveImage(imageLinks, dots, idx) {
    // Remove active from all
    imageLinks.forEach(a => a.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    const dot = dots[idx];

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
}

function update_image_and_dots_from_nav_arrow(multiImage, arrowBtn) {
    const $links = $(multiImage).find('.image-link, .video-container, .note-card');
    const $active = $links.filter('.active');
    const idx = $links.index($active);
    const dots = $(multiImage).closest('.grid-item').find('.image-dot');
    const dot = dots[idx];

    if ($(arrowBtn).hasClass('prev') && idx > 0) {
        updateActiveImage($links.toArray(), dots.toArray(), idx-1);
        if (idx === 1) {
            $(multiImage).find('.nav-arrow.prev').remove();
        }
        // if (idx === 1) {
        //     $(multiImage).append('<button class="nav-arrow prev">&#60;</button>');
        // }
    } else if ($(arrowBtn).hasClass('next') && idx < $links.length - 1) {
        updateActiveImage($links.toArray(), dots.toArray(), idx+1);
        if (idx === $links.length - 2) {
            $(multiImage).find('.nav-arrow.next').remove();
        }
    }
}


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

// Add this new function before the resize handler
function handleResize() {
    if (msnry) {
        msnry.options.columnWidth = getColumnWidth();
        msnry.options.gutter = getGutterSize();
        refreshMasonryLayout();
    }
}

// Replace all resize handlers with this simpler version
let resizeTimer;
window.addEventListener('resize', () => {
    // Immediately update column width and gutter
    if (msnry) {
        msnry.options.columnWidth = getColumnWidth();
        msnry.options.gutter = getGutterSize();
    }
    
    // Clear the existing timer
    clearTimeout(resizeTimer);
    
    // Set a new timer
    resizeTimer = setTimeout(() => {
        if (msnry) {
            msnry.layout();
        }
    }, 500); // Wait until resize is complete
});