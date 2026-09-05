/**
 * ARTWISTIC MEGA MENU — hover-intent enhancement over Dawn's stock
 * click/keyboard mega menu (header-menu custom element + native
 * <details>/<summary> in snippets/header-mega-menu.liquid).
 *
 * Progressive enhancement only: if this script fails to load, the menu
 * still opens/closes correctly via Dawn's native click and keyboard
 * handling. This only adds a "hover to open, small delay before close"
 * behavior on pointer:fine (mouse) devices, which shoppers expect from a
 * premium nav and which native <details> doesn't provide on its own.
 */
(function () {
  'use strict';

  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (!window.matchMedia('(min-width: 990px)').matches) return;

  var OPEN_DELAY = 60;
  var CLOSE_DELAY = 250;

  document.querySelectorAll('.header__inline-menu header-menu').forEach(function (menu) {
    var details = menu.querySelector('details');
    if (!details) return;

    var openTimer = null;
    var closeTimer = null;

    function clearTimers() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    }

    menu.addEventListener('mouseenter', function () {
      clearTimers();
      openTimer = setTimeout(function () {
        details.setAttribute('open', '');
      }, OPEN_DELAY);
    });

    menu.addEventListener('mouseleave', function () {
      clearTimers();
      closeTimer = setTimeout(function () {
        details.removeAttribute('open');
      }, CLOSE_DELAY);
    });
  });
})();
