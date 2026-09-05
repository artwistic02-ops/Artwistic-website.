/**
 * ARTWISTIC RECENTLY VIEWED (spec section 42).
 *
 * Records the current product handle into a capped localStorage list on
 * every product page view, then renders a rail of the other recently
 * viewed products by fetching each from /products/{handle}.js. No
 * server-side tracking, no app, no extra requests on non-product pages.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'aw_recently_viewed';
  var MAX_ENTRIES = 12;
  var MAX_DISPLAY = 8;

  function readList() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeList(handles) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch (error) {
      /* Storage unavailable — recording is best-effort only. */
    }
  }

  function record(handle) {
    if (!handle) return;
    var list = readList().filter(function (existing) {
      return existing !== handle;
    });
    list.unshift(handle);
    writeList(list.slice(0, MAX_ENTRIES));
  }

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return (window.Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active + ' ' : '') + amount;
  }

  function renderRail(container) {
    var currentHandle = container.getAttribute('data-aw-current-handle');
    var grid = container.querySelector('[data-aw-recently-viewed-grid]');
    var template = document.getElementById('aw-recently-viewed-card-template');
    if (!grid || !template) return;

    if (currentHandle) record(currentHandle);

    var handles = readList()
      .filter(function (handle) {
        return handle !== currentHandle;
      })
      .slice(0, MAX_DISPLAY);

    if (handles.length === 0) return;

    handles.forEach(function (handle) {
      fetch('/products/' + encodeURIComponent(handle) + '.js')
        .then(function (response) {
          if (!response.ok) throw new Error('not found');
          return response.json();
        })
        .then(function (product) {
          var node = template.content.firstElementChild.cloneNode(true);
          var image = product.featured_image || (product.images && product.images[0]);
          var mediaLink = node.querySelector('.aw-recently-viewed-card__media-link');
          var img = node.querySelector('img');
          var titleLink = node.querySelector('.aw-recently-viewed-card__title');
          var price = node.querySelector('.aw-recently-viewed-card__price');

          mediaLink.href = product.url;
          if (image) {
            img.src = image;
            img.alt = product.title;
          }
          titleLink.href = product.url;
          titleLink.textContent = product.title;
          price.textContent = formatMoney(product.price);

          grid.appendChild(node);
        })
        .catch(function () {
          /* Product removed/unpublished since it was viewed — skip it silently. */
        })
        .finally(function () {
          if (grid.children.length > 0) container.hidden = false;
        });
    });
  }

  document.querySelectorAll('[data-aw-recently-viewed]').forEach(renderRail);
})();
