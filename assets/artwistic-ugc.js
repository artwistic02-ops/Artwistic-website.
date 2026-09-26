/**
 * ARTWISTIC UGC MARQUEE — tunes each track's animation-duration to its
 * real rendered width, so a longer real photo set keeps the same
 * visual speed as a short one instead of a fixed duration reading too
 * fast/slow depending on content count. Pause-on-hover and the
 * reduced-motion fallback are pure CSS (assets/artwistic-ugc.css).
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PIXELS_PER_SECOND = 42;

  document.querySelectorAll('[data-aw-ugc-track]').forEach(function (track) {
    var oneCopyWidth = track.scrollWidth / 3;
    if (!oneCopyWidth) return;
    var duration = Math.max(oneCopyWidth / PIXELS_PER_SECOND, 12);
    track.style.animationDuration = duration + 's';
  });
})();
