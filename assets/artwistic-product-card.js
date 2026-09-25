/**
 * ARTWISTIC PRODUCT CARD — real, shared wishlist + quick-add data layer.
 * Loaded once, site-wide (layout/theme.liquid), not per-card. Drives every
 * .aw-card-action button (product cards, product page, and the Wishlist
 * Hub page's own client-rendered cards via assets/artwistic-wishlist.js).
 *
 * window.awWishlist:
 *   get()            -> [{ id, handle, savedAt }]
 *   toggle(id,handle) -> boolean (true = now saved)
 *   isSaved(id)       -> boolean
 *   remove(id)        -> void
 * Every mutation fires document 'aw:wishlist:change' (already listened
 * for by artwistic-wishlist-header-count.js and artwistic-wishlist.js).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'aw_wishlist';

  function readEntries() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeEntries(entries) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      /* Storage unavailable — state still works for this page view. */
    }
    document.dispatchEvent(new CustomEvent('aw:wishlist:change'));
  }

  window.awWishlist = {
    get: function () {
      return readEntries();
    },
    isSaved: function (id) {
      id = String(id);
      return readEntries().some(function (entry) {
        return String(entry.id) === id;
      });
    },
    toggle: function (id, handle) {
      var entries = readEntries();
      id = String(id);
      var existingIndex = -1;
      entries.forEach(function (entry, index) {
        if (String(entry.id) === id) existingIndex = index;
      });
      var nowSaved;
      if (existingIndex > -1) {
        entries.splice(existingIndex, 1);
        nowSaved = false;
      } else {
        entries.push({ id: id, handle: handle, savedAt: Date.now() });
        nowSaved = true;
      }
      writeEntries(entries);
      return nowSaved;
    },
    remove: function (id) {
      id = String(id);
      var entries = readEntries().filter(function (entry) {
        return String(entry.id) !== id;
      });
      writeEntries(entries);
    }
  };

  /* ---- wishlist heart: reflect saved state on load ---- */
  function paintWishlistButtons(root) {
    (root || document).querySelectorAll('[data-aw-wishlist-toggle]').forEach(function (button) {
      var saved = window.awWishlist.isSaved(button.dataset.productId);
      button.classList.toggle('is-active', saved);
      button.setAttribute('aria-pressed', String(saved));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    paintWishlistButtons(document);
  });
  document.addEventListener('aw:wishlist:change', function () {
    paintWishlistButtons(document);
  });

  /* ---- quick-add: real /cart/add.js, single-variant direct, multi-variant via a size sheet ---- */
  var MIN_SPIN_MS = 450;

  function addVariantToCart(variantId, button) {
    if (!variantId) return;
    button.classList.add('is-loading');
    button.disabled = true;
    var started = Date.now();

    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    var formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');
    config.body = formData;

    fetch(window.routes.cart_add_url, config)
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        var elapsed = Date.now() - started;
        var wait = Math.max(0, MIN_SPIN_MS - elapsed);
        window.setTimeout(function () {
          button.classList.remove('is-loading');
          button.disabled = false;
          if (response.status) {
            button.classList.remove('is-added');
            return;
          }
          button.classList.add('is-added');
          window.setTimeout(function () {
            button.classList.remove('is-added');
          }, 2000);

          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'artwistic-product-card',
              productVariantId: variantId,
              cartData: response
            });
          }
          var cartNotification = document.querySelector('cart-notification');
          var cartDrawer = document.querySelector('cart-drawer');
          var target = cartNotification || cartDrawer;
          if (target && typeof target.renderContents === 'function') {
            target.renderContents(response);
          }
        }, wait);
      })
      .catch(function () {
        button.classList.remove('is-loading');
        button.disabled = false;
      });
  }

  /* ---- size sheet for multi-variant quick-add ---- */
  var sheetEl = null;

  function closeSizeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('is-open');
    window.setTimeout(function () {
      if (sheetEl && sheetEl.parentNode) sheetEl.parentNode.removeChild(sheetEl);
      sheetEl = null;
    }, 250);
  }

  function openSizeSheet(button) {
    closeSizeSheet();

    var data;
    try {
      data = JSON.parse(button.dataset.variants || '[]');
    } catch (error) {
      data = [];
    }
    if (!data.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'aw-size-sheet';
    wrap.innerHTML =
      '<div class="aw-size-sheet__backdrop" data-aw-size-sheet-close></div>' +
      '<div class="aw-size-sheet__panel" role="dialog" aria-modal="true" aria-label="Choose a size">' +
      '<p class="aw-size-sheet__title">' + (button.dataset.productTitle || 'Choose a size') + '</p>' +
      '<div class="aw-size-sheet__options"></div>' +
      '</div>';

    var optionsHost = wrap.querySelector('.aw-size-sheet__options');
    data.forEach(function (variant) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'aw-size-sheet__option';
      opt.textContent = variant.label;
      if (!variant.available) {
        opt.disabled = true;
        opt.classList.add('is-unavailable');
      } else {
        opt.addEventListener('click', function () {
          closeSizeSheet();
          addVariantToCart(variant.id, button);
        });
      }
      optionsHost.appendChild(opt);
    });

    wrap.querySelectorAll('[data-aw-size-sheet-close]').forEach(function (el) {
      el.addEventListener('click', closeSizeSheet);
    });

    document.body.appendChild(wrap);
    sheetEl = wrap;
    requestAnimationFrame(function () {
      wrap.classList.add('is-open');
    });
  }

  /* ---- click delegation: works for cards rendered later client-side too ---- */
  document.addEventListener('click', function (event) {
    var wishlistBtn = event.target.closest('[data-aw-wishlist-toggle]');
    if (wishlistBtn) {
      event.preventDefault();
      var nowSaved = window.awWishlist.toggle(wishlistBtn.dataset.productId, wishlistBtn.dataset.productHandle);
      wishlistBtn.classList.toggle('is-active', nowSaved);
      wishlistBtn.setAttribute('aria-pressed', String(nowSaved));
      return;
    }

    var quickAddBtn = event.target.closest('[data-aw-quick-add]');
    if (quickAddBtn) {
      event.preventDefault();
      if (quickAddBtn.disabled || quickAddBtn.classList.contains('is-loading')) return;
      if (quickAddBtn.dataset.multiVariant === 'true') {
        openSizeSheet(quickAddBtn);
      } else {
        addVariantToCart(quickAddBtn.dataset.variantId, quickAddBtn);
      }
    }
  });
})();
