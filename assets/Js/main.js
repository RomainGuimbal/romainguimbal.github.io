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

$('.with-caption').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    mainClass: 'mfp-with-zoom mfp-img-mobile',
    image: {
        verticalFit: true,
        titleSrc: function(item) {
            return item.el.attr('title') + ' &middot; <a class="image-source-link" href="'+item.el.attr('data-source')+'" target="_blank">image source</a>';
        }
    },
    zoom: {
        enabled: true
    },
    gallery: {
        enabled: true,
        tPrev: '@T("Media.MagnificPopup.Previous")',
        tNext: '@T("Media.MagnificPopup.Next")',
    },
    tClose: '@T("Media.MagnificPopup.Close")',
    tLoading: '@T("Media.MagnificPopup.Loading")'
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