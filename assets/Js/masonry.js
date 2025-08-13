// Initialize Masonry
let msnry;

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.masonry-grid');
    
    msnry = new Masonry(grid, {
        itemSelector: '.grid-item',
        columnWidth: 300,
        gutter: 20,
        fitWidth: true,
        transitionDuration: '0.3s'
    });

    // Ensure .grid-item.project applies border-radius to both images and videos
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
            // Support both <a.without-caption.image-link> and <video> as carousel items
            const imageLinks = Array.from(multiImage.children).filter(child =>
                (child.tagName === 'A' && child.classList.contains('without-caption') && child.classList.contains('image-link')) ||
                child.tagName === 'VIDEO'
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

// Handle window resize
window.addEventListener('resize', function() {
    if (msnry) {
        msnry.layout();
    }
});