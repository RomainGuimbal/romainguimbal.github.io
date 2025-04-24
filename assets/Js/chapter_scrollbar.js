// Calculate scrollbar width
function getScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.width = '100px';
    outer.style.position = 'absolute';
    outer.style.top = '-9999px';
    document.body.appendChild(outer);
    const width = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
    return width;
}

// Initialize
function init() {

    // Create chapter indicators
    const chapters = document.querySelectorAll('.numero');
    const container = document.querySelector('.chapters-container');
    chapters.forEach((_, i) => {
        const div = document.createElement('div');
        div.className = 'chapter-number';
        div.textContent = i + 1;
        div.addEventListener('click', () => {
            chapters[i].scrollIntoView({ behavior: 'smooth' });
            console.log('Clicked:', i, 
                'Element top:', chapters[i].offsetTop,
                'Current scroll:', window.scrollY);
        });
        container.appendChild(div);
    });

    // Update position function
    function updatePosition() {
        const chapters = document.querySelectorAll('.numero');
        const indicators = document.querySelectorAll('.chapter-number');
        // const scrollY = Math.round(window.scrollY);
        const windowHeight = window.innerHeight;
        
        let activeIndex = 0;
        let closestDistance = Infinity;

        chapters.forEach((chapter, index) => {
            const rect = chapter.getBoundingClientRect();
            const distance = Math.abs(rect.top - windowHeight / 2);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                activeIndex = index;
            }
        });

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === activeIndex);
        });
    }

    // Event listeners
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    updatePosition();
}

// Start initialization when DOM is ready
if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}







