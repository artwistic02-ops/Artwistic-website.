/**
 * ARTWISTIC COMPLETE THE LOOK — real add/remove-from-cart toggle on
 * each card's "+" button.
 *
 * Uses this theme's own real cart API (the same mechanism
 * assets/product-form.js uses: fetchConfig + routes.cart_add_url, then
 * publish(PUB_SUB_EVENTS.cartUpdate, ...) + the site's real
 * cart-notification/cart-drawer renderContents), so an item added or
 * removed here shows up correctly in the same cart drawer/notification/
 * count as anywhere else on the site.
 *
 * States (button classList):
 *   (none)      idle — "+" showing, small circle
 *   is-loading  a real add or remove request is in flight — spinner
 *               showing, same small circle (shared visual for both
 *               directions, see CSS)
 *   is-added    the item is in the cart — pill-expanded, checkmark +
 *               "Added" label, green. Clicking again reverses this and
 *               removes the real cart line (routes.cart_change_url,
 *               quantity: 0 on the exact line this button added).
 *
 * All shape/color/icon-crossfade/label timing lives in the CSS as one
 * shared transition — this file only toggles classes at the right
 * moments and guarantees a minimum visible spin so the loop always
 * reads as real motion, never a flicker.
 */
(function () {
  'use strict';

  var MIN_SPIN_MS = 650;
  var NOTIFICATION_AUTO_CLOSE_MS = 2000;

  function setIcon(button, state) {
    button.querySelectorAll('.aw-look__add-icon').forEach(function (icon) {
      icon.classList.remove('is-active');
    });
    var icon = button.querySelector('.aw-look__add-icon-' + state);
    if (icon) icon.classList.add('is-active');
  }

  function showLoading(button) {
    button.classList.remove('is-added');
    button.classList.add('is-loading');
    setIcon(button, 'spinner');
  }

  function showAdded(button) {
    button.classList.remove('is-loading');
    button.classList.add('is-added');
    setIcon(button, 'check');
    button.setAttribute('aria-label', button.dataset.removeLabel || 'Remove from cart');
  }

  function showIdle(button) {
    button.classList.remove('is-loading', 'is-added');
    setIcon(button, 'plus');
    button.disabled = button.dataset.available !== 'true';
    button.setAttribute('aria-label', button.dataset.addLabel || 'Add to cart');
  }

  function getCart() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  function syncCartUi(cart, response, variantId, source) {
    publish(PUB_SUB_EVENTS.cartUpdate, {
      source: source,
      productVariantId: variantId,
      cartData: response
    });
    cart.renderContents(response);
  }

  function withMinSpin(promise, startedAt) {
    return promise.then(function (result) {
      var elapsed = Date.now() - startedAt;
      var remaining = Math.max(0, MIN_SPIN_MS - elapsed);
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(result);
        }, remaining);
      });
    });
  }

  function addToCart(variantId) {
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
      cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    return fetch(routes.cart_add_url, config)
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (response.status) {
          throw new Error(response.description || response.message || 'Cart add failed');
        }
        if (cart) {
          syncCartUi(cart, response, variantId, 'artwistic-complete-the-look');
          if (typeof cart.close === 'function') {
            setTimeout(function () {
              cart.close();
            }, NOTIFICATION_AUTO_CLOSE_MS);
          }
        }
        return response.key;
      });
  }

  function removeFromCart(lineKey, variantId) {
    var cart = getCart();
    var config = fetchConfig('json');

    return fetch(routes.cart_change_url, {
      ...config,
      body: JSON.stringify({
        id: lineKey,
        quantity: 0,
        sections: cart
          ? cart.getSectionsToRender().map(function (section) {
              return section.id;
            })
          : undefined,
        sections_url: window.location.pathname
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (cart && response.sections) {
          syncCartUi(cart, response, variantId, 'artwistic-complete-the-look');
        }
        return response;
      });
  }

  document.querySelectorAll('[data-aw-look-add]').forEach(function (button) {
    if (button.dataset.available !== 'true') {
      button.disabled = true;
      return;
    }

    button.addEventListener('click', function () {
      if (button.disabled) return;
      var variantId = button.dataset.variantId;
      if (!variantId) return;

      var isAdded = button.classList.contains('is-added');
      button.disabled = true;
      showLoading(button);
      var startedAt = Date.now();

      if (!isAdded) {
        withMinSpin(addToCart(variantId), startedAt)
          .then(function (lineKey) {
            button.dataset.cartLineKey = lineKey;
            showAdded(button);
            button.disabled = false;
          })
          .catch(function (error) {
            console.error('artwistic-complete-the-look add:', error);
            showIdle(button);
          });
      } else {
        var lineKey = button.dataset.cartLineKey;
        withMinSpin(removeFromCart(lineKey, variantId), startedAt)
          .then(function () {
            delete button.dataset.cartLineKey;
            showIdle(button);
          })
          .catch(function (error) {
            console.error('artwistic-complete-the-look remove:', error);
            // Couldn't confirm the removal — leave it showing "Added"
            // rather than falsely reverting to "+" while it may still
            // be in the cart.
            showAdded(button);
            button.disabled = false;
          });
      }
    });
  });
})();
