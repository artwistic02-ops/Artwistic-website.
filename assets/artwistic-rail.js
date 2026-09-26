/**
 * ARTWISTIC RAIL — shared prev/next-arrow wiring for any horizontally
 * scrolling `.aw-rail-shell` (Reels, Reviews, and any future module using
 * the same markup pattern from artwistic-global.css). Purely scrolls the
 * real DOM list; no virtual carousel state.
 */
(function () {
  'use strict';

  document.querySelectorAll('.aw-rail-shell').forEach(function (shell) {
    var rail = shell.querySelector('[data-aw-rail]');
    var prevButton = shell.querySelector('[data-aw-rail-prev]');
    var nextButton = shell.querySelector('[data-aw-rail-next]');
    if (!rail) return;

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        rail.scrollBy({ left: -rail.clientWidth * 0.85, behavior: 'smooth' });
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function () {
        rail.scrollBy({ left: rail.clientWidth * 0.85, behavior: 'smooth' });
      });
    }

    function updateArrows() {
      var atStart = rail.scrollLeft <= 4;
      var atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      if (prevButton) prevButton.disabled = atStart;
      if (nextButton) nextButton.disabled = atEnd;
    }

    rail.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    updateArrows();
  });
})();
