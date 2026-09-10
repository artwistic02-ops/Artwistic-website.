/**
 * ARTWISTIC PRODUCT GALLERY — mobile swipe progress indicator.
 *
 * Purely additive: overlays a thin segmented progress bar (the same visual
 * shorthand Instagram/TikTok Stories use) on top of Dawn's stock media
 * gallery, synced to its own native `slideChanged` event from
 * slider-component (assets/global.js). Does not touch swipe, zoom, video,
 * or 3D-model behavior — those stay exactly as Dawn built them. Only runs
 * on products with more than one media item (see sections/main-product.liquid).
 */
(function () {
  'use strict';

  function setUpGallery(gallery) {
    var viewer = gallery.querySelector('[id^="GalleryViewer"]');
    if (!viewer) return;

    var slides = viewer.querySelectorAll('[id^="Slide-"]');
    if (slides.length < 2) return;

    var bar = document.createElement('div');
    bar.className = 'aw-gallery-progress';
    bar.setAttribute('aria-hidden', 'true');
    slides.forEach(function () {
      var seg = document.createElement('span');
      seg.className = 'aw-gallery-progress__seg';
      bar.appendChild(seg);
    });

    gallery.classList.add('aw-gallery-progress-host');
    gallery.prepend(bar);

    var segments = bar.querySelectorAll('.aw-gallery-progress__seg');
    function paint(index) {
      segments.forEach(function (seg, i) {
        seg.classList.toggle('is-done', i <= index);
      });
    }
    paint(0);

    viewer.addEventListener('slideChanged', function (event) {
      var page = event.detail && event.detail.currentPage;
      if (typeof page === 'number') paint(page - 1);
    });
  }

  document.querySelectorAll('media-gallery').forEach(setUpGallery);
})();
