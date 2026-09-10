/**
 * ARTWISTIC WISHLIST RECOMMENDATIONS — fetches the "You might also like"
 * rail (sections/artwistic-wishlist-recommendations.liquid) using
 * Shopify's native product recommendations endpoint, seeded from the
 * most recently saved wishlist item. Unlike the cart rail, the wishlist
 * only stores product handles, so this first resolves the seed handle to
 * a product id via the Storefront AJAX API before requesting
 * recommendations.
 */
(function () {
  'use strict';

  var container = document.getElementById('aw-wishlist-pair');
  if (!container || !window.ArtwisticWishlist) return;

  var routesUrl =
    window.routes && window.routes.product_recommendations_url
      ? window.routes.product_recommendations_url
      : '/recommendations/products';

  function fetchRecommendations(productId) {
    var params = new URLSearchParams({
      section_id: 'artwistic-wishlist-recommendations',
      product_id: productId,
      limit: '6',
      intent: 'related',
    });

    fetch(routesUrl + '?' + params.toString())
      .then(function (response) {
        if (!response.ok) throw new Error('Recommendations request failed');
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var pair = parsed.querySelector('.aw-pair');
        if (!pair) return;
        container.innerHTML = '';
        container.appendChild(pair);
        if (window.ArtwisticRail) window.ArtwisticRail.init(container);
      })
      .catch(function () {
        /* Silently omit the rail if recommendations aren't available. */
      });
  }

  function init() {
    var handles = window.ArtwisticWishlist.list();
    var seedHandle = handles[handles.length - 1];
    if (!seedHandle) return;

    fetch('/products/' + encodeURIComponent(seedHandle) + '.js')
      .then(function (response) {
        if (!response.ok) throw new Error('not found');
        return response.json();
      })
      .then(function (product) {
        fetchRecommendations(product.id);
      })
      .catch(function () {
        /* Seed product unavailable — skip the rail for this load. */
      });
  }

  document.addEventListener('artwistic:wishlist:change', init);
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
