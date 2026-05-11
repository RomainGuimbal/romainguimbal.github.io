// Cursor light follower with requestAnimationFrame for smooth performance
const cursorLight = document.querySelector('.cursor-light');

if (cursorLight) {
    let mouseX = 0;
    let mouseY = 0;
    let rafId = null;

    const updatePosition = () => {
        cursorLight.style.left = mouseX + 'px';
        cursorLight.style.top = mouseY + 'px';
    };

    const scheduleUpdate = () => {
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                updatePosition();
                rafId = null;
            });
        }
    };

    // Mouse movement - only update coordinates, defer DOM update to RAF
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        scheduleUpdate();
    });

    // Touch movement - only update coordinates, defer DOM update to RAF
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            scheduleUpdate();
        }
    }, { passive: true });
}
