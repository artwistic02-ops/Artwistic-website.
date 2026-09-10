/**
 * ARTWISTIC WISHLIST — core module (spec section 41).
 *
 * Guest persistence via localStorage, namespaced so it never collides
 * with Dawn or app-injected storage. No account/app dependency; this
 * file only manages the list of saved product handles and keeps every
 * toggle button on the current page in sync with it.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'aw_wishlist';

  function readList() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeList(handles) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch (error) {
      /* Storage unavailable (private mode, quota) — fail silently, buttons remain functional per-view. */
    }
  }

  function has(handle) {
    return readList().indexOf(handle) !== -1;
  }

  function add(handle) {
    var list = readList();
    if (list.indexOf(handle) !== -1) return false;
    list.push(handle);
    writeList(list);
    syncButtons();
    updateCountBubble();
    return true;
  }

  function toggle(handle) {
    var list = readList();
    var index = list.indexOf(handle);
    if (index === -1) {
      list.push(handle);
    } else {
      list.splice(index, 1);
    }
    writeList(list);
    syncButtons();
    updateCountBubble();
    var detail = { handle: handle, saved: index === -1, list: list };
    if (window.Artwistic) {
      window.Artwistic.emit('wishlist:change', detail);
    } else {
      document.dispatchEvent(new CustomEvent('artwistic:wishlist:change', { detail: detail, bubbles: true }));
    }
    return detail.saved;
  }

  function syncButtons() {
    var list = readList();
    document.querySelectorAll('[data-aw-wishlist-toggle]').forEach(function (button) {
      var handle = button.getAttribute('data-aw-product-handle');
      var saved = list.indexOf(handle) !== -1;
      button.setAttribute('aria-pressed', String(saved));
    });
  }

  function updateCountBubble() {
    var count = readList().length;
    document.querySelectorAll('[data-aw-wishlist-count]').forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-aw-wishlist-toggle]');
    if (!button) return;
    var handle = button.getAttribute('data-aw-product-handle');
    if (!handle) return;
    toggle(handle);
  });

  document.addEventListener('DOMContentLoaded', function () {
    syncButtons();
    updateCountBubble();
  });

  if (document.readyState !== 'loading') {
    syncButtons();
    updateCountBubble();
  }

  window.ArtwisticWishlist = Object.freeze({
    list: readList,
    has: has,
    add: add,
    toggle: toggle,
  });
})();
