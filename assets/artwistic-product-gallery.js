/**
 * ARTWISTIC PRODUCT GALLERY — mobile "stories" progress bar + autoplay.
 *
 * Purely a layer on top of Dawn's real gallery slider
 * (snippets/product-media-gallery.liquid, custom element
 * `slider-component` in assets/global.js). It does not reimplement
 * swipe/keyboard/thumbnail logic — swipe-to-change-slide on mobile is
 * already native to Dawn's slider (a horizontal scroll-snap container),
 * so nothing extra is needed there.
 *
 * Autoplay reuses Dawn's own real slide navigation: every tick, it
 * clicks the slider's actual "next" button (the same element the
 * on-screen arrow uses) rather than recomputing scroll positions
 * itself. Looping is enabled by setting the slider-component instance's
 * own `enableSliderLooping` flag — the same flag Dawn's native
 * `slideshow-component` (homepage hero, announcement bar) sets on
 * itself for exactly this purpose — so the "next" button never
 * disables at the last slide.
 */
(function () {
  'use strict';

  var AUTOPLAY_MS = 5000;

  function buildProgressBar(wrapper, viewer, totalSlides) {
    var host = document.createElement('div');
    host.className = 'aw-gallery-progress';
    host.setAttribute('aria-hidden', 'true');

    var segments = [];
    for (var i = 0; i < totalSlides; i++) {
      var segment = document.createElement('span');
      segment.className = 'aw-gallery-progress__seg';
      host.appendChild(segment);
      segments.push(segment);
    }

    wrapper.classList.add('aw-gallery-progress-host');
    wrapper.insertBefore(host, wrapper.firstChild);

    function setActive(pageNumber) {
      var index = pageNumber - 1;
      segments.forEach(function (segment, i) {
        segment.classList.toggle('is-done', i <= index);
      });
    }

    setActive(1);

    viewer.addEventListener('slideChanged', function (event) {
      if (event.detail && event.detail.currentPage) {
        setActive(event.detail.currentPage);
      }
    });
  }

  function enableAutoplay(wrapper, viewer) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!viewer.nextButton) return;

    // Dawn's `enableSliderLooping` flag only stops slider-component's own
    // update() from marking the next/prev buttons disabled at the ends —
    // real wraparound scrolling is implemented separately, only in
    // Dawn's slideshow-component (a different custom element, for the
    // homepage hero/announcement bar). Plain slider-component (what the
    // product gallery uses) has no built-in loop-back, so clicking
    // "next" at the last slide just scrolls to its own max and stops
    // there for good — that's why autoplay used to advance a few times
    // then permanently stall. Implement the wraparound ourselves instead
    // of clicking the button: step forward normally, or jump back to
    // scrollLeft 0 once we're on the last slide.
    viewer.enableSliderLooping = true;

    var timer = null;

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      timer = setInterval(function () {
        var total = viewer.sliderItemsToShow ? viewer.sliderItemsToShow.length : 0;
        if (!total) return;
        if (viewer.currentPage >= total) {
          viewer.setSlidePosition(0);
        } else {
          viewer.setSlidePosition(viewer.slider.scrollLeft + viewer.sliderItemOffset);
        }
      }, AUTOPLAY_MS);
    }

    // Pause while the pointer is over the image (desktop hover); resume
    // on leave. Touch devices don't fire mouseenter on swipe, so this
    // doesn't interfere with the native mobile swipe gesture.
    wrapper.addEventListener('mouseenter', stop);
    wrapper.addEventListener('mouseleave', start);
    // Also pause on keyboard focus inside the gallery, matching Dawn's
    // own slideshow autoplay behavior for accessibility.
    wrapper.addEventListener('focusin', stop);
    wrapper.addEventListener('focusout', start);

    // Give a full AUTOPLAY_MS after *any* slide change (auto or a
    // manual swipe/thumbnail click) before advancing again.
    viewer.addEventListener('slideChanged', start);

    start();
  }

  // The video lives only in the floating video bubble, never as a
  // gallery/thumbnail/modal slide. The main slider and the fullscreen
  // modal both wrap video in Dawn's own <deferred-media> element, so
  // hiding by that is reliable there (also covered by CSS
  // :has(deferred-media) in artwistic-product-gallery.css — this is a
  // belt-and-suspenders backup in case that file is cached stale).
  //
  // The thumbnail rail is different: it's Dawn's own plain markup
  // (snippets/product-media-gallery.liquid), a <li data-target="...">
  // with a bare <img>, no <deferred-media> at all — so it can't be
  // matched the same way. Dawn already links each thumbnail to its main
  // slide via that data-target, which equals the slide's own id minus
  // its "Slide-" prefix, so once we know which slides are video we can
  // find their matching thumbnails through that link.
  var hiddenSlideTargets = [];
  document.querySelectorAll('.product__media-item').forEach(function (item) {
    if (item.querySelector('deferred-media')) {
      item.style.display = 'none';
      if (item.id) hiddenSlideTargets.push(item.id.replace(/^Slide-/, ''));
    }
  });
  document.querySelectorAll('.thumbnail-list__item').forEach(function (li) {
    var target = li.getAttribute('data-target');
    if (target && hiddenSlideTargets.indexOf(target) !== -1) {
      li.style.display = 'none';
    }
  });
  document.querySelectorAll('.product-media-modal__content > deferred-media').forEach(function (el) {
    el.style.display = 'none';
  });

  document.querySelectorAll('.product__media-wrapper').forEach(function (wrapper) {
    var viewer = wrapper.querySelector('slider-component[id^="GalleryViewer-"]');
    if (!viewer) return;
    // Video slides are hidden above (and via CSS) — exclude them here
    // too so the progress dots and autoplay never count/land on one.
    var slides = viewer.querySelectorAll('.slider__slide:not(:has(deferred-media))');
    if (slides.length > 1) {
      buildProgressBar(wrapper, viewer, slides.length);
      enableAutoplay(wrapper, viewer);
    }
  });
})();
