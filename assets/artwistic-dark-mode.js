(function () {
  var STORAGE_KEY = 'aw_dark_mode';
  var ATTR = 'data-aw-theme';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isDark() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark';
    } catch (error) {
      return false;
    }
  }

  /* Real expanding circle (Web Animations API) from the toggle's own
     screen position — validated in the "Artwistic Wishlist Hub" artifact
     before porting here. Paired with the global colour-transition rule in
     artwistic-global.css, this is what makes every element fade smoothly
     instead of jump-cutting when the theme swaps. */
  function spawnRipple(x, y, goingDark) {
    if (reduceMotion) return;
    var veil = document.createElement('div');
    veil.className = 'aw-dark-ripple';
    veil.style.left = x + 'px';
    veil.style.top = y + 'px';
    veil.style.setProperty('--aw-dark-ripple-color', goingDark ? '#17130F' : '#FBF7F1');
    document.body.appendChild(veil);

    var maxDist = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    var endScale = (maxDist * 2.1) / 24;

    var anim = veil.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0)', opacity: 0.9 },
        { transform: 'translate(-50%,-50%) scale(' + endScale * 0.5 + ')', opacity: 0.55, offset: 0.55 },
        { transform: 'translate(-50%,-50%) scale(' + endScale + ')', opacity: 0 }
      ],
      { duration: 1100, easing: 'cubic-bezier(0.16,1,0.3,1)' }
    );
    anim.onfinish = function () {
      veil.remove();
    };
  }

  function setDark(dark, x, y) {
    if (typeof x === 'number' && typeof y === 'number') {
      spawnRipple(x, y, dark);
    }
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
    var rect = button.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    setDark(document.documentElement.getAttribute(ATTR) !== 'dark', x, y);
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-aw-dark-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(isDark()));
    });
  });
})();
