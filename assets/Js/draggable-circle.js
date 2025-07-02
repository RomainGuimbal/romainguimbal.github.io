class DraggableCircle {
    constructor(element) {
        this.element = element;
        this.menu = element.querySelector('.circle-menu');
        this.isDragging = false;
        this.isMenuOpen = false;
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.dragThreshold = 5; // Minimum distance to consider it a drag
        this.clickStartTime = 0;
        this.clickThreshold = 200; // Maximum time for a click (ms)
        
        // Set initial position (top-right corner)
        this.setPosition(30, 30);
        
        this.init();
    }
    
    init() {
        // Mouse events
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Click outside to close menu
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        
        // Prevent default drag behavior
        this.element.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    setPosition(x, y) {
        // Keep within viewport bounds
        const rect = this.element.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width/2;
        const maxY = window.innerHeight - rect.height/2;
        
        x = Math.max(- rect.width/2, Math.min(x, maxX));
        y = Math.max(- rect.height/2, Math.min(y, maxY));
        
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
    }
    
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menu.classList.toggle('active', this.isMenuOpen);
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        this.menu.classList.remove('active');
    }
    
    handleOutsideClick(e) {
        if (!this.element.contains(e.target)) {
            this.closeMenu();
        }
    }
    
    handleMouseDown(e) {
        // Prevent menu clicks from triggering drag
        if (e.target.closest('.circle-menu')) {
            return;
        }
        this.startDrag(e.clientX, e.clientY);
    }
    
    handleTouchStart(e) {
        // Prevent menu clicks from triggering drag
        if (e.target.closest('.circle-menu')) {
            return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY);
    }
    
    startDrag(clientX, clientY) {
        this.clickStartTime = Date.now();
        this.isDragging = false; // Will be set to true only if dragging threshold is exceeded
        
        const rect = this.element.getBoundingClientRect();
        this.offsetX = clientX - rect.left;
        this.offsetY = clientY - rect.top;
        
        this.startX = clientX;
        this.startY = clientY;
    }
    
    handleMouseMove(e) {
        if (this.clickStartTime > 0) {
            const deltaX = Math.abs(e.clientX - this.startX);
            const deltaY = Math.abs(e.clientY - this.startY);
            
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.element.classList.add('dragging');
                    this.closeMenu(); // Close menu when dragging starts
                }
                this.updatePosition(e.clientX, e.clientY);
            }
        }
    }
    
    handleTouchMove(e) {
        if (this.clickStartTime > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - this.startX);
            const deltaY = Math.abs(touch.clientY - this.startY);
            
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.element.classList.add('dragging');
                    this.closeMenu(); // Close menu when dragging starts
                }
                this.updatePosition(touch.clientX, touch.clientY);
            }
        }
    }
    
    updatePosition(clientX, clientY) {
        const newX = clientX - this.offsetX;
        const newY = clientY - this.offsetY;
        this.setPosition(newX, newY);
    }
    
    handleMouseUp() {
        this.endDrag();
    }
    
    handleTouchEnd() {
        this.endDrag();
    }
    
    endDrag() {
        const clickDuration = Date.now() - this.clickStartTime;
        
        // If it was a quick click and didn't exceed drag threshold, toggle menu
        if (!this.isDragging && clickDuration < this.clickThreshold) {
            this.toggleMenu();
        }
        
        this.isDragging = false;
        this.clickStartTime = 0;
        this.element.classList.remove('dragging');
    }
}

// Initialize the draggable circle
document.addEventListener('DOMContentLoaded', () => {
    const circle = document.getElementById('draggableCircle');
    window.draggableCircleInstance = new DraggableCircle(circle);
});

// Handle menu item clicks
function handleMenuClick(action) {
    console.log('Menu action:', action);
    
    // Close menu after action
    if (window.draggableCircleInstance) {
        window.draggableCircleInstance.closeMenu();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const circle = document.getElementById('draggableCircle');
    const rect = circle.getBoundingClientRect();
    
    // Ensure circle stays within new viewport bounds
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    const currentX = Math.max(0, Math.min(rect.left, maxX));
    const currentY = Math.max(0, Math.min(rect.top, maxY));
    
    circle.style.left = currentX + 'px';
    circle.style.top = currentY + 'px';
});