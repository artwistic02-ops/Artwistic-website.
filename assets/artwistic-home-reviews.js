/**
 * ARTWISTIC HOMEPAGE REVIEWS — same FLIP expand-in-place lightbox
 * technique as the product page (assets/artwistic-reviews.js): measure
 * the clicked avatar's on-screen rect, pin the dialog there, force a
 * reflow, let CSS transitions carry it to the centered target rect.
 * Data here comes from our own rendered JSON (see
 * sections/artwistic-home-reviews.liquid), not Judge.me DOM scraping,
 * since these are merchant-curated metaobject reviews.
 */
(function () {
  'use strict';

  function targetRect() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var w = Math.min(vw * 0.9, 832, vw - 32);
    var h = Math.min(vh * 0.85, 720, vh - 32);
    return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h, radius: 16 };
  }

  function pinDialog(dialog, rect) {
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    dialog.style.width = rect.width + 'px';
    dialog.style.height = rect.height + 'px';
    dialog.style.borderRadius = rect.radius + 'px';
  }

  function starsMarkup(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= rating ? '★' : '☆';
    return out;
  }

  var state = { open: false, restRect: null };

  function openLightbox(data, sourceEl) {
    var lightbox = document.querySelector('[data-aw-review-lightbox]');
    if (!lightbox || state.open || !data) return;
    var dialog = lightbox.querySelector('[data-aw-review-dialog]');
    if (!dialog) return;

    var textHost = lightbox.querySelector('[data-aw-review-text]');
    var nameHost = lightbox.querySelector('[data-aw-review-name]');
    var cityHost = lightbox.querySelector('[data-aw-review-city]');
    var starsHost = lightbox.querySelector('[data-aw-review-stars]');
    var avatarHost = lightbox.querySelector('[data-aw-review-avatar]');
    var mediaHost = lightbox.querySelector('[data-aw-review-media]');
    var mediaImg = lightbox.querySelector('[data-aw-review-media-img]');

    if (textHost) textHost.textContent = data.text || '';
    if (nameHost) nameHost.textContent = data.name || '';
    if (cityHost) cityHost.textContent = data.city || '';
    if (starsHost) starsHost.textContent = starsMarkup(data.rating || 0);
    if (avatarHost) {
      if (data.photo) {
        avatarHost.innerHTML = '<img src="' + data.photo + '" alt="">';
      } else {
        avatarHost.textContent = data.initials || '';
      }
    }
    if (mediaHost && mediaImg) {
      if (data.photo) {
        mediaImg.src = data.photo;
        mediaHost.hidden = false;
        lightbox.classList.remove('aw-review-lightbox--text-only');
      } else {
        mediaHost.hidden = true;
        lightbox.classList.add('aw-review-lightbox--text-only');
      }
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sourceAvatar = sourceEl ? sourceEl.querySelector('.aw-avatar') : null;
    var sourceRect = sourceAvatar ? sourceAvatar.getBoundingClientRect() : null;

    lightbox.hidden = false;
    state.open = true;
    document.body.classList.add('aw-review-lb-open');

    if (reduceMotion || !sourceRect) {
      lightbox.classList.add('is-open');
      dialog.classList.add('is-settled');
      return;
    }

    state.restRect = sourceRect;
    dialog.classList.remove('is-settled');
    pinDialog(dialog, { left: sourceRect.left, top: sourceRect.top, width: sourceRect.width, height: sourceRect.height, radius: sourceRect.width / 2 });
    // eslint-disable-next-line no-unused-expressions
    dialog.offsetHeight;
    lightbox.classList.add('is-open');
    pinDialog(dialog, targetRect());

    var revealTimer = setTimeout(function () {
      dialog.classList.add('is-settled');
    }, 260);
    dialog.dataset.awRevealTimer = String(revealTimer);
  }

  function closeLightbox() {
    var lightbox = document.querySelector('[data-aw-review-lightbox]');
    if (!lightbox || !state.open) return;
    var dialog = lightbox.querySelector('[data-aw-review-dialog]');

    if (dialog && dialog.dataset.awRevealTimer) {
      clearTimeout(Number(dialog.dataset.awRevealTimer));
      delete dialog.dataset.awRevealTimer;
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.open = false;
    document.body.classList.remove('aw-review-lb-open');

    if (reduceMotion || !state.restRect || !dialog) {
      lightbox.classList.remove('is-open');
      if (dialog) dialog.classList.remove('is-settled');
      setTimeout(function () {
        lightbox.hidden = true;
      }, 280);
      return;
    }

    dialog.classList.remove('is-settled');
    pinDialog(dialog, { left: state.restRect.left, top: state.restRect.top, width: state.restRect.width, height: state.restRect.height, radius: state.restRect.width / 2 });
    lightbox.classList.remove('is-open');

    var done = function () {
      dialog.removeEventListener('transitionend', done);
      if (state.open) return;
      lightbox.hidden = true;
      dialog.style.position = '';
      dialog.style.margin = '';
      dialog.style.left = '';
      dialog.style.top = '';
      dialog.style.width = '';
      dialog.style.height = '';
      dialog.style.borderRadius = '';
    };
    dialog.addEventListener('transitionend', done);
  }

  document.querySelectorAll('[data-aw-reviews-data]').forEach(function (script) {
    var section = script.closest('.aw-home-reviews') || script.parentElement;
    var data = [];
    try {
      data = JSON.parse(script.textContent);
    } catch (e) {
      return;
    }

    section.querySelectorAll('[data-aw-review-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var index = Number(trigger.dataset.awReviewIndex);
        openLightbox(data[index], trigger);
      });
    });
  });

  document.querySelectorAll('[data-aw-review-close]').forEach(function (el) {
    el.addEventListener('click', closeLightbox);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });
})();
