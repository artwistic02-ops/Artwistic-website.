/**
 * ARTWISTIC FINISH ANNOTATION — updates the italic annotation line live
 * as the shopper picks a different option value, reading from the
 * option-notes JSON embedded by
 * snippets/artwistic-finish-annotation.liquid. Purely additive: it only
 * listens to the same native 'change' events Dawn's own variant-selects
 * component already dispatches, and never touches variant/price logic.
 */
(function () {
  'use strict';

  document.querySelectorAll('[data-aw-annotation]').forEach(function (annotation) {
    var container = annotation.closest('.product__info-container') || document;
    var notesScript = container.querySelector('[data-aw-option-notes]');
    var textEl = annotation.querySelector('[data-aw-annotation-text]');
    if (!notesScript || !textEl) return;

    var notes;
    try {
      notes = JSON.parse(notesScript.textContent);
    } catch (error) {
      return;
    }

    function update(value) {
      var note = notes[value];
      if (note) {
        textEl.textContent = note;
        annotation.hidden = false;
      } else {
        annotation.hidden = true;
      }
    }

    container.addEventListener('change', function (event) {
      var input = event.target;
      if (!input.closest('.product-form__input--swatch')) return;
      update(input.value);
    });
  });
})();
