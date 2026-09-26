/**
 * ARTWISTIC: quick-add size picker — for a product card's "+" button
 * on a product with exactly one real option (almost always Size).
 * Data comes from a real JSON blob already embedded on the page by
 * snippets/artwistic-card-actions.liquid (card_product.variants), so
 * no network round-trip is needed to open the sheet. Picking an
 * available value resolves a real variant id and reuses the exact
 * same /cart/add.js flow as a direct single-variant add
 * (window.awProductCard.addToCart), so there is exactly one add-to-
 * cart code path on the whole site, not two.
 */
(function () {
  'use strict';

  var backdrop, sheet, titleEl, imageEl, optionLabelEl, optionsEl;
  var activeButton = null;

  function build() {
    backdrop = document.createElement('div');
    backdrop.className = 'aw-quick-add-backdrop';
    backdrop.setAttribute('hidden', '');

    sheet = document.createElement('div');
    sheet.className = 'aw-quick-add-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML =
      '<button type="button" class="aw-quick-add-sheet__close" data-aw-quick-add-close aria-label="Close"></button>' +
      '<div class="aw-quick-add-sheet__head">' +
      '<div class="aw-quick-add-sheet__image"></div>' +
      '<div>' +
      '<p class="aw-quick-add-sheet__title"></p>' +
      '<p class="aw-quick-add-sheet__option-label"></p>' +
      '</div>' +
      '</div>' +
      '<div class="aw-quick-add-sheet__options"></div>';

    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);

    imageEl = sheet.querySelector('.aw-quick-add-sheet__image');
    titleEl = sheet.querySelector('.aw-quick-add-sheet__title');
    optionLabelEl = sheet.querySelector('.aw-quick-add-sheet__option-label');
    optionsEl = sheet.querySelector('.aw-quick-add-sheet__options');

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) close();
    });
    sheet.querySelector('[data-aw-quick-add-close]').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !backdrop.hidden) close();
    });
  }

  function open(button, dataScript) {
    if (!backdrop) build();

    var data;
    try {
      data = JSON.parse(dataScript.textContent);
    } catch (e) {
      return;
    }

    activeButton = button;
    titleEl.textContent = data.title;
    optionLabelEl.textContent = 'Select ' + data.optionName;
    imageEl.innerHTML = data.image ? '<img src="' + data.image + '" alt="">' : '';

    optionsEl.innerHTML = '';
    data.values.forEach(function (value) {
      var optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'aw-quick-add-sheet__option';
      optionButton.textContent = value.label;
      if (!value.available || !value.variantId) {
        optionButton.disabled = true;
        optionButton.classList.add('is-unavailable');
      } else {
        optionButton.addEventListener('click', function () {
          selectVariant(value.variantId);
        });
      }
      optionsEl.appendChild(optionButton);
    });

    backdrop.hidden = false;
    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
    });
  }

  function selectVariant(variantId) {
    if (!activeButton) return;
    activeButton.dataset.variantId = variantId;
    var button = activeButton;
    close();
    if (window.awProductCard) {
      window.awProductCard.addToCart(button);
    }
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    window.setTimeout(function () {
      backdrop.hidden = true;
    }, 250);
    activeButton = null;
  }

  window.awQuickAdd = { open: open };
})();
