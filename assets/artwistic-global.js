/**
 * ARTWISTIC GLOBAL — shared helpers used by more than one ARTWISTIC feature module.
 * Keep this file small. Feature-specific logic belongs in artwistic-<feature>.js.
 * See ARTWISTIC_CHANGELOG.md and docs/FEATURE_REGISTER.md.
 */
(function () {
  'use strict';

  if (window.Artwistic) return;

  /** Debounce a function by `wait` ms. */
  function debounce(fn, wait) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** True when the visitor has requested reduced motion. */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Trap focus within `container` while active. Returns a release function.
   * Used by mega menu, drawers, and modals so each feature doesn't
   * reimplement focus management.
   */
  function trapFocus(container, initialFocusEl) {
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function focusableEls() {
      return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
    }

    function onKeydown(event) {
      if (event.key !== 'Tab') return;
      const els = focusableEls();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeydown);
    (initialFocusEl || focusableEls()[0] || container).focus();

    return function release() {
      container.removeEventListener('keydown', onKeydown);
    };
  }

  /** Dispatch a namespaced custom event with `detail`, bubbling by default. */
  function emit(name, detail, target) {
    (target || document).dispatchEvent(
      new CustomEvent(`artwistic:${name}`, { detail, bubbles: true })
    );
  }

  window.Artwistic = Object.freeze({
    debounce,
    prefersReducedMotion,
    trapFocus,
    emit,
  });
})();
