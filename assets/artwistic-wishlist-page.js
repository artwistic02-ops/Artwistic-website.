/**
 * ARTWISTIC WISHLIST PAGE — renders the saved-products grid on the
 * dedicated wishlist page (sections/artwistic-wishlist.liquid).
 *
 * Fetches each saved handle from Shopify's Storefront AJAX API
 * (/products/{handle}.js) so price/availability/image are always live,
 * rather than caching a stale snapshot at save-time. This only runs on
 * the wishlist page itself, not on every page load.
 */
(function () {
  'use strict';

  var grid = document.querySelector('[data-aw-wishlist-grid]');
  var emptyState = document.querySelector('[data-aw-wishlist-empty]');
  var template = document.getElementById('aw-wishlist-card-template');
  if (!grid || !emptyState || !template || !window.ArtwisticWishlist) return;

  function renderCard(product) {
    var node = template.content.firstElementChild.cloneNode(true);
    var image = product.featured_image || (product.images && product.images[0]);
    var mediaLink = node.querySelector('.aw-wishlist-card__media-link');
    var img = node.querySelector('img');
    var titleLink = node.querySelector('.aw-wishlist-card__title');
    var price = node.querySelector('.aw-wishlist-card__price');
    var removeButton = node.querySelector('[data-aw-wishlist-remove]');

    mediaLink.href = product.url;
    if (image) {
      img.src = image;
      img.alt = product.title;
    }
    titleLink.href = product.url;
    titleLink.textContent = product.title;
    price.textContent = formatMoney(product.price);
    removeButton.addEventListener('click', function () {
      window.ArtwisticWishlist.toggle(product.handle);
      node.remove();
      if (grid.children.length === 0) toggleEmptyState(true);
    });

    return node;
  }

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return (window.Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active + ' ' : '') + amount;
  }

  function toggleEmptyState(isEmpty) {
    emptyState.hidden = !isEmpty;
    grid.hidden = isEmpty;
  }

  function load() {
    var handles = window.ArtwisticWishlist.list();
    if (handles.length === 0) {
      toggleEmptyState(true);
      return;
    }

    toggleEmptyState(false);
    grid.innerHTML = '';

    handles.forEach(function (handle) {
      fetch('/products/' + encodeURIComponent(handle) + '.js')
        .then(function (response) {
          if (!response.ok) throw new Error('not found');
          return response.json();
        })
        .then(function (product) {
          grid.appendChild(renderCard(product));
        })
        .catch(function () {
          /* Product removed/unpublished since it was saved — skip it silently. */
        });
    });
  }

  document.addEventListener('artwistic:wishlist:change', load);
  document.addEventListener('DOMContentLoaded', load);
  if (document.readyState !== 'loading') load();
})();
