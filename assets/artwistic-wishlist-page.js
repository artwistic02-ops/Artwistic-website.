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

  // Toggling storage dispatches 'artwistic:wishlist:change', which this
  // module also listens for (see bottom) and responds to by wiping and
  // fully re-rendering the grid. So the fade-out animation always plays
  // first, on the detached DOM node, and the storage toggle — which
  // triggers that full re-render — only fires once the animation is done.
  function refreshCartIconBubble() {
    var target = document.getElementById('cart-icon-bubble');
    if (!target || !window.routes || !window.routes.cart_url) return;
    fetch(window.routes.cart_url + '?section_id=cart-icon-bubble')
      .then(function (response) {
        if (!response.ok) throw new Error('cart-icon-bubble fetch failed');
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var source = doc.getElementById('cart-icon-bubble');
        if (source) target.innerHTML = source.innerHTML;
      })
      .catch(function () {
        /* Cart still updated server-side; the icon count just won't refresh this time. */
      });
  }

  function fadeOutThenToggle(node, handle) {
    node.classList.add('aw-wishlist-card--leaving');
    window.setTimeout(function () {
      window.ArtwisticWishlist.toggle(handle);
    }, 320);
  }

  function renderCard(product) {
    var node = template.content.firstElementChild.cloneNode(true);
    var image = product.featured_image || (product.images && product.images[0]);
    var mediaLink = node.querySelector('.aw-wishlist-card__media-link');
    var img = node.querySelector('img');
    var titleLink = node.querySelector('.aw-wishlist-card__title');
    var price = node.querySelector('.aw-wishlist-card__price');
    var comparePrice = node.querySelector('[data-aw-wishlist-compare]');
    var stockEl = node.querySelector('[data-aw-wishlist-stock]');
    var removeButton = node.querySelector('[data-aw-wishlist-remove]');
    var moveButton = node.querySelector('[data-aw-wishlist-move]');
    var variant = product.variants && product.variants[0];

    mediaLink.href = product.url;
    if (image) {
      img.src = image;
      img.alt = product.title;
    }
    titleLink.href = product.url;
    titleLink.textContent = product.title;
    price.textContent = formatMoney(product.price);

    if (product.compare_at_price && product.compare_at_price > product.price) {
      comparePrice.textContent = formatMoney(product.compare_at_price);
      comparePrice.hidden = false;
    }

    var available = !!(variant && variant.available);
    stockEl.textContent = available ? stockEl.dataset.labelInStock : stockEl.dataset.labelOutOfStock;
    stockEl.classList.toggle('aw-wishlist-card__stock--low', !available);
    stockEl.hidden = false;

    if (!available) moveButton.disabled = true;

    removeButton.addEventListener('click', function () {
      fadeOutThenToggle(node, product.handle);
    });

    moveButton.addEventListener('click', function () {
      if (moveButton.disabled) return;
      moveButton.disabled = true;
      moveButton.textContent = moveButton.dataset.labelLoading;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error('cart add failed');
          return response.json();
        })
        .then(function () {
          moveButton.textContent = moveButton.dataset.labelDone;
          refreshCartIconBubble();
          window.setTimeout(function () {
            fadeOutThenToggle(node, product.handle);
          }, 500);
        })
        .catch(function () {
          moveButton.disabled = false;
          moveButton.textContent = moveButton.dataset.labelError;
          window.setTimeout(function () {
            moveButton.textContent = moveButton.dataset.labelIdle;
          }, 2200);
        });
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
