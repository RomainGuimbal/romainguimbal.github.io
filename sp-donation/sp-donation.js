import { fetchCollectiveBalance } from "./get_project_balance.js";

// Animate progress bar on load
window.addEventListener('load', () => {
    const progressFill = document.getElementById('progress-fill');
    const miniBarFill = document.getElementById('miniBarFill');
    progressFill.style.width = '0%';
    miniBarFill.style.width = '0%';
});

fetchCollectiveBalance('surfacepsycho').then(result => {
    if (result) {
        // Use the formatted amount for display, raw amount for math
        const amount = result.amount;
        const formattedAmount = result.formattedAmount;
        const percent = Math.min((amount / 20000) * 100, 100);
        document.getElementById('balance-amount').textContent = `${formattedAmount} €`;
        document.getElementById('balance-label').innerHTML =
            `<span id='balance-amount'>${formattedAmount} €</span><span class="progress-total">/ 20 000 €</span>`;
        const progressFill = document.getElementById('progress-fill');
        const miniBarFill = document.getElementById('miniBarFill');
        setTimeout(() => {
            progressFill.style.transition = 'width 2s ease-out';
            progressFill.style.width = percent + '%';
            miniBarFill.style.transition = 'width 2s ease-out';
            miniBarFill.style.width = percent + '%';
        }, 500);
    }
});



// Touch hover emulation for mobile devices
function enableTouchHover(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
        // Add .touch-hover on touchstart (finger down)
        el.addEventListener('touchstart', function (e) {
            document.querySelectorAll(selector).forEach(function (other) {
                if (other !== el) other.classList.remove('touch-hover');
            });
            el.classList.add('touch-hover');
        });
        // Remove .touch-hover on touchend (finger up)
        el.addEventListener('touchend', function (e) {
            el.classList.remove('touch-hover');
        });
        // Remove .touch-hover if finger leaves the element
        el.addEventListener('touchcancel', function (e) {
            el.classList.remove('touch-hover');
        });
    });
    // Remove .touch-hover from all when touching anywhere else
    document.addEventListener('touchstart', function (e) {
        document.querySelectorAll(selector).forEach(function (el) {
            if (!el.contains(e.target)) {
                el.classList.remove('touch-hover');
            }
        });
    });
}
enableTouchHover('.donate-button');
enableTouchHover('.link-frame');



// Expanding Panel
const menuButton = document.getElementById('menuButton');
const panelContainer = document.getElementById('panelContainer');
const panelContent = document.getElementById('panelContent');

let isMenuOpen = false;

function openMenu() {
    panelContent.classList.remove('hidden');
    panelContainer.classList.add('expand-width');
    setTimeout(() => {
        panelContainer.classList.add('expand-height');
        setTimeout(() => {
            isMenuOpen = true;
        }, 700);
    }, 300);

}

function closeMenu() {
    panelContainer.classList.remove('expand-height');
    panelContainer.classList.add('retract-height');
    setTimeout(() => {
        panelContainer.classList.remove('expand-width', 'retract-height');
        panelContainer.classList.add('retract-width');
        setTimeout(() => {
            panelContainer.classList.remove('retract-width');
            panelContent.classList.add('hidden');
            isMenuOpen = false;
        }, 300);
    }, 700);
}

function toggleMenu() {
    if (!isMenuOpen) {
        openMenu();
    } else {
        closeMenu();
    }
}

let isScrolling = false;

function handleScroll(event) {
    if (isScrolling) return;
    
    isScrolling = true;
    setTimeout(() => { isScrolling = false; }, 1000); // Cooldown period

    if (event.deltaY > 0 && !isMenuOpen) {
        openMenu();
    } else if (event.deltaY < 0 && isMenuOpen) {
        closeMenu();
    }
}

// Event listeners
menuButton.addEventListener('click', toggleMenu);
window.addEventListener('wheel', handleScroll, false);

// Add click outside listener
document.addEventListener('click', function(event) {
    if (isMenuOpen && 
        !panelContainer.contains(event.target) && 
        !menuButton.contains(event.target)) {
        closeMenu();
    }
});