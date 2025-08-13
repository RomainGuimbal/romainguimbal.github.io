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
                let $links = $multiImage.find('a.image-link');
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


function toggleTag(element) {
    if (element.classList.contains("enabled")) {
        element.classList.remove("enabled");
    } else {
        element.classList.add("enabled");
    }
}