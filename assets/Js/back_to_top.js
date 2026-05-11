// Get the button
const backToTopButton = document.getElementById("backToTop");

// Throttle function to limit scroll event handler calls
function throttle(func, limit) {
    let inThrottle;
    return function() {
        if (!inThrottle) {
            func.apply(this, arguments);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
}

// Throttle scroll event to 100ms intervals (10 times per second max)
window.addEventListener('scroll', throttle(scrollFunction, 100));

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    // For modern browsers
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    
    // For older browsers
    /*
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    */
}