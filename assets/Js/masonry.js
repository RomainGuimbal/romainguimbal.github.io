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

    // console.info('masonry: DOMContentLoaded');

    if (!grid) {
        console.error('masonry: .masonry-grid element not found — aborting Masonry init');
        return;
    }

    // Use imagesLoaded instance so we can trace progress and final events
    const imgLoad = imagesLoaded(grid);
    
    imgLoad.on('always', function() {
        console.info('masonry: imagesLoaded finished — initializing Masonry');

        msnry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: getColumnWidth(),
            gutter: getGutterSize(),
            fitWidth: true,
            transitionDuration: '0.3s'
        });

        // Force an initial layout and log when layout completes
        if (msnry) {
            msnry.on('layoutComplete', function(items) {
                console.info(`masonry: layoutComplete — ${items.length} items laid out`);

                // Log any items with zero or near-zero height (likely culprits)
                items.forEach(function(item) {
                    const h = item.element.getBoundingClientRect().height;
                    if (h < 10) {
                        console.warn('masonry: zero-height grid-item detected:', item.element, 'height =', h);
                    }
                });

                grid.classList.add('masonry-loaded');
                const preloader = document.getElementById('masonry-preloader');
                if (preloader) preloader.classList.add('hidden');
            });

            try {
                msnry.layout();
            } catch (e) {
                console.error('masonry: error calling msnry.layout():', e);
            }
        }

        // Add layout refresh after each individual image loads
        grid.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', refreshMasonryLayout);
        });

        // Watch video elements — they start with no src so the browser
        // measures them asynchronously after aspect-ratio CSS kicks in.
        // Re-trigger layout whenever a video element is resized.
        if (typeof ResizeObserver !== 'undefined') {
            const videoObserver = new ResizeObserver(function(entries) {
                let needsLayout = false;
                entries.forEach(function(entry) {
                    if (entry.contentRect.height > 0) {
                        needsLayout = true;
                        console.info('masonry: video resized to', entry.contentRect.width.toFixed(0), 'x', entry.contentRect.height.toFixed(0), '— scheduling relayout');
                    }
                });
                if (needsLayout) refreshMasonryLayout();
            });

            grid.querySelectorAll('.video-container video').forEach(function(video) {
                videoObserver.observe(video);
            });
        } else {
            // Fallback: re-layout after a short delay to let the browser paint
            setTimeout(refreshMasonryLayout, 200);
            setTimeout(refreshMasonryLayout, 600);
        }
    });
    
    // Multi-image logic for .grid-item.project
    document.querySelectorAll('.grid-item.project').forEach(function(item) {
        const multiImage = item.querySelector('.multi-image');
        const dots = item.querySelectorAll('.image-dot');
        if (multiImage && dots.length > 0) {
            
            // Get all image links, video containers, and note cards
            const imageLinks = Array.from(multiImage.children).filter(child =>
                (child.classList.contains('media-wrap') || 
                child.classList.contains('note-card'))
            );

            // Add dots click handler
            dots.forEach(function(dot, idx) {
                dot.addEventListener('click', function() {
                    updateActiveImage(imageLinks, dots, idx);
                    add_or_remove_nav_arrows(multiImage);
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
    const $links = $(multiImage).find('.media-wrap, .note-card');
    const $active = $links.filter('.active');
    const idx = $links.index($active);
    const dots = $(multiImage).closest('.grid-item').find('.image-dot');

    if ($(arrowBtn).hasClass('prev') && idx > 0) {
        updateActiveImage($links.toArray(), dots.toArray(), idx-1);
    } else if ($(arrowBtn).hasClass('next') && idx < $links.length - 1) {
        updateActiveImage($links.toArray(), dots.toArray(), idx+1);
    }

    add_or_remove_nav_arrows(multiImage);
}

function add_or_remove_nav_arrows(multiImage) {
    const $links = $(multiImage).find('.media-wrap, .note-card');
    const $active = $links.filter('.active');
    const idx = $links.index($active);
    if (idx > 0 && $(multiImage).find('.nav-arrow.prev').length === 0) {
        $(multiImage).append('<button class="nav-arrow prev">&#60;</button>');
    }
    if (idx < $links.length - 1 && $(multiImage).find('.nav-arrow.next').length === 0) {
        $(multiImage).append('<button class="nav-arrow next">&#62</button>');
    }

    if (idx === 0) {
        $(multiImage).find('.nav-arrow.prev').remove();
    }
    if (idx === $links.length - 1) {
        $(multiImage).find('.nav-arrow.next').remove();
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