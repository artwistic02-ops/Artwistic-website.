/**
 * ARTWISTIC WISHLIST PAGE — renders window.awWishlist's real saved
 * entries ({id, handle, savedAt} from assets/artwistic-product-card.js)
 * by fetching each product's real live data via /products/<handle>.js.
 * Cards reuse the exact same wishlist-toggle and quick-add data
 * attributes as every other product card on the site, so the shared
 * click delegation already wired in artwistic-product-card.js (loaded
 * site-wide from layout/theme.liquid) handles adding to cart here too
 * — nothing is reimplemented.
 *
 * Entries older than 30 days are dropped on read (real, enforced
 * expiry, not just copy) — see EXPIRY_MS below.
 */
(function () {
  'use strict';

  var EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
  var DAY_MS = 24 * 60 * 60 * 1000;

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

  function pruneExpired() {
    var entries = window.awWishlist ? window.awWishlist.get() : [];
    var now = Date.now();
    entries
      .filter(function (entry) {
        return entry.savedAt && now - entry.savedAt > EXPIRY_MS;
      })
      .forEach(function (entry) {
        window.awWishlist.remove(entry.id);
      });
  }

  function savedLine(savedAt) {
    if (!savedAt) return '';
    var days = Math.floor((Date.now() - savedAt) / DAY_MS);
    var remaining = Math.max(0, 30 - days);
    var savedText = days === 0 ? 'today' : days === 1 ? '1 day ago' : days + ' days ago';
    return 'Saved ' + savedText + ' · drops off in ' + remaining + (remaining === 1 ? ' day' : ' days');
  }

  function buildCard(product, entry) {
    var variant =
      product.variants.filter(function (v) {
        return v.available;
      })[0] || product.variants[0];
    var isMultiVariant = product.variants.length > 1;
    var inStock = product.variants.some(function (v) {
      return v.available;
    });

    var priceHtml = '<span class="price-item price-item--regular">' + moneyFromCents(variant.price) + '</span>';
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      priceHtml =
        '<s class="price-item price-item--compare">' +
        moneyFromCents(variant.compare_at_price) +
        '</s> ' +
        priceHtml;
    }

    var li = document.createElement('li');
    li.className = 'aw-wishlist-card';
    li.dataset.productId = product.id;
    li.dataset.inStock = inStock ? 'true' : 'false';
    li.dataset.price = variant.price;

    li.innerHTML =
      '<div class="aw-wishlist-card__wrapper">' +
      '<button type="button" class="aw-wishlist-card__remove" data-aw-wishlist-remove aria-label="Remove from wishlist">' +
      iconMarkup('aw-wishlist-icon-remove') +
      '</button>' +
      '<a class="aw-wishlist-card__media-link" href="' +
      product.url +
      '">' +
      '<div class="aw-wishlist-card__media">' +
      '<img src="' +
      (product.featured_image || '') +
      '" alt="' +
      product.title.replace(/"/g, '&quot;') +
      '" loading="lazy" width="176" height="176">' +
      '</div>' +
      '</a>' +
      '<div class="aw-wishlist-card__body">' +
      '<h3 class="aw-wishlist-card__heading"><a href="' +
      product.url +
      '" class="full-unstyled-link">' +
      product.title.replace(/&/g, '&amp;') +
      '</a></h3>' +
      (product.vendor ? '<p class="aw-wishlist-card__meta">' + product.vendor.replace(/&/g, '&amp;') + '</p>' : '') +
      '<span class="aw-wishlist-card__stock aw-wishlist-card__stock--' +
      (inStock ? 'ok' : 'out') +
      '">' +
      (inStock ? 'In stock' : 'Out of stock') +
      '</span>' +
      '<div class="aw-wishlist-card__row">' +
      '<div class="aw-wishlist-card__price">' +
      priceHtml +
      '</div>' +
      (inStock
        ? '<button type="button" class="aw-wishlist-card__move" data-aw-wishlist-move data-variant-id="' +
          variant.id +
          '" data-multi-variant="' +
          (isMultiVariant ? 'true' : 'false') +
          '" data-product-id="' +
          product.id +
          '" data-product-url="' +
          product.url +
          '" data-product-title="' +
          product.title.replace(/"/g, '&quot;') +
          '">' +
          iconMarkup('aw-wishlist-icon-cart') +
          'Move to Bag</button>'
        : '<button type="button" class="aw-wishlist-card__move" disabled>Notify unavailable</button>') +
      '</div>' +
      '<p class="aw-wishlist-card__saved">' +
      savedLine(entry.savedAt) +
      '</p>' +
      '</div>' +
      '</div>';
    return li;
  }

  var grid, emptyState, loading, countEl, shareBtn, summaryBar, summaryTotal, moveAllBtn;

  function updateCount(count) {
    if (!countEl) return;
    countEl.textContent = String(count);
    countEl.hidden = count === 0;
  }

  function recalcSummary() {
    if (!summaryBar) return;
    var rows = grid.querySelectorAll('.aw-wishlist-card[data-in-stock="true"]');
    if (!rows.length) {
      summaryBar.hidden = true;
      return;
    }
    var total = 0;
    rows.forEach(function (row) {
      total += parseInt(row.dataset.price, 10) || 0;
    });
    summaryBar.hidden = false;
    summaryTotal.textContent = moneyFromCents(total);
  }

  function removeCard(li) {
    li.classList.add('is-leaving');
    window.setTimeout(function () {
      li.remove();
      recalcSummary();
      if (!grid.querySelectorAll('.aw-wishlist-card').length) render();
    }, 350);
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
      if (summaryBar) summaryBar.hidden = true;
      return;
    }

    Promise.all(
      entries.map(function (entry) {
        return fetch('/products/' + entry.handle + '.js')
          .then(function (response) {
            return response.ok ? response.json() : null;
          })
          .then(function (product) {
            return product ? { product: product, entry: entry } : null;
          })
          .catch(function () {
            return null;
          });
      })
    ).then(function (results) {
      loading.hidden = true;
      grid.innerHTML = '';
      var real = results.filter(Boolean);

      if (!real.length) {
        emptyState.hidden = false;
        grid.hidden = true;
        if (shareBtn) shareBtn.hidden = true;
        if (summaryBar) summaryBar.hidden = true;
        return;
      }

      real.forEach(function (result) {
        grid.appendChild(buildCard(result.product, result.entry));
      });
      grid.hidden = false;
      emptyState.hidden = true;
      if (shareBtn) shareBtn.hidden = false;
      recalcSummary();
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

  function moveToBag(button) {
    if (button.disabled) return;
    if (button.dataset.multiVariant === 'true') {
      /* Multi-variant: reuse the shared quick-add attributes so the
         site's real size-sheet (assets/artwistic-quick-add.js) opens
         instead of guessing a variant. */
      button.setAttribute('data-aw-quick-add', '');
      button.click();
      return;
    }
    var li = button.closest('.aw-wishlist-card');
    button.disabled = true;
    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    var formData = new FormData();
    formData.append('id', button.dataset.variantId);
    formData.append('quantity', '1');
    config.body = formData;

    fetch(window.routes.cart_add_url, config)
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (response.status) {
          button.disabled = false;
          return;
        }
        var cartNotification = document.querySelector('cart-notification');
        var cartDrawer = document.querySelector('cart-drawer');
        var target = cartNotification || cartDrawer;
        if (target) {
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'artwistic-wishlist',
              productVariantId: button.dataset.variantId,
              cartData: response
            });
          }
          if (typeof target.renderContents === 'function') target.renderContents(response);
        }
        window.awWishlist.remove(li.dataset.productId);
        removeCard(li);
      })
      .catch(function () {
        button.disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    grid = document.querySelector('[data-aw-wishlist-grid]');
    if (!grid) return;
    emptyState = document.querySelector('[data-aw-wishlist-empty]');
    loading = document.querySelector('[data-aw-wishlist-loading]');
    countEl = document.querySelector('[data-aw-wishlist-page-count]');
    shareBtn = document.querySelector('[data-aw-wishlist-share]');
    summaryBar = document.querySelector('[data-aw-wishlist-summary]');
    summaryTotal = document.querySelector('[data-aw-wishlist-summary-total]');
    moveAllBtn = document.querySelector('[data-aw-wishlist-move-all]');

    initShare();
    pruneExpired();

    grid.addEventListener('click', function (event) {
      var removeBtn = event.target.closest('[data-aw-wishlist-remove]');
      if (removeBtn) {
        var li = removeBtn.closest('.aw-wishlist-card');
        window.awWishlist.remove(li.dataset.productId);
        removeCard(li);
        return;
      }
      var moveBtn = event.target.closest('[data-aw-wishlist-move]');
      if (moveBtn) {
        moveToBag(moveBtn);
      }
    });

    if (moveAllBtn) {
      moveAllBtn.addEventListener('click', function () {
        grid.querySelectorAll('[data-aw-wishlist-move]:not([disabled])').forEach(function (btn) {
          moveToBag(btn);
        });
      });
    }

    render();
  });

  document.addEventListener('aw:wishlist:change', function () {
    if (grid) render();
  });
})();
