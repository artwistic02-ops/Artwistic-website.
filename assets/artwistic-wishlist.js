/**
 * ARTWISTIC WISHLIST PAGE — renders window.awWishlist's real saved
 * entries ({id, handle} from assets/artwistic-product-card.js) by
 * fetching each product's real live data via /products/<handle>.js.
 * Cards reuse the exact same wishlist-toggle and quick-add data
 * attributes as every other product card on the site, so the global
 * click delegation already wired in artwistic-product-card.js (loaded
 * site-wide from layout/theme.liquid) handles removing and adding to
 * cart here too — nothing is reimplemented.
 */
(function () {
  'use strict';

  function moneyFromCents(cents) {
    var format = (window.Shopify && Shopify.money_format) || '${{amount}}';
    var amount = (cents / 100).toFixed(2);
    var parts = amount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    amount = parts.join('.');
    return format.replace(/\{\{\s*amount\s*\}\}/, amount);
  }

  function iconMarkup(templateId) {
    var template = document.getElementById(templateId);
    return template ? template.innerHTML : '';
  }

  function buildCard(product) {
    var variant =
      product.variants.filter(function (v) {
        return v.available;
      })[0] || product.variants[0];
    var isMultiVariant = product.variants.length > 1;

    var priceHtml = '<span class="price-item price-item--regular">' + moneyFromCents(variant.price) + '</span>';
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      priceHtml =
        '<s class="price-item price-item--compare">' +
        moneyFromCents(variant.compare_at_price) +
        '</s> ' +
        priceHtml;
    }

    var li = document.createElement('li');
    li.className = 'grid__item aw-wishlist-card';
    li.innerHTML =
      '<div class="card-wrapper aw-wishlist-card__wrapper">' +
      '<a class="aw-wishlist-card__media-link" href="' +
      product.url +
      '">' +
      '<div class="aw-wishlist-card__media">' +
      '<img src="' +
      (product.featured_image || '') +
      '" alt="' +
      product.title.replace(/"/g, '&quot;') +
      '" loading="lazy" width="360" height="450">' +
      '</div>' +
      '</a>' +
      '<div class="aw-card-actions aw-wishlist-card__actions">' +
      '<button type="button" class="aw-card-action aw-card-action--wishlist is-active" data-aw-wishlist-toggle data-product-id="' +
      product.id +
      '" data-product-handle="' +
      product.handle +
      '" aria-label="Remove from wishlist" aria-pressed="true">' +
      iconMarkup('aw-wishlist-icon-heart') +
      '</button>' +
      '<button type="button" class="aw-card-action aw-card-action--cart" data-aw-quick-add data-variant-id="' +
      variant.id +
      '" data-product-url="' +
      product.url +
      '" data-product-id="' +
      product.id +
      '" data-multi-variant="' +
      (isMultiVariant ? 'true' : 'false') +
      '" aria-label="Add to cart"' +
      (variant.available ? '' : ' disabled') +
      '>' +
      '<span class="aw-card-action-icon aw-card-action-icon--plus">' +
      iconMarkup('aw-wishlist-icon-plus') +
      '</span>' +
      '<span class="aw-card-action-icon aw-card-action-icon--check">' +
      iconMarkup('aw-wishlist-icon-check') +
      '</span>' +
      '</button>' +
      '</div>' +
      '<div class="aw-wishlist-card__content">' +
      '<h3 class="aw-wishlist-card__heading"><a href="' +
      product.url +
      '" class="full-unstyled-link">' +
      product.title.replace(/&/g, '&amp;') +
      '</a></h3>' +
      '<div class="price aw-wishlist-card__price">' +
      priceHtml +
      '</div>' +
      (variant.available ? '' : '<span class="aw-wishlist-card__soldout">Sold out</span>') +
      '</div>' +
      '</div>';
    return li;
  }

  var grid, emptyState, loading, countEl, shareBtn;

  function updateCount(count) {
    if (!countEl) return;
    countEl.textContent = String(count);
    countEl.hidden = count === 0;
  }

  function render() {
    var entries = window.awWishlist ? window.awWishlist.get() : [];
    updateCount(entries.length);

    if (!entries.length) {
      loading.hidden = true;
      emptyState.hidden = false;
      grid.hidden = true;
      grid.innerHTML = '';
      if (shareBtn) shareBtn.hidden = true;
      return;
    }

    Promise.all(
      entries.map(function (entry) {
        return fetch('/products/' + entry.handle + '.js')
          .then(function (response) {
            return response.ok ? response.json() : null;
          })
          .catch(function () {
            return null;
          });
      })
    ).then(function (products) {
      loading.hidden = true;
      grid.innerHTML = '';
      var real = products.filter(Boolean);

      if (!real.length) {
        emptyState.hidden = false;
        grid.hidden = true;
        if (shareBtn) shareBtn.hidden = true;
        return;
      }

      real.forEach(function (product) {
        grid.appendChild(buildCard(product));
      });
      grid.hidden = false;
      emptyState.hidden = true;
      if (shareBtn) shareBtn.hidden = false;
    });
  }

  function initShare() {
    if (!shareBtn) return;
    shareBtn.addEventListener('click', function () {
      var label = shareBtn.querySelector('[data-aw-wishlist-share-label]');
      var idle = label ? label.textContent : '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(window.location.href)
          .then(function () {
            if (label) {
              label.textContent = 'Link copied';
              window.setTimeout(function () {
                label.textContent = idle;
              }, 2000);
            }
          })
          .catch(function () {});
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    grid = document.querySelector('[data-aw-wishlist-grid]');
    if (!grid) return;
    emptyState = document.querySelector('[data-aw-wishlist-empty]');
    loading = document.querySelector('[data-aw-wishlist-loading]');
    countEl = document.querySelector('[data-aw-wishlist-page-count]');
    shareBtn = document.querySelector('[data-aw-wishlist-share]');
    initShare();
    render();
  });

  document.addEventListener('aw:wishlist:change', function () {
    if (grid) render();
  });
})();
