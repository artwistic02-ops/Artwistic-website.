/**
 * ARTWISTIC: Search prompt typing animation — sits in front of Dawn's
 * real search input (snippets/header-search.liquid), cycling through
 * merchant-set prompts (settings.aw_search_prompts) character by
 * character, purely cosmetic. Pauses/hides the moment the real input
 * has focus or a value, since Dawn's real predictive search
 * (assets/predictive-search.js) and results (search.results) are
 * completely untouched — this never intercepts typing or submission.
 */
(function () {
  'use strict';

  var TYPE_MS = 55;
  var ERASE_MS = 30;
  var HOLD_MS = 1400;

  function initOne(el) {
    var prompts = (el.dataset.prompts || '')
      .split(',')
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    if (!prompts.length) return;

    var input = el.closest('.field').querySelector('.search__input');
    if (!input) return;

    var promptIndex = 0;
    var timer = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isIdle() {
      return document.activeElement !== input && input.value === '';
    }

    function typeText(text, cb) {
      var i = 0;
      (function step() {
        if (!isIdle()) return;
        el.textContent = text.slice(0, i);
        i++;
        if (i <= text.length) {
          timer = window.setTimeout(step, TYPE_MS);
        } else {
          timer = window.setTimeout(cb, HOLD_MS);
        }
      })();
    }

    function eraseText(text, cb) {
      var i = text.length;
      (function step() {
        if (!isIdle()) return;
        el.textContent = text.slice(0, i);
        i--;
        if (i >= 0) {
          timer = window.setTimeout(step, ERASE_MS);
        } else {
          cb();
        }
      })();
    }

    function cycle() {
      if (!isIdle()) {
        el.textContent = '';
        return;
      }
      var text = prompts[promptIndex % prompts.length];
      promptIndex++;
      typeText(text, function () {
        eraseText(text, cycle);
      });
    }

    function stop() {
      window.clearTimeout(timer);
      el.textContent = '';
    }

    function maybeResume() {
      if (isIdle() && !timer) {
        cycle();
      }
    }

    input.addEventListener('focus', stop);
    input.addEventListener('input', stop);
    input.addEventListener('blur', function () {
      window.setTimeout(maybeResume, 100);
    });

    if (!reducedMotion) {
      cycle();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-aw-search-typing]').forEach(initOne);
  });
})();
