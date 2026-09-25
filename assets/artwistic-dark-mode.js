(function () {
  var STORAGE_KEY = 'aw_dark_mode';
  var ATTR = 'data-aw-theme';

  function isDark() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark';
    } catch (error) {
      return false;
    }
  }

  function setDark(dark) {
    document.documentElement.setAttribute(ATTR, dark ? 'dark' : 'light');
    try {
      window.localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch (error) {
      /* Storage unavailable — toggle still works for this page view. */
    }
    document.querySelectorAll('[data-aw-dark-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute(
        'aria-label',
        dark ? button.dataset.labelOff || button.getAttribute('aria-label') : button.dataset.labelOn || button.getAttribute('aria-label')
      );
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-aw-dark-toggle]');
    if (!button) return;
    setDark(document.documentElement.getAttribute(ATTR) !== 'dark');
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-aw-dark-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(isDark()));
    });
  });
})();
