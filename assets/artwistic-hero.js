/**
 * ARTWISTIC HERO — mobile scroll-parallax on the overlay hero.
 * Pure presentation: reads scroll position, writes a transform/opacity
 * to the already-rendered media/text elements. Never touches slide
 * content, settings, or the slider's own autoplay/swipe logic.
 * Disabled entirely under prefers-reduced-motion, and inert above the
 * 749px breakpoint where the mobile overlay layout doesn't apply.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var mobileQuery = window.matchMedia('(max-width: 749px)');
  var heroes = document.querySelectorAll('.slideshow.banner--mobile-bottom');
  if (!heroes.length) return;

  var ticking = false;

  function update() {
    ticking = false;
    if (!mobileQuery.matches) {
      heroes.forEach(function (hero) {
        hero.querySelectorAll('.slideshow__media').forEach(function (media) {
          media.style.transform = '';
        });
        hero.querySelectorAll('.slideshow__text-wrapper').forEach(function (text) {
          text.style.opacity = '';
        });
      });
      return;
    }

    var viewportH = window.innerHeight || document.documentElement.clientHeight;

    heroes.forEach(function (hero) {
      var rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportH) return;

      var progress = (0 - rect.top) / rect.height;
      progress = Math.min(Math.max(progress, 0), 1);

      hero.querySelectorAll('.slideshow__media').forEach(function (media) {
        media.style.transform = 'translateY(' + (progress * 6) + '%) scale(' + (1 + progress * 0.06) + ')';
      });
      hero.querySelectorAll('.slideshow__text-wrapper').forEach(function (text) {
        text.style.opacity = String(1 - progress * 0.9);
      });
    });
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
