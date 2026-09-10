/**
 * ARTWISTIC CART RECOMMENDATIONS — fetches the "Pair it with" rail
 * (sections/artwistic-cart-recommendations.liquid) using Shopify's native
 * product recommendations endpoint, based on the most recently added cart
 * line. Injected on demand because the recommendations endpoint requires
 * a product_id and cannot be rendered from a static JSON template.
 */
(function () {
  'use strict';

  var container = document.getElementById('aw-cart-pair');
  if (!container) return;

  var productId = container.getAttribute('data-product-id');
  var limit = container.getAttribute('data-limit') || '6';
  if (!productId) return;

  var url =
    window.routes && window.routes.product_recommendations_url
      ? window.routes.product_recommendations_url
      : '/recommendations/products';

  var params = new URLSearchParams({
    section_id: 'artwistic-cart-recommendations',
    product_id: productId,
    limit: limit,
    intent: 'complementary',
  });

  fetch(url + '?' + params.toString())
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
})();
