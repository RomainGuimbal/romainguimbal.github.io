// Cursor light follower with requestAnimationFrame for smooth performance
const cursorLight = document.getElementById('cursor-light');

document.addEventListener('mousemove', (e) => {
  // Convert to percentage for CSS (or use px, but % works better for resize)
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  cursorLight.style.setProperty('--x', x + '%');
  cursorLight.style.setProperty('--y', y + '%');
});

document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth) * 100;
    const y = (touch.clientY / window.innerHeight) * 100;
    cursorLight.style.setProperty('--x', x + '%');
    cursorLight.style.setProperty('--y', y + '%');
  }
}, { passive: true });