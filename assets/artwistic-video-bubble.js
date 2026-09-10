/**
 * ARTWISTIC VIDEO BUBBLE — click to expand the persistent product-gallery
 * video bubble in place, unmute and play; click again (or the close
 * button, or the backdrop) to collapse it back to a muted ambient loop.
 * See snippets/artwistic-video-bubble.liquid, assets/artwistic-video-bubble.css.
 */
(function () {
  'use strict';

  document.querySelectorAll('[data-aw-video-bubble]').forEach(function (bubble) {
    var video = bubble.querySelector('.aw-video-bubble__video');
    var muteIcon = bubble.querySelector('[data-aw-video-bubble-mute]');
    var mutedIcon = muteIcon ? muteIcon.querySelector('.aw-video-bubble__icon-muted') : null;
    var unmutedIcon = muteIcon ? muteIcon.querySelector('.aw-video-bubble__icon-unmuted') : null;
    var closeButton = bubble.querySelector('[data-aw-video-bubble-close]');
    var backdrop = bubble.nextElementSibling;
    if (!backdrop || !backdrop.hasAttribute('data-aw-video-backdrop')) backdrop = null;

    function open() {
      bubble.classList.add('is-open');
      bubble.setAttribute('aria-expanded', 'true');
      if (backdrop) {
        backdrop.hidden = false;
        backdrop.classList.add('is-visible');
      }
      if (video) {
        video.muted = false;
        video.play().catch(function () {
          /* Autoplay-with-sound blocked — the visible play control still lets the visitor start it. */
        });
        if (mutedIcon) mutedIcon.hidden = true;
        if (unmutedIcon) unmutedIcon.hidden = false;
      }
    }

    function close() {
      bubble.classList.remove('is-open');
      bubble.setAttribute('aria-expanded', 'false');
      if (backdrop) {
        backdrop.classList.remove('is-visible');
        backdrop.hidden = true;
      }
      if (video) {
        video.muted = true;
        if (mutedIcon) mutedIcon.hidden = false;
        if (unmutedIcon) unmutedIcon.hidden = true;
      }
    }

    bubble.addEventListener('click', function (event) {
      if (closeButton && closeButton.contains(event.target)) {
        event.preventDefault();
        close();
        return;
      }
      if (bubble.classList.contains('is-open')) return;
      open();
    });

    if (backdrop) {
      backdrop.addEventListener('click', close);
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && bubble.classList.contains('is-open')) close();
    });

    if (video) {
      video.play().catch(function () {
        /* Muted ambient autoplay blocked by the browser — the poster frame still shows. */
      });
    }
  });
})();
