jQuery(document).ready(function($) {
    $('.slider_thumbnails').on('afterChange', function(event, slick, currentSlide) {
        $('.slick-current').addClass('slick-center-custom');
    });
    $('.slider_thumbnails').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
        $('.slick-slide').removeClass('slick-center-custom');
    });
    
    $('.slider_main').slick({
        // infinite: ,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        asNavFor: '.slider_thumbnails',
        speed: 500,
        fade: true,
        cssEase: 'linear',
        draggable: false
    });
    $('.slider_thumbnails').slick({
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 1,
        arrows: false,
        centerMode: true,
        focusOnSelect: true,
        asNavFor: '.slider_main',
        responsive: [
        {
        breakpoint: 740,
        settings: {
            slidesToShow: 3,
        }
        }
    ]
    });
});