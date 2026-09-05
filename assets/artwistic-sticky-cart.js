/**
 * ARTWISTIC STICKY ADD TO CART (spec section 36).
 *
 * Shows a fixed mobile bar once the real Add to Cart button scrolls out
 * of view, mirroring price/availability from Dawn's stock price block and
 * submit button via MutationObserver — no polling, no duplicated cart
 * logic. The sticky button triggers the real submit button's click event,
 * so Dawn's existing variant validation and AJAX-cart handling run
 * unmodified.
 */
(function () {
  'use strict';

  function init(bar) {
    var priceSourceId = bar.getAttribute('data-aw-price-source');
    var buttonSourceId = bar.getAttribute('data-aw-button-source');
    var priceSource = document.getElementById(priceSourceId);
    var buttonSource = document.getElementById(buttonSourceId);
    var priceTarget = bar.querySelector('[data-aw-sticky-price]');
    var stickyButton = bar.querySelector('[data-aw-sticky-button]');

    if (!buttonSource || !stickyButton) return;

    function syncPrice() {
      if (priceSource && priceTarget) {
        priceTarget.innerHTML = priceSource.innerHTML;
      }
    }

    function syncButtonState() {
      var disabled = buttonSource.hasAttribute('disabled');
      stickyButton.toggleAttribute('disabled', disabled);
      stickyButton.textContent = buttonSource.textContent.trim();
    }

    syncPrice();
    syncButtonState();

    if (priceSource) {
      new MutationObserver(syncPrice).observe(priceSource, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    new MutationObserver(syncButtonState).observe(buttonSource, {
      attributes: true,
      attributeFilter: ['disabled'],
      childList: true,
      subtree: true,
      characterData: true,
    });

    stickyButton.addEventListener('click', function () {
      buttonSource.click();
    });

    var mediaQuery = window.matchMedia('(max-width: 749px)');
    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        var shouldShow = mediaQuery.matches && !entry.isIntersecting;
        bar.hidden = !shouldShow;
        bar.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        bar.classList.toggle('aw-sticky-atc--visible', shouldShow);
      },
      { rootMargin: '0px 0px -50% 0px' }
    );
    observer.observe(buttonSource);

    mediaQuery.addEventListener('change', function () {
      if (!mediaQuery.matches) {
        bar.hidden = true;
        bar.classList.remove('aw-sticky-atc--visible');
      }
    });
  }

  document.querySelectorAll('[data-aw-sticky-add-to-cart]').forEach(init);
})();
