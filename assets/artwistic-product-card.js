/**
 * ARTWISTIC PRODUCT CARD — shared wishlist toggle (localStorage) and
 * quick add-to-cart, wired via event delegation so it works for every
 * card on the page (Best Sellers, New Arrivals, Collections later)
 * without per-section setup. Add-to-cart uses the same real
 * fetchConfig + routes.cart_add_url + publish(cartUpdate) +
 * cart.renderContents() pattern already proven in
 * assets/artwistic-complete-the-look.js — not a re-invented call.
 */
(function () {
  'use strict';

  var WISHLIST_KEY = 'aw_wishlist';
  var MIN_SPIN_MS = 450;

  function getWishlist() {
    try {
      var raw = window.localStorage.getItem(WISHLIST_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      // Entries are {id, handle, savedAt} objects — filter out anything from
      // an older bare-id-array format so the Wishlist page's handle-based
      // /products/<handle>.js fetch always has what it needs. savedAt drives
      // the Wishlist Hub's real 30-day expiry — entries saved before this
      // field existed just don't show an age/expiry line, they're not lost.
      return parsed.filter(function (entry) {
        return entry && typeof entry === 'object' && entry.id && entry.handle;
      });
    } catch (e) {
      return [];
    }
  }

  function setWishlist(entries) {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(entries));
    } catch (e) {
      /* localStorage unavailable — wishlist just won't persist this session */
    }
  }

  function paintWishlistButtons() {
    var ids = getWishlist().map(function (entry) {
      return String(entry.id);
    });
    document.querySelectorAll('[data-aw-wishlist-toggle]').forEach(function (btn) {
      var isActive = ids.indexOf(String(btn.dataset.productId)) !== -1;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function toggleWishlist(productId, productHandle, sourceButton) {
    var entries = getWishlist();
    var index = entries.findIndex(function (entry) {
      return String(entry.id) === String(productId);
    });
    var willBeActive = index === -1;
    if (willBeActive) {
      entries.push({ id: String(productId), handle: productHandle, savedAt: Date.now() });
    } else {
      entries.splice(index, 1);
    }
    setWishlist(entries);
    paintWishlistButtons();
    document.dispatchEvent(new CustomEvent('aw:wishlist:change', { detail: { entries: entries } }));

    if (willBeActive && sourceButton) {
      sourceButton.classList.remove('is-popping');
      void sourceButton.offsetWidth;
      sourceButton.classList.add('is-popping');
      window.setTimeout(function () {
        sourceButton.classList.remove('is-popping');
      }, 600);
    }
  }

  function removeFromWishlist(productId) {
    var entries = getWishlist().filter(function (entry) {
      return String(entry.id) !== String(productId);
    });
    setWishlist(entries);
    paintWishlistButtons();
    document.dispatchEvent(new CustomEvent('aw:wishlist:change', { detail: { entries: entries } }));
  }

  /**
   * Real, working today — the Wishlist page (sections/artwistic-wishlist.liquid)
   * and a header wishlist-count badge read/write through this shared API
   * instead of touching localStorage directly, so there's exactly one
   * source of truth: window.awWishlist.get() returns the current
   * [{id, handle}, ...] array, .toggle(id, handle) adds/removes and
   * re-paints every heart on the page, .remove(id) is a plain removal
   * (used by the Wishlist page's own remove control), and the
   * 'aw:wishlist:change' event (dispatched above) fires on every change
   * for anything that wants to react live without polling localStorage.
   */
  window.awWishlist = {
    get: getWishlist,
    toggle: toggleWishlist,
    remove: removeFromWishlist,
  };

  function getCart() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  function addToCart(button) {
    if (button.disabled || button.classList.contains('is-loading')) return;
    var variantId = button.dataset.variantId;
    if (!variantId || typeof fetchConfig !== 'function' || !window.routes) return;

    button.disabled = true;
    button.classList.add('is-loading');
    var startedAt = Date.now();

    var cart = getCart();
    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    var formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);
    if (cart) {
      formData.append(
        'sections',
        cart.getSectionsToRender().map(function (section) {
          return section.id;
        })
      );
      formData.append('sections_url', window.location.pathname);
    }
    config.body = formData;

    fetch(routes.cart_add_url, config)
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (response.status) {
          throw new Error(response.description || response.message || 'Cart add failed');
        }
        if (cart) {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'artwistic-product-card',
            productVariantId: variantId,
            cartData: response,
          });
          cart.renderContents(response);
        }

        var elapsed = Date.now() - startedAt;
        var wait = Math.max(MIN_SPIN_MS - elapsed, 0);
        window.setTimeout(function () {
          button.classList.remove('is-loading');
          button.classList.add('is-added');
          button.disabled = false;
          window.setTimeout(function () {
            button.classList.remove('is-added');
          }, 2200);
        }, wait);
      })
      .catch(function () {
        button.classList.remove('is-loading');
        button.disabled = false;
      });
  }

  /**
   * Exposed so assets/artwistic-quick-add.js can reuse this exact real
   * /cart/add.js flow instead of duplicating it — the quick-add sheet
   * just resolves a real variant id, sets it on the card's own button,
   * and calls this the same way a direct single-variant click does.
   */
  window.awProductCard = {
    addToCart: addToCart,
  };

  function swapCardImage(swatchBtn) {
    if (!swatchBtn.dataset.swapSrc) return;
    var group = swatchBtn.closest('[data-aw-card-swatches]');
    var card = swatchBtn.closest('.card-wrapper');
    var img = card && card.querySelector('.card__media img.motion-reduce');
    if (!img) return;

    img.src = swatchBtn.dataset.swapSrc;
    if (swatchBtn.dataset.swapSrcset) {
      img.srcset = swatchBtn.dataset.swapSrcset;
    }

    if (group) {
      group.querySelectorAll('.aw-card-swatch').forEach(function (btn) {
        var isActive = btn === swatchBtn;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }
  }

  document.addEventListener('click', function (event) {
    var wishlistBtn = event.target.closest('[data-aw-wishlist-toggle]');
    if (wishlistBtn) {
      event.preventDefault();
      toggleWishlist(wishlistBtn.dataset.productId, wishlistBtn.dataset.productHandle, wishlistBtn);
      return;
    }

    var cartBtn = event.target.closest('[data-aw-quick-add]');
    if (cartBtn) {
      event.preventDefault();
      if (cartBtn.dataset.multiVariant === 'true') {
        if (cartBtn.disabled) return;
        var quickAddData = document.querySelector(
          '[data-aw-quick-add-data="' + cartBtn.dataset.productId + '"]'
        );
        if (quickAddData && window.awQuickAdd) {
          window.awQuickAdd.open(cartBtn, quickAddData);
          return;
        }
        cartBtn.disabled = true;
        cartBtn.classList.add('is-loading');
        window.setTimeout(function () {
          window.location.href = cartBtn.dataset.productUrl;
        }, 320);
        return;
      }
      addToCart(cartBtn);
      return;
    }

    var swatchBtn = event.target.closest('.aw-card-swatch');
    if (swatchBtn) {
      event.preventDefault();
      swapCardImage(swatchBtn);
    }
  });

  paintWishlistButtons();
})();
