/**
 * ARTWISTIC RAIL — shared arrow controls for any horizontally-scrolling
 * rail marked up with the .aw-rail-shell / [data-aw-rail] / [data-aw-rail-prev]
 * / [data-aw-rail-next] pattern (see assets/artwistic-global.css). Scrolls
 * by ~85% of the visible width per click and hides/shows arrows at the
 * scroll extremes. Re-runs on demand via window.ArtwisticRail.init() for
 * rails injected after page load (e.g. cart recommendations fetched
 * asynchronously), and safe to call more than once — already-wired rails
 * are skipped.
 */
(function () {
  'use strict';

  function wireShell(shell) {
    if (shell.dataset.awRailWired) return;
    shell.dataset.awRailWired = 'true';

    var rail = shell.querySelector('[data-aw-rail]');
    var prevBtn = shell.querySelector('[data-aw-rail-prev]');
    var nextBtn = shell.querySelector('[data-aw-rail-next]');
    if (!rail) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        rail.scrollBy({ left: -rail.clientWidth * 0.85, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        rail.scrollBy({ left: rail.clientWidth * 0.85, behavior: 'smooth' });
      });
    }

    function update() {
      var atStart = rail.scrollLeft <= 4;
      var atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;
    }

    rail.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  }

  function init(root) {
    (root || document).querySelectorAll('.aw-rail-shell').forEach(wireShell);
  }

  window.ArtwisticRail = { init: init };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  }
})();
