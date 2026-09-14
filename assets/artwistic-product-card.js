/**
 * ARTWISTIC: global product card — direct add-to-cart (first/selected
 * variant, no modal) and real swatch-driven variant preview. Reuses
 * Dawn's own cart-drawer/cart-notification section re-render + pub/sub
 * so the cart icon and drawer update exactly like Dawn's native
 * product-form. See snippets/card-product.liquid, ARTWISTIC_CHANGELOG.md.
 */
(function () {
  'use strict';

  function getCart() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  function addToCart(button) {
    var variantId = button.getAttribute('data-variant-id');
    if (!variantId || button.hasAttribute('disabled')) return;

    button.setAttribute('disabled', 'disabled');

    var cart = getCart();
    var body = { items: [{ id: variantId, quantity: 1 }] };
    if (cart) {
      body.sections = cart.getSectionsToRender().map(function (section) {
        return section.id;
      });
      body.sections_url = window.location.pathname;
    }

    fetch(window.routes.cart_add_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'artwistic-product-card',
              productVariantId: variantId,
              errors: result.data.errors || result.data.description,
              message: result.data.message,
            });
          }
          return;
        }
        button.classList.add('is-added');
        setTimeout(function () {
          button.classList.remove('is-added');
        }, 1200);
        if (cart && typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'artwistic-product-card',
            productVariantId: variantId,
            cartData: result.data,
          }).then(function () {
            cart.renderContents(result.data);
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      })
      .finally(function () {
        button.removeAttribute('disabled');
      });
  }

  document.addEventListener('click', function (event) {
    var addButton = event.target.closest('[data-aw-card-add]');
    if (addButton) {
      event.preventDefault();
      addToCart(addButton);
      return;
    }

    var swatch = event.target.closest('[data-aw-card-swatch]');
    if (swatch) {
      event.preventDefault();
      var row = swatch.closest('[data-aw-card-swatches]');
      row.querySelectorAll('[data-aw-card-swatch]').forEach(function (other) {
        other.classList.remove('is-selected');
        other.setAttribute('aria-pressed', 'false');
      });
      swatch.classList.add('is-selected');
      swatch.setAttribute('aria-pressed', 'true');

      var card = swatch.closest('.card-wrapper') || swatch.closest('[data-aw-card]');
      if (card) {
        var addBtn = card.querySelector('[data-aw-card-add]');
        var newVariantId = swatch.getAttribute('data-variant-id');
        if (addBtn && newVariantId) addBtn.setAttribute('data-variant-id', newVariantId);

        var newImage = swatch.getAttribute('data-variant-image');
        if (newImage) {
          var img = card.querySelector('.card__media img');
          if (img) img.src = newImage;
        }
      }
    }
  });
})();
