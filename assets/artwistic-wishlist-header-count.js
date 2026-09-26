/**
 * ARTWISTIC WISHLIST HEADER COUNT — fills in the header's wishlist
 * count bubble from the real, shared window.awWishlist API (see
 * assets/artwistic-product-card.js), on load and on every
 * 'aw:wishlist:change' event. Self-contained so it never has to touch
 * that shared, site-wide file directly.
 */
(function () {
  'use strict';

  function update() {
    var entries = window.awWishlist ? window.awWishlist.get() : [];
    var count = entries.length;
    document.querySelectorAll('[data-aw-wishlist-count]').forEach(function (bubble) {
      var span = bubble.querySelector('span[aria-hidden="true"]');
      if (span) span.textContent = String(count);
      bubble.hidden = count === 0;
    });
  }

  document.addEventListener('DOMContentLoaded', update);
  document.addEventListener('aw:wishlist:change', update);

  if (document.readyState !== 'loading') update();
})();
