// Lapin donate animation logic
const lapin = document.getElementById('lapin-donate');
let lapinTimeout = null;
let lapinIsFullyUp = false;

function clearLapinClasses() {
    lapin.classList.remove('partial-rise');
    lapin.classList.remove('full-rise');
    lapinIsFullyUp = false;
}

function showLapinPartial() {
    clearLapinClasses();
    lapin.classList.add('partial-rise');
    if (lapinTimeout) clearTimeout(lapinTimeout);
    lapinTimeout = setTimeout(() => {
        lapin.classList.remove('partial-rise');
    }, 2500);
}

function showLapinFull() {
    clearLapinClasses();
    lapin.classList.add('full-rise');
    if (lapinTimeout) clearTimeout(lapinTimeout);
    lapinIsFullyUp = false;
    // Wait for the CSS transition to finish before allowing "down"
    setTimeout(() => {
        lapinIsFullyUp = true;
    }, 1200); // match the CSS transition duration
    lapinTimeout = setTimeout(() => {
        lapin.classList.remove('full-rise');
        lapinTimeout = null;
        lapinIsFullyUp = false;
    }, 4000);
}

// Show partial rise every 15s
setInterval(showLapinPartial, 15000);
// Show partial rise on page load
setTimeout(showLapinPartial, 1000);

// Show full rise on click/touch/hover
lapin.addEventListener('click', function(e) {
    // Only allow to animate down if lapin is fully up (not animating)
    if (lapin.classList.contains('full-rise') && lapinIsFullyUp) {
        lapin.classList.remove('full-rise');
        lapinIsFullyUp = false;
        if (lapinTimeout) clearTimeout(lapinTimeout);
        lapinTimeout = null;
    } else if (!lapin.classList.contains('full-rise')) {
        showLapinFull();
    }
});
lapin.addEventListener('touchstart', function(e) {
    if (lapin.classList.contains('full-rise') && lapinIsFullyUp) {
        lapin.classList.remove('full-rise');
        lapinIsFullyUp = false;
        if (lapinTimeout) clearTimeout(lapinTimeout);
        lapinTimeout = null;
    } else if (!lapin.classList.contains('full-rise')) {
        showLapinFull();
    }
});
// lapin.addEventListener('mouseenter', showLapinFull);