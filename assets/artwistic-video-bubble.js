/**
 * ARTWISTIC VIDEO BUBBLE.
 *
 * Idle state: a small looping, muted, autoplaying video bubble glued to
 * the corner of the product photo (plain CSS absolute positioning, so it
 * scrolls with the photo like any other overlay).
 *
 * Open state: a FLIP-style transition — measure the bubble's current
 * on-screen rect, pin it to `position: fixed` at those exact pixels (no
 * visual change), then animate to a centered, larger target rect. The
 * element's CSS `position` itself never changes mid-animation, which is
 * what keeps both directions perfectly smooth instead of jumping.
 *
 * No dark backdrop by design — the invisible backdrop element only
 * exists to register an "anywhere else" tap/click to close.
 */
(function () {
  'use strict';

  function init(bubble) {
    var frame = bubble.querySelector('.aw-video-bubble__frame');
    var video = bubble.querySelector('video');
    var muteButton = bubble.querySelector('[data-aw-video-bubble-mute]');
    var mutedIcon = bubble.querySelector('.aw-video-bubble__icon-muted');
    var unmutedIcon = bubble.querySelector('.aw-video-bubble__icon-unmuted');
    var closeButton = bubble.querySelector('[data-aw-video-bubble-close]');
    var backdrop = bubble.parentNode.querySelector('[data-aw-video-backdrop]');
    if (!frame || !backdrop) return;

    // The bubble is rendered as a sibling of the whole gallery (main
    // image + thumbnail rail together) inside .product__media-wrapper.
    // Anchoring it there isn't enough on its own, though: each slide's
    // own .product-media-container (assets/artwistic-product-gallery.css
    // sizes it to the photo's real aspect ratio, "contain"-style) can be
    // narrower than the slide-component column that holds it, centered
    // with empty space on either side — so a CSS "right: 0" anchored to
    // the wider column lands to the right of the visible photo, not on
    // it. Instead, move the bubble to live inside whichever
    // .product-media-container is the *actual visible* one, and re-move
    // it every time the slide changes, so it always hugs that specific
    // photo's own bottom-right corner exactly, however wide it renders.
    var wrapper = bubble.closest('.product__media-wrapper');
    var viewer = wrapper && wrapper.querySelector('slider-component[id^="GalleryViewer-"]');

    function moveBubbleInto(slideItem) {
      var container = slideItem && slideItem.querySelector('.product-media-container');
      if (!container) return;
      container.appendChild(bubble);
      container.appendChild(backdrop);
    }

    if (viewer) {
      var activeItem = viewer.querySelector('.product__media-item.is-active') || viewer.querySelector('.product__media-item');
      moveBubbleInto(activeItem);
      viewer.addEventListener('slideChanged', function (event) {
        if (event.detail && event.detail.currentElement) moveBubbleInto(event.detail.currentElement);
      });
    }

    var isOpen = false;
    var restRect = null;

    function targetRect() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var w = Math.min(vw * 0.7, 320, vw - 32);
      var h = Math.min(vh * 0.72, 540);
      if (h / w > 16 / 9) h = (w * 16) / 9;
      return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h };
    }

    function pin(rect) {
      bubble.style.position = 'fixed';
      bubble.style.margin = '0';
      bubble.style.right = 'auto';
      bubble.style.bottom = 'auto';
      bubble.style.left = rect.left + 'px';
      bubble.style.top = rect.top + 'px';
      bubble.style.width = rect.width + 'px';
      bubble.style.height = rect.height + 'px';
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      restRect = bubble.getBoundingClientRect();
      pin(restRect);
      // eslint-disable-next-line no-unused-expressions
      bubble.offsetHeight;
      bubble.classList.add('is-open');
      backdrop.classList.add('is-visible');
      bubble.setAttribute('aria-expanded', 'true');
      pin(targetRect());
      if (video) {
        // The bubble's video autoplays muted at rest (see
        // artwistic-video-bubble.liquid) so it's already playing here —
        // opening just needs to bring the audio in. The play() call is
        // a safety net only, in case autoplay was ever blocked.
        video.muted = false;
        video.play().catch(function () {});
      }
      if (mutedIcon) mutedIcon.hidden = true;
      if (unmutedIcon) unmutedIcon.hidden = false;
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      var rect = restRect || bubble.getBoundingClientRect();
      pin(rect);
      bubble.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      bubble.setAttribute('aria-expanded', 'false');
      // Mute again but keep playing — the bubble stays a silent,
      // looping attention-getter at rest.
      if (video) video.muted = true;
      if (mutedIcon) mutedIcon.hidden = false;
      if (unmutedIcon) unmutedIcon.hidden = true;

      var done = function () {
        bubble.removeEventListener('transitionend', done);
        if (isOpen) return;
        bubble.style.position = '';
        bubble.style.margin = '';
        bubble.style.left = '';
        bubble.style.top = '';
        bubble.style.right = '';
        bubble.style.bottom = '';
        bubble.style.width = '';
        bubble.style.height = '';
      };
      bubble.addEventListener('transitionend', done);
    }

    bubble.addEventListener('click', function (event) {
      if (event.target === closeButton || (closeButton && closeButton.contains(event.target))) {
        event.stopPropagation();
        close();
        return;
      }
      event.stopPropagation();
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    if (muteButton) {
      muteButton.addEventListener('click', function (event) {
        event.stopPropagation();
        if (!video) return;
        video.muted = !video.muted;
        if (mutedIcon) mutedIcon.hidden = !video.muted;
        if (unmutedIcon) unmutedIcon.hidden = video.muted;
      });
    }

    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
      if (isOpen) pin(targetRect());
    });
  }

  document.querySelectorAll('[data-aw-video-bubble]').forEach(init);
})();
