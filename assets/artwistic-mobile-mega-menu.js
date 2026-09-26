/**
 * ARTWISTIC MOBILE MEGA MENU — tap-to-swap category tabs inside the
 * mobile drawer's full-screen submenu (snippets/header-drawer.liquid).
 *
 * Replaces Dawn's native drill-down for a menu column (tapping it would
 * slide in ANOTHER full-screen panel covering this one) with an
 * in-place content swap on the SAME screen — matching the desktop mega
 * menu's hover-to-reveal columns, tap instead of hover.
 *
 * The outer full-screen takeover (the drawer's own <details>/
 * header-drawer engine — open/close, focus trap, scroll lock, Escape/
 * outside-click) is completely untouched; this only toggles which
 * tab/panel pair is visible within an already-open screen.
 */
(function () {
  'use strict';

  document.querySelectorAll('[data-aw-mobile-menu]').forEach(function (menu) {
    var tabs = menu.querySelectorAll('[data-aw-mobile-tab]');
    var panels = menu.querySelectorAll('.aw-mobile-menu__panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (otherTab) {
          otherTab.classList.remove('is-active');
          otherTab.setAttribute('aria-selected', 'false');
        });
        panels.forEach(function (panel) {
          panel.classList.remove('is-active');
          panel.hidden = true;
        });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        var activePanel = menu.querySelector('#' + tab.getAttribute('aria-controls'));
        if (activePanel) {
          activePanel.classList.add('is-active');
          activePanel.hidden = false;
        }

        // Bring the newly active tab into view on the horizontal strip
        // without disturbing the rest of the page.
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });
  });
})();
