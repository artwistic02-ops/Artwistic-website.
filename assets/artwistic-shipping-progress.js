/**
 * ARTWISTIC SHIPPING PROGRESS — celebration on unlock, per tier.
 *
 * The progress bar (see snippets/artwistic-shipping-progress.liquid) has
 * two milestone nodes — free shipping, then a free gift — each of which
 * gets its own "reached" class. The whole bar is server-rendered and
 * swapped in wholesale by cart.js/cart-drawer.js on every cart mutation —
 * there is no persistent DOM node to attach a transition to, so this
 * tracks each node's reached-state by position (first/last) across
 * swaps and celebrates the moment either one newly appears, using a
 * single MutationObserver decoupled from Dawn's own cart update internals.
 * Runs once per page load; safe to be present on every page since the
 * observer callback is a no-op until the DOM actually changes.
 */
(function () {
  'use strict';

  if (window.__awShippingCelebrateInit) return;
  window.__awShippingCelebrateInit = true;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wasReached = { shipping: false, gift: false };

  function readState() {
    var nodes = document.querySelectorAll('.aw-shipping-progress__node');
    if (!nodes.length) return { shipping: false, gift: false };
    var shippingNode = nodes[0];
    var giftNode = nodes[nodes.length - 1];
    return {
      shipping: shippingNode.classList.contains('aw-shipping-progress__node--reached'),
      gift: giftNode.classList.contains('aw-shipping-progress__node--reached'),
    };
  }

  wasReached = readState();

  function sparkBurstFrom(el) {
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    for (var i = 0; i < 12; i++) {
      var spark = document.createElement('span');
      spark.className = 'aw-shipping-spark';
      var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      var dist = 28 + Math.random() * 36;
      spark.style.left = cx + 'px';
      spark.style.top = cy + 'px';
      spark.style.setProperty('--aw-spark-x', Math.cos(angle) * dist + 'px');
      spark.style.setProperty('--aw-spark-y', Math.sin(angle) * dist + 'px');
      document.body.appendChild(spark);
      (function (node) {
        window.setTimeout(function () {
          node.remove();
        }, 850);
      })(spark);
    }
  }

  function celebrate() {
    document.querySelectorAll('.aw-shipping-progress').forEach(function (progress) {
      progress.classList.remove('aw-shipping-progress--celebrating');
      void progress.offsetWidth; // restart the animation if it's already mid-run
      progress.classList.add('aw-shipping-progress--celebrating');
      window.setTimeout(function () {
        progress.classList.remove('aw-shipping-progress--celebrating');
      }, 1600);

      if (!prefersReducedMotion) {
        var track = progress.querySelector('.aw-shipping-progress__track');
        if (track) sparkBurstFrom(track);
      }
    });
  }

  function check() {
    var isReached = readState();
    if ((isReached.shipping && !wasReached.shipping) || (isReached.gift && !wasReached.gift)) {
      celebrate();
    }
    wasReached = isReached;
  }

  var observer = new MutationObserver(check);
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState !== 'loading') {
    check();
  } else {
    document.addEventListener('DOMContentLoaded', check);
  }
})();
