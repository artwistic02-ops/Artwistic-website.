/**
 * ARTWISTIC BUILD YOUR STACK (spec section 40).
 *
 * A custom element that tracks which curated products are selected,
 * shows a running total (the literal sum of real prices — never a
 * fabricated discount), and adds every selected item's default variant
 * to the cart in one request via Shopify's Cart AJAX API. This does not
 * duplicate Dawn's cart drawer/notification rendering — after a
 * successful add it navigates to the cart page, which works regardless
 * of which cart type (page/drawer/notification) the merchant has chosen.
 */
(function () {
  'use strict';

  if (customElements.get('aw-stack-builder')) return;

  /** Minimal port of Shopify's classic money-format algorithm (no bundled dependency). */
  function formatMoney(cents, format) {
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var formatted = withCommas + '.' + parts[1];
    if (!format) return formatted;
    return format
      .replace(/\{\{\s*amount\s*\}\}/, formatted)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, withCommas);
  }

  class ArtwisticStackBuilder extends HTMLElement {
    connectedCallback() {
      this.checkboxes = Array.from(this.querySelectorAll('[data-stack-item]'));
      this.countEl = this.querySelector('[data-stack-count]');
      this.totalEl = this.querySelector('[data-stack-total]');
      this.submitButton = this.querySelector('[data-stack-submit]');
      this.statusEl = this.querySelector('[data-stack-status]');
      this.moneyFormat = this.getAttribute('data-money-format');
      this.cartUrl = this.getAttribute('data-cart-url') || '/cart';
      this.stackName = this.getAttribute('data-stack-name') || 'Build Your Stack';

      this.checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', this.updateSummary.bind(this));
      }, this);

      if (this.submitButton) {
        this.submitButton.addEventListener('click', this.addStackToCart.bind(this));
      }

      this.updateSummary();
    }

    selected() {
      return this.checkboxes.filter(function (checkbox) {
        return checkbox.checked;
      });
    }

    updateSummary() {
      var selected = this.selected();
      var total = selected.reduce(function (sum, checkbox) {
        return sum + Number(checkbox.getAttribute('data-price'));
      }, 0);

      if (this.countEl) {
        this.countEl.textContent = selected.length + (selected.length === 1 ? ' piece selected' : ' pieces selected');
      }
      if (this.totalEl) {
        this.totalEl.textContent = selected.length ? formatMoney(total, this.moneyFormat) : '';
      }
      if (this.submitButton) {
        this.submitButton.disabled = selected.length === 0;
      }
    }

    addStackToCart() {
      var selected = this.selected();
      if (selected.length === 0) return;

      this.submitButton.disabled = true;
      this.setStatus('Adding to cart…');

      var items = selected.map(function (checkbox) {
        return {
          id: Number(checkbox.getAttribute('data-variant-id')),
          quantity: 1,
          properties: { _artwistic_stack: this.stackName },
        };
      }, this);

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: items }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error('cart add failed');
          return response.json();
        })
        .then(function () {
          window.location.href = this.cartUrl;
        }.bind(this))
        .catch(function () {
          this.setStatus('Something went wrong adding your stack to the cart. Please try again.');
          this.submitButton.disabled = false;
        }.bind(this));
    }

    setStatus(message) {
      if (this.statusEl) this.statusEl.textContent = message;
    }
  }

  customElements.define('aw-stack-builder', ArtwisticStackBuilder);
})();
