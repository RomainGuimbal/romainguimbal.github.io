const pagetitle = document.querySelector('#page-title');
const bg = document.querySelector('#bg-img2');
const maxScroll = 800; // Pixels to scroll for full morph

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const progress = (Math.min(scrollY / maxScroll, 1))**(1/3); // Clamp between 0-1
  
  // Initial values
  const startWidth = 18;
  const startHeight = 10;
  const startBorderRadius = 999;
  const startMarginTop = 0;
  const start_bg = 100;
  
  // Target values
  const targetWidth = 18;
  const targetHeight = 18;
  const targetBorderRadius = 999;
  const targetMarginTop = 2;
  const target_bg = 45;
  
  // Interpolate values
  const currentWidth = startWidth - (startWidth - targetWidth) * progress;
  const currentHeight = startHeight - (startHeight - targetHeight) * progress;
  const currentBorderRadius = startBorderRadius + (targetBorderRadius - startBorderRadius) * progress;
  const currentMarginTop = startMarginTop + (targetMarginTop - startMarginTop) * progress;
  const bg_slide = start_bg + (target_bg - start_bg) * progress;

  // Apply styles
  pagetitle.style.width = `${currentWidth}em`;
  pagetitle.style.height = `${currentHeight}em`;
  pagetitle.style.borderRadius = `${currentBorderRadius}px`;
  pagetitle.style.marginTop = `${currentMarginTop}em`;
  bg.style.transform = `translate(${bg_slide}%,0%)`;
});