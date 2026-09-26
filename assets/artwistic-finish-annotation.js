/**
 * ARTWISTIC FINISH ANNOTATION.
 *
 * Updates the italic annotation line when the selected option changes,
 * by subscribing to Dawn's own PUB_SUB_EVENTS.variantChange (published
 * by product-info.js after every real variant swap) rather than
 * re-implementing any option-tracking logic.
 */
(function () {
  'use strict';

  if (typeof subscribe === 'undefined' || typeof PUB_SUB_EVENTS === 'undefined') return;

  document.querySelectorAll('[data-aw-annotation]').forEach(function (annotationEl) {
    var container = annotationEl.closest('.product__info-container') || document;
    var notesScript = container.querySelector('[data-aw-option-notes]');
    var textEl = annotationEl.querySelector('[data-aw-annotation-text]');
    if (!notesScript || !textEl) return;

    var notes;
    try {
      notes = JSON.parse(notesScript.textContent);
    } catch (error) {
      return;
    }

    subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
      var variant = event.data.variant;
      if (!variant) return;
      var note = notes[variant.option1] || notes[variant.option2] || notes[variant.option3];
      if (note) {
        textEl.textContent = note;
        annotationEl.hidden = false;
      } else {
        annotationEl.hidden = true;
      }
    });
  });
})();
