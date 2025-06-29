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
    
    // Multi-image logic for .grid-item.project
    document.querySelectorAll('.grid-item.project').forEach(function(item) {
        const multiImage = item.querySelector('.multi-image');
        const dots = item.querySelectorAll('.image-dot');
        if (multiImage && dots.length > 0) {
            // Use <a.without-caption.image-link> as the image containers
            const imageLinks = multiImage.querySelectorAll('a.without-caption.image-link');
            dots.forEach(function(dot, idx) {
                dot.addEventListener('click', function() {
                    // Remove active from all
                    imageLinks.forEach(a => a.classList.remove('active'));
                    dots.forEach(d => d.classList.remove('active'));
                    // Show only the active <a>
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
            // Ensure only one image is active at start
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

// Function to add new items dynamically
function addNewItem() {
    const grid = document.querySelector('.masonry-grid');
    const randomHeight = Math.floor(Math.random() * 200) + 200;
    const randomNum = Math.floor(Math.random() * 1000);
    
    const newItem = document.createElement('div');
    newItem.className = 'grid-item';
    newItem.style.opacity = '0';
    newItem.style.transform = 'scale(0.8)';
    
    const itemTypes = ['image', 'quote', 'wide'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    if (itemType === 'quote') {
        newItem.className += ' tall';
        newItem.innerHTML = `
            <div>
                <h3>Dynamic Quote #${randomNum}</h3>
                <p>"Creativity is intelligence having fun. Every new addition brings fresh perspective."</p>
            </div>
        `;
    } else if (itemType === 'wide') {
        newItem.className += ' wide';
        newItem.innerHTML = `
            <h3>Wide Item #${randomNum}</h3>
            <p>This is a dynamically added wide item to demonstrate the masonry layout's flexibility.</p>
        `;
    } else {
        newItem.innerHTML = `
            <img src="https://picsum.photos/300/${randomHeight}?random=${randomNum}" alt="Random image">
            <div class="content">
                <h3>New Item #${randomNum}</h3>
                <p>This item was added dynamically to showcase how masonry handles new content.</p>
            </div>
        `;
    }
    
    // Add to grid
    grid.appendChild(newItem);
    
    // Wait for image to load if it's an image item
    if (itemType === 'image') {
        const img = newItem.querySelector('img');
        img.onload = function() {
            msnry.appended(newItem);
            animateIn(newItem);
        };
    } else {
        msnry.appended(newItem);
        animateIn(newItem);
    }
}

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