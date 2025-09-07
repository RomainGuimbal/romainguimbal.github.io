$('.without-caption').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
    image: {
        verticalFit: true
    },
    zoom: {
        enabled: true,
        duration: 100 // don't foget to change the duration also in CSS
    },
    gallery: {
        enabled: true,
        tPrev: '@T("Media.MagnificPopup.Previous")',
        tNext: '@T("Media.MagnificPopup.Next")',
    },
    tClose: '@T("Media.MagnificPopup.Close")',
    tLoading: '@T("Media.MagnificPopup.Loading")'
});

// $('.with-caption').magnificPopup({
//     type: 'image',
//     closeOnContentClick: true,
//     closeBtnInside: false,
//     mainClass: 'mfp-with-zoom mfp-img-mobile',
//     image: {
//         verticalFit: true,
//         titleSrc: function(item) {
//             return item.el.attr('title') + ' &middot; <a class="image-source-link" href="'+item.el.attr('data-source')+'" target="_blank">image source</a>';
//         }
//     },
//     zoom: {
//         enabled: true
//     },
//     gallery: {
//         enabled: true,
//         tPrev: '@T("Media.MagnificPopup.Previous")',
//         tNext: '@T("Media.MagnificPopup.Next")',
//     },
//     tClose: '@T("Media.MagnificPopup.Close")',
//     tLoading: '@T("Media.MagnificPopup.Loading")'
// });

$('.video-file-popup').magnificPopup({
    type: 'inline',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    callbacks: {
        elementParse: function(item) {
            item.src = '<video controls autoplay><source src="' + item.el.attr('href') + '" type="video/mp4"></video>';
        }
    }
});

$(document).ready(function(){
    var latest_index = 0;

    $(".numero").each(function(index) {
        latest_index++;
        $(this).text(latest_index+".");
    });
});


$(function(){
    $("#svg_icons").load("assets/icons/icons_svg.html");
});


function closeBanner() {
    const banner = document.getElementById('promoBanner');
    banner.style.transform = 'translateY(-100%)';
    banner.style.transition = 'transform 0.3s ease-out';
    
    setTimeout(() => {
        banner.style.display = 'none';
        document.body.style.marginTop = '0';
    }, 300);
}

// SWIPE SUPPORT FOR MULTI-IMAGE GALLERIES ON MOBILE
$(function() {
    function setupSwipe($multiImage) {
        let startX = null;
        let threshold = 30; // Minimum px distance for swipe

        $multiImage.on('touchstart', function(e) {
            if (e.originalEvent.touches.length === 1) {
                startX = e.originalEvent.touches[0].clientX;
            }
        });

        $multiImage.on('touchend', function(e) {
            if (startX === null) return;
            let endX = e.originalEvent.changedTouches[0].clientX;
            let dx = endX - startX;
            if (Math.abs(dx) > threshold) {
                let $links = $multiImage.find('.image-link, .video-container, .note-card');
                let $active = $links.filter('.active');
                let idx = $links.index($active);
                if (dx < 0 && idx < $links.length - 1) {
                    // Swipe left: next
                    $active.removeClass('active');
                    $links.eq(idx + 1).addClass('active');
                    // Update dots if present
                    let $dots = $multiImage.siblings('.image-dots').find('.image-dot');
                    $dots.removeClass('active');
                    $dots.eq(idx + 1).addClass('active');
                } else if (dx > 0 && idx > 0) {
                    // Swipe right: previous
                    $active.removeClass('active');
                    $links.eq(idx - 1).addClass('active');
                    let $dots = $multiImage.siblings('.image-dots').find('.image-dot');
                    $dots.removeClass('active');
                    $dots.eq(idx - 1).addClass('active');
                }
            }
            startX = null;
        });
    }

    $('.multi-image').each(function() {
        setupSwipe($(this));
    });
});


//############################################
// TAG SYSTEM
//############################################

