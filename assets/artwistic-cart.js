/**
 * ARTWISTIC: Cart — milestone progress bar messaging + celebration
 * effect on threshold crossing, and coupon-code-to-checkout-param
 * redirect (Shopify's AJAX cart API cannot apply a discount code on
 * the cart page itself, so a real code is passed at checkout via the
 * documented ?discount= URL param instead of faking an "applied"
 * state client-side).
 */
(function () {
  'use strict';

  // This file is intentionally <script>-included from main-cart-items.liquid,
  // main-cart-footer.liquid AND cart-drawer.liquid so it's always present
  // wherever cart UI renders (page, footer-only, or drawer-only pages). That
  // means it can execute 2-3x on the same page load. Re-running the whole
  // IIFE is wasteful (duplicate DOMContentLoaded handlers, duplicate
  // PUB_SUB_EVENTS.cartUpdate subscriptions) and risks a subscriber firing
  // more than once per real cart update, so guard it to run exactly once.
  if (window.__awCartJsInitialized) return;
  window.__awCartJsInitialized = true;

  var MIN_SPIN_MS = 450;

  function getCartElement() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  // On the standalone /cart page there's no <cart-notification>/<cart-drawer>
  // to hand the response to — that's real, correct Dawn behavior (those
  // only exist for the popup/drawer UX). Without this, addCrossSellToCart
  // had nothing to update and fell back to a full page reload, which is
  // why the cross-sell "ADD" button never got to show "Added" and felt
  // jarring instead of smooth. <cart-items> is the real page-level cart
  // element (sections/main-cart-items.liquid) and already exposes Dawn's
  // own getSectionsToRender()/getSectionInnerHTML() — reuse the same
  // section-replace approach assets/cart.js itself uses for /cart/change.js,
  // since /cart/add.js returns the identical `sections` shape when a
  // `sections` param is sent.
  function renderCartPageSections(responseSections) {
    var cartItems = document.querySelector('cart-items');
    if (!cartItems || typeof cartItems.getSectionsToRender !== 'function') return false;

    cartItems.getSectionsToRender().forEach(function (section) {
      var sourceHtml = responseSections[section.section];
      if (!sourceHtml) return;
      var elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
      var parsed = new DOMParser().parseFromString(sourceHtml, 'text/html').querySelector(section.selector);
      if (elementToReplace && parsed) elementToReplace.innerHTML = parsed.innerHTML;
    });
    return true;
  }

  function addCrossSellToCart(button) {
    if (button.disabled) return;
    var variantId = button.dataset.variantId;
    if (!variantId || typeof fetchConfig !== 'function' || !window.routes) return;

    button.disabled = true;
    var startedAt = Date.now();
    var cart = getCartElement();
    var cartItems = document.querySelector('cart-items');
    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    // On the /cart page, cart-notification and <cart-items> can both be
    // present at once (the notification is a global popup, not exclusive
    // to drawer-type carts) — request the union of whatever each one
    // needs, not just whichever is found first, or the response won't
    // carry the data the other one needs to update.
    var neededSectionIds = {};
    [cart, cartItems].forEach(function (source) {
      if (source && typeof source.getSectionsToRender === 'function') {
        source.getSectionsToRender().forEach(function (section) {
          neededSectionIds[section.id] = true;
        });
      }
    });
    var sectionIdList = Object.keys(neededSectionIds);

    var formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);
    if (sectionIdList.length) {
      formData.append('sections', sectionIdList);
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

        // On the standalone /cart page, cart-notification exists too (it's
        // a global, always-present popup, not exclusive to drawer-type
        // carts) — so `cart` being truthy does NOT mean we're in a drawer
        // context. renderContents() only ever updates the notification
        // POPUP's own preview; the real page underneath (line items,
        // estimated total, item count) stays stale until a manual reload
        // unless its own sections are updated too. So both are updated
        // here, independently, whenever each is actually present —
        // wrapped separately so one throwing can never block the other or
        // block the button reaching its "Added" state below.
        var updatedSomething = false;

        if (response.sections && cartItems && typeof cartItems.getSectionsToRender === 'function') {
          try {
            if (renderCartPageSections(response.sections)) updatedSomething = true;
          } catch (e) {
            if (window.console && window.console.error) {
              window.console.error('[artwistic-cart] cross-sell page-section update failed:', e);
            }
          }
        }

        if (cart) {
          try {
            cart.renderContents(response);
            updatedSomething = true;
          } catch (e) {
            if (window.console && window.console.error) {
              window.console.error('[artwistic-cart] cross-sell notification render failed:', e);
            }
          }
        }

        if (updatedSomething) {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'artwistic-cart-cross-sell',
            productVariantId: variantId,
            cartData: response,
          });
        } else {
          window.location.reload();
        }

        var elapsed = Date.now() - startedAt;
        var wait = Math.max(MIN_SPIN_MS - elapsed, 0);
        window.setTimeout(function () {
          button.classList.add('is-added');
          var label = button.querySelector('[data-aw-cross-sell-label]');
          if (label) label.textContent = 'Added';
        }, wait);
      })
      .catch(function () {
        button.disabled = false;
      });
  }

  function formatMoney(amount, format) {
    var value = amount.toFixed(2);
    var valueNoDecimals = Math.round(amount).toString();
    if (!format) return value;
    return format
      .replace(/\{\{\s*amount\s*\}\}/, value)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, valueNoDecimals)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','))
      .replace(/<[^>]+>/g, '');
  }

  function parseMilestones(raw) {
    return raw
      .split('|')
      .filter(Boolean)
      .map(function (entry) {
        var parts = entry.split(':');
        return { amount: parseFloat(parts[0]), key: parts[1], label: parts[2] };
      })
      .sort(function (a, b) {
        return a.amount - b.amount;
      });
  }

  function sparkBurstFrom(node) {
    var rect = node.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var colors = ['#e6c491', '#a97c4f'];

    for (var i = 0; i < 16; i++) {
      var spark = document.createElement('span');
      spark.className = 'aw-cart-spark';
      var angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      var distance = 36 + Math.random() * 46;
      spark.style.left = cx + 'px';
      spark.style.top = cy + 'px';
      spark.style.setProperty('--aw-spark-dx', Math.cos(angle) * distance + 'px');
      spark.style.setProperty('--aw-spark-dy', Math.sin(angle) * distance + 'px');
      spark.style.background = colors[i % colors.length];
      document.body.appendChild(spark);
      spark.addEventListener('animationend', function () {
        this.remove();
      });
    }
  }

  /* The full "you just unlocked something" sequence: the node pops,
     a double ring shockwave fires from that exact node's position, it
     keeps a brief after-glow, a spark burst flies outward, and the
     whole progress card plus the headline message flash/pop once —
     all in the same beat, so a crossed milestone is unmissable. */
  function celebrate(card, message, node) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    node.classList.remove('is-pulsing', 'is-glowing');
    void node.offsetWidth;
    node.classList.add('is-pulsing', 'is-glowing');
    window.setTimeout(function () {
      node.classList.remove('is-pulsing');
    }, 900);
    window.setTimeout(function () {
      node.classList.remove('is-glowing');
    }, 5600);

    sparkBurstFrom(node);

    card.classList.remove('is-flashing');
    void card.offsetWidth;
    card.classList.add('is-flashing');
    window.setTimeout(function () {
      card.classList.remove('is-flashing');
    }, 900);

    if (message) {
      message.classList.remove('is-announcing');
      void message.offsetWidth;
      message.classList.add('is-announcing');
    }
  }

  // Every real cart update replaces this whole section's markup with a
  // fresh server render (Dawn's own AJAX mechanism, not something we
  // control) — so the fill bar is a brand-new DOM node each time, already
  // sitting at its final width from the server. A CSS `transition` has
  // nothing to animate from on a node that never had an "old" width, so
  // it was jumping straight to the new value instead of visibly sliding.
  // Remembering the last known percentage across calls lets us snap the
  // fresh node back to where it WAS, then animate forward on the next
  // frame — a real, visible left-to-right slide every time, not just on
  // first load.
  var lastKnownFillPct = null;

  function updateProgressBar(root, overrideTotal) {
    var cartTotal = typeof overrideTotal === 'number' ? overrideTotal : parseFloat(root.dataset.cartTotal || '0');
    var milestones = parseMilestones(root.dataset.milestones || '');
    if (!milestones.length) return;

    var fill = root.querySelector('[data-aw-cart-progress-fill]');
    var marker = root.querySelector('[data-aw-cart-progress-marker]');
    var message = root.querySelector('[data-aw-cart-progress-message]');
    var maxAmount = milestones[milestones.length - 1].amount;
    var pct = Math.min((cartTotal / maxAmount) * 100, 100);

    if (fill) {
      var startPct = lastKnownFillPct !== null ? lastKnownFillPct : pct;
      fill.style.transition = 'none';
      fill.style.width = startPct + '%';
      void fill.offsetWidth;
      fill.style.transition = '';
      window.requestAnimationFrame(function () {
        fill.style.width = pct + '%';
      });
    }

    // The "you are here" marker moves in lockstep with the fill's
    // leading edge, using the same snap-back-then-animate technique
    // since it's also on a freshly server-rendered node each update.
    if (marker) {
      var markerStartPct = lastKnownFillPct !== null ? lastKnownFillPct : pct;
      marker.style.transition = 'none';
      marker.style.left = markerStartPct + '%';
      void marker.offsetWidth;
      marker.style.transition = '';
      window.requestAnimationFrame(function () {
        marker.style.left = pct + '%';
      });
    }

    lastKnownFillPct = pct;

    var nextMilestone = null;
    for (var i = 0; i < milestones.length; i++) {
      if (cartTotal < milestones[i].amount) {
        nextMilestone = milestones[i];
        break;
      }
    }

    if (message) {
      if (nextMilestone) {
        var remaining = nextMilestone.amount - cartTotal;
        message.innerHTML =
          'Add <span class="accent">' +
          formatMoney(remaining, root.dataset.moneyFormat) +
          '</span> more to unlock ' +
          nextMilestone.label;
      } else {
        message.textContent = "You've unlocked every reward on this order!";
      }
    }

    // Celebrate every real crossing (add enough to pass a threshold),
    // every time — not gated to "once per browser session". Comparing
    // against the node's own current class (its state from just before
    // this update) rather than a persisted history means it fires again
    // if you drop below a threshold and cross it again later, but never
    // re-fires on a render where nothing actually changed.
    milestones.forEach(function (milestone) {
      var node = root.querySelector('[data-aw-cart-progress-node="' + milestone.key + '"]');
      if (!node) return;
      var wasReached = node.classList.contains('is-reached');
      var nowReached = cartTotal >= milestone.amount;
      node.classList.toggle('is-reached', nowReached);
      if (nowReached && !wasReached) celebrate(root, message, node);
    });
  }

  function refreshAllProgressBars() {
    document.querySelectorAll('[data-aw-cart-progress]').forEach(updateProgressBar);
  }

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-aw-coupon-form]');
    if (!form) return;
    event.preventDefault();
    var input = form.querySelector('[data-aw-coupon-input]');
    var code = input && input.value.trim();
    if (!code) return;
    // Shopify's AJAX cart API can't apply a discount code; the real
    // mechanism is passing it as a URL param on the way to checkout,
    // where Shopify itself applies it.
    window.location.href = '/checkout?discount=' + encodeURIComponent(code);
  });

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-aw-offers-toggle]');
    if (toggle) {
      var drawer = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!drawer) return;
      var open = toggle.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      drawer.style.maxHeight = open ? drawer.scrollHeight + 'px' : '0px';
      return;
    }

    var chip = event.target.closest('[data-aw-offer-code]');
    if (chip) {
      var form = chip.closest('.aw-cart-coupon-block');
      var input = form && form.querySelector('[data-aw-coupon-input]');
      if (input) {
        input.value = chip.dataset.awOfferCode;
        input.focus();
      }
      return;
    }

    var crossSellBtn = event.target.closest('[data-aw-cross-sell-add]');
    if (crossSellBtn) {
      addCrossSellToCart(crossSellBtn);
    }
  });

  /* Item count, progress bar, and cross-sell "Added" badges were each
     independently patched from whatever data happened to be nearby —
     the count from the pub/sub payload, the progress bar from a DOM
     attribute that's only fresh if that exact element got re-rendered,
     and the cross-sell badges from a server render that only happens on
     a full reload (the cross-sell rail sits outside the region Dawn's
     AJAX swaps on a quantity change or remove). That let them silently
     disagree with each other and with the real cart. This function is
     the single source of truth: every real cart update (add, remove,
     quantity change, cross-sell add) hands us the SAME authoritative
     `cartData` object Dawn's own cart system always provides — real
     item_count, real total_price, real items with real variant_ids —
     and every piece of UI that depends on cart state is updated from
     that one object, together, in one pass. */
  function applyCartData(cartData) {
    if (typeof cartData.item_count === 'number') {
      document.querySelectorAll('[data-aw-cart-count]').forEach(function (el) {
        el.textContent = '(' + cartData.item_count + ')';
      });
    }

    if (typeof cartData.total_price === 'number') {
      var totalInMajorUnits = cartData.total_price / 100;
      document.querySelectorAll('[data-aw-cart-progress]').forEach(function (root) {
        updateProgressBar(root, totalInMajorUnits);
      });
    }

    if (cartData.items) {
      var cartVariantIds = {};
      cartData.items.forEach(function (item) {
        cartVariantIds[item.variant_id] = true;
      });
      document.querySelectorAll('[data-aw-cross-sell-add]').forEach(function (btn) {
        var variantId = parseInt(btn.dataset.variantId, 10);
        var inCart = !!cartVariantIds[variantId];
        btn.classList.toggle('is-added', inCart);
        var label = btn.querySelector('[data-aw-cross-sell-label]');
        if (label) label.textContent = inCart ? 'Added' : 'Add';
      });
    }
  }

  function syncCartUI(event) {
    // Dawn's own pub/sub (assets/pubsub.js) calls subscribers with the
    // payload object directly — { source, cartData, variantId } — not a
    // DOM CustomEvent with a .detail wrapper. Support both shapes so this
    // also works if ever invoked from a real 'cart:update' DOM event.
    var cartData = event && (event.cartData || (event.detail && event.detail.cartData));

    // /cart/add.js's response, for a single item, is shaped like the
    // ADDED LINE ITEM (id, price, line_price, variant_id, ...) — it does
    // NOT carry cart-level item_count/total_price the way /cart/change.js
    // and /cart.js do. That's exactly the gap that caused the progress
    // bar to read as "0" after a cross-sell add: the payload existed, so
    // the old code used it, but it was missing the two fields the
    // progress bar and count actually need. Treat "no real cart-level
    // data" as equivalent to "no payload" and always fall back to a real
    // /cart.js fetch in that case, rather than silently skipping (and
    // leaving stale state) or trusting a payload that isn't shaped right.
    var hasCartLevelData = cartData && typeof cartData.total_price === 'number' && typeof cartData.item_count === 'number';

    if (hasCartLevelData) {
      applyCartData(cartData);
      return;
    }

    // No payload, or a payload missing cart-level totals — fetch the
    // real, current cart state directly rather than trusting whatever's
    // already sitting in the DOM.
    fetch('/cart.js')
      .then(function (response) {
        return response.json();
      })
      .then(applyCartData)
      .catch(function () {
        /* leave the UI as-is rather than show wrong numbers */
      });
  }

  // This script is loaded with `defer`, so by the time it runs the DOM is
  // already fully parsed and queryable — no need to wait for
  // DOMContentLoaded to paint the first frame. That listener alone was the
  // bug: Shopify's Theme Editor preview iframe doesn't always do a hard
  // navigation when switching between preview paths (e.g. Home -> Cart),
  // so DOMContentLoaded can simply never fire again on that document,
  // leaving the progress message permanently blank. Painting immediately
  // fixes that; the listener stays as a harmless fallback.
  refreshAllProgressBars();
  document.addEventListener('DOMContentLoaded', refreshAllProgressBars);

  document.addEventListener('cart:update', refreshAllProgressBars);
  document.addEventListener('cart:refresh', refreshAllProgressBars);

  /* Dawn's real pub/sub (assets/pubsub.js) calls every subscriber
     synchronously via Array.prototype.map inside publish(), and that
     publish() call happens INSIDE cart.js's own fetch .then() — after
     cart.js has already finished writing the fresh quantity/price into
     the DOM, but still inside the same try path as its .catch(). If a
     subscriber throws, that exception is what cart.js's .catch() sees,
     and it shows its generic "There was an error updating your cart"
     banner even though the real cart update already succeeded. These
     two subscribers are defensively coded, but wrapping them here means
     a genuinely unexpected DOM shape (e.g. a threshold string edge case)
     can never again surface as a false "cart update failed" error. */
  function safeSubscriber(fn) {
    return function (data) {
      try {
        return fn(data);
      } catch (e) {
        if (window.console && window.console.error) {
          window.console.error('[artwistic-cart] subscriber error (cart update itself still succeeded):', e);
        }
      }
    };
  }

  if (typeof subscribe === 'function' && window.PUB_SUB_EVENTS) {
    subscribe(PUB_SUB_EVENTS.cartUpdate, safeSubscriber(syncCartUI));
  }
})();
