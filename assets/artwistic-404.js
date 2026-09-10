/**
 * ARTWISTIC 404 — "Fell off the chain" interactions, ported from the
 * approved mockup: a sparkle burst on gem click, a subtle cursor-tilt on
 * the gem cluster, and a draggable broken chain-link that swings back to
 * rest with damped-spring physics (friction only, no bounce/elastic
 * easing, matching this theme's motion conventions). Purely decorative —
 * none of it affects the real recovery path (search, suggested
 * collections) in sections/main-404.liquid.
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* click the gem for a little sparkle burst */
  (function () {
    var gem = document.getElementById('aw404Gem');
    if (!gem || prefersReducedMotion) return;
    gem.addEventListener('click', function () {
      var rect = gem.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      for (var i = 0; i < 14; i++) {
        var spark = document.createElement('span');
        spark.className = 'aw-404-spark';
        var angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
        var dist = 36 + Math.random() * 46;
        spark.style.left = cx + 'px';
        spark.style.top = cy + 'px';
        spark.style.setProperty('--aw-spark-x', Math.cos(angle) * dist + 'px');
        spark.style.setProperty('--aw-spark-y', Math.sin(angle) * dist + 'px');
        spark.style.background = i % 3 === 0 ? '#e6c491' : i % 3 === 1 ? 'var(--aw-color-brand-accent)' : '#fff';
        document.body.appendChild(spark);
        (function (node) {
          window.setTimeout(function () {
            node.remove();
          }, 750);
        })(spark);
      }
    });
  })();

  /* subtle cursor-tilt on the gem cluster (desktop, mouse-driven only) */
  (function () {
    var mark = document.getElementById('aw404Mark');
    var slot = document.getElementById('aw404GemSlot');
    if (!mark || !slot || prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
    mark.addEventListener('mousemove', function (event) {
      var rect = mark.getBoundingClientRect();
      var relX = (event.clientX - rect.left) / rect.width - 0.5;
      var relY = (event.clientY - rect.top) / rect.height - 0.5;
      slot.style.transform = 'rotateY(' + relX * 22 + 'deg) rotateX(' + relY * -22 + 'deg)';
    });
    mark.addEventListener('mouseleave', function () {
      slot.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  })();

  /* the broken link swings free — drag it and let go for a damped
     (friction-only, never bouncy/elastic) swing back to rest */
  (function () {
    var el = document.getElementById('aw404BrokenLink');
    if (!el) return;

    var REST = 10;
    var angle = REST;
    var velocity = 0;
    var dragging = false;
    var raf = null;
    var pivot = null;

    function apply() {
      el.style.transform = 'rotate(' + angle + 'deg)';
    }
    apply();

    if (prefersReducedMotion) return;

    function angleFromEvent(event) {
      var dx = event.clientX - pivot.x;
      var dy = event.clientY - pivot.y;
      return Math.atan2(dx, dy) * (180 / Math.PI);
    }

    function step() {
      var stiffness = 0.012;
      var damping = 0.92;
      var accel = -stiffness * (angle - REST);
      velocity = (velocity + accel) * damping;
      angle += velocity;
      apply();
      if (Math.abs(velocity) > 0.02 || Math.abs(angle - REST) > 0.05) {
        raf = window.requestAnimationFrame(step);
      } else {
        angle = REST;
        velocity = 0;
        apply();
        raf = null;
      }
    }

    el.addEventListener('pointerdown', function (event) {
      dragging = true;
      if (raf) window.cancelAnimationFrame(raf);
      var rect = el.getBoundingClientRect();
      pivot = { x: rect.left + rect.width / 2, y: rect.top };
      el.setPointerCapture(event.pointerId);
    });
    el.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      angle = Math.max(-70, Math.min(70, angleFromEvent(event)));
      apply();
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      velocity = 0;
      raf = window.requestAnimationFrame(step);
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  })();
})();