function toggleTag(element) {

    // Button Display
    if (!element.classList.contains("enabled")) {
        element.classList.add("enabled");
    }  else {
        const allTag = document.getElementById("all");
        allTag.classList.add("enabled");
        element = allTag;
    }

    const allTagItems = document.querySelectorAll('.tag-item');
    
    allTagItems.forEach(item => {
        if (item != element) {
            if (item.classList.contains("enabled")) {
                item.classList.remove("enabled");
            }
        }
        
    });

    // Grid Item Display
    if(element.id === "product"){ 
        filterTag("product");
    } else if(element.id === "graphic"){
        filterTag("graphic");
    // } else if(element.id === "engineering"){
    //     filterTag("engineering");
    } else if(element.id === "rendering"){
        filterTag("rendering");
    } else if(element.id === "programming"){
        filterTag("programming");
    } else if(element.id === "vfx"){
        filterTag("vfx");
    } else if(element.id === "modeling"){
        filterTag("modeling");
    } else if(element.id === "animation") {
        filterTag("animation");
    } else if(element.id === "procedural"){
        filterTag("procedural");
    } else if(element.id === "painting"){
        filterTag("painting");
    } else if(element.id === "all"){
        const allGridItems = document.querySelectorAll('.grid-item');
        allGridItems.forEach(item => {
            // item.style.opacity = '';
            item.style.display = '';
        })
    }

    if (msnry) {
        msnry.layout();
    }
};


function filterTag(tag) {
    const allGridItems = document.querySelectorAll('.grid-item');
    allGridItems.forEach(item => {
        if (!item.classList.contains(tag)) {
            item.style.display = 'none';
            // item.style.opacity = '0.2';
        } else {
            item.style.display = '';
            // item.style.opacity = '';
        }
    })
};



// //############################################
// // VIDEO PLAYER
// //############################################

// document.addEventListener('DOMContentLoaded', function() {
//     const videoContainer = document.querySelector('.video-container');
//     const video = videoContainer.querySelector('video');
//     const thumbnailOverlay = videoContainer.querySelector('.thumbnail-overlay');
//     const playPauseBtn = document.getElementById('playPauseBtn');
//     const loadingIndicator = document.getElementById('loadingIndicator');
//     const resetBtn = document.getElementById('resetBtn');
    
//     let isPlaying = false;
    
//     // Function to play video
//     function playVideo() {
//         loadingIndicator.style.display = 'block';
        
//         // Load the video if it hasn't been loaded yet
//         if (video.readyState === 0) {
//             video.load();
//         }
        
//         const playPromise = video.play();
        
//         if (playPromise !== undefined) {
//             playPromise.then(() => {
//                 // Video played successfully
//                 isPlaying = true;
//                 thumbnailOverlay.style.opacity = '0';
//                 setTimeout(() => {
//                     thumbnailOverlay.style.display = 'none';
//                     video.style.display = 'block';
//                 }, 300);
//                 loadingIndicator.style.display = 'none';
                
//                 // Change button to pause icon
//                 playPauseBtn.innerHTML = '<div class="pause-icon"></div>';
//             }).catch(error => {
//                 // Auto-play was prevented
//                 loadingIndicator.style.display = 'none';
//                 console.log('Playback requires user interaction:', error);
//             });
//         }
//     }
    
//     // Function to pause video
//     function pauseVideo() {
//         video.pause();
//         isPlaying = false;
        
//         // Change button to play icon
//         playPauseBtn.innerHTML = '<div class="play-icon"></div>';
//     }
    
//     // Play/Pause button click handler
//     playPauseBtn.addEventListener('click', function() {
//         if (isPlaying) {
//             pauseVideo();
//         } else {
//             playVideo();
//         }
//     });
    
//     // Video click to play/pause
//     video.addEventListener('click', function() {
//         if (isPlaying) {
//             pauseVideo();
//         } else {
//             playVideo();
//         }
//     });
    
//     // Reset button functionality
//     resetBtn.addEventListener('click', function() {
//         pauseVideo();
//         video.currentTime = 0;
//         thumbnailOverlay.style.display = 'block';
//         setTimeout(() => {
//             thumbnailOverlay.style.opacity = '1';
//         }, 10);
//         video.style.display = 'none';
//     });
    
//     // When video ends, show thumbnail again
//     video.addEventListener('ended', function() {
//         isPlaying = false;
//         playPauseBtn.innerHTML = '<div class="play-icon"></div>';
//         thumbnailOverlay.style.display = 'block';
//         setTimeout(() => {
//             thumbnailOverlay.style.opacity = '1';
//         }, 10);
//         video.style.display = 'none';
//     });
    
//     // Hide native controls until video is playing
//     video.removeAttribute('controls');
    
//     // Show native controls when video starts playing
//     video.addEventListener('play', function() {
//         video.setAttribute('controls', 'true');
//     });
// });