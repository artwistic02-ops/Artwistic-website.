/**
 * ARTWISTIC REVIEWS — homepage carousel prev/next controls and the
 * review-photo lightbox (shared by the homepage carousel and the
 * product-page review list, since both render photo buttons with the
 * same data-aw-review-photo attribute).
 */
(function () {
  'use strict';

  function initCarousel(rail) {
    var prevButton = document.querySelector('[data-aw-reviews-prev]');
    var nextButton = document.querySelector('[data-aw-reviews-next]');
    if (!prevButton || !nextButton) return;

    function scrollByCard(direction) {
      var card = rail.querySelector('.aw-review-card');
      var distance = card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
      rail.scrollBy({ left: distance * direction, behavior: 'smooth' });
    }

    prevButton.addEventListener('click', function () {
      scrollByCard(-1);
    });
    nextButton.addEventListener('click', function () {
      scrollByCard(1);
    });
  }

  function initLightbox() {
    var photoButtons = document.querySelectorAll('[data-aw-review-photo]');
    if (photoButtons.length === 0) return;

    var lightbox = document.createElement('div');
    lightbox.className = 'aw-review-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Review photo');
    lightbox.innerHTML =
      '<button type="button" class="aw-review-lightbox__close" data-aw-lightbox-close aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button><img alt="">';
    document.body.appendChild(lightbox);

    var image = lightbox.querySelector('img');
    var closeButton = lightbox.querySelector('[data-aw-lightbox-close]');
    var releaseFocusTrap = null;
    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      image.src = src;
      image.alt = alt || '';
      lightbox.classList.add('is-open');
      if (window.Artwistic) {
        releaseFocusTrap = window.Artwistic.trapFocus(lightbox, closeButton);
      } else {
        closeButton.focus();
      }
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      lightbox.classList.remove('is-open');
      if (releaseFocusTrap) releaseFocusTrap();
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    closeButton.addEventListener('click', close);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });

    photoButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var img = button.querySelector('img');
        if (!img) return;
        open(img.currentSrc || img.src, img.alt);
      });
    });
  }

  var rail = document.querySelector('[data-aw-reviews-rail]');
  if (rail) initCarousel(rail);
  initLightbox();
})();
