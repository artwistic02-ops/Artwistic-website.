/**
 * ARTWISTIC: Footer behavior — mobile link-list accordion (one open at a
 * time), SEO about-text read-more/read-less, and the floating
 * back-to-top button's scroll-visibility + smooth scroll.
 */
(function () {
  'use strict';

  var footer = document.querySelector('.footer');

  function initAccordion() {
    if (!footer) return;
    var menus = footer.querySelectorAll('.footer-block--menu');
    if (!menus.length) return;

    menus.forEach(function (menu) {
      var heading = menu.querySelector('.footer-block__heading');
      if (!heading) return;

      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.setAttribute('aria-expanded', 'false');

      function toggle() {
        if (window.matchMedia('(min-width: 750px)').matches) return;
        var isOpen = menu.classList.contains('is-open');
        menus.forEach(function (other) {
          other.classList.remove('is-open');
          var otherHeading = other.querySelector('.footer-block__heading');
          if (otherHeading) otherHeading.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          menu.classList.add('is-open');
          heading.setAttribute('aria-expanded', 'true');
        }
      }

      heading.addEventListener('click', toggle);
      heading.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function initSeoToggle() {
    var toggles = document.querySelectorAll('[data-aw-seo-toggle]');
    toggles.forEach(function (button) {
      var wrapper = button.closest('.aw-footer-seo__inner');
      var text = wrapper ? wrapper.querySelector('[data-aw-seo-text]') : null;
      if (!text) return;

      button.addEventListener('click', function () {
        var expanded = text.classList.toggle('is-expanded');
        button.textContent = expanded ? 'Read less' : 'Read more';
      });
    });
  }

  function initBackToTop() {
    var button = document.getElementById('AwBackTop');
    if (!button) return;

    var threshold = 400;

    function updateVisibility() {
      if (window.scrollY > threshold) {
        button.classList.add('is-visible');
      } else {
        button.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();

    button.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAccordion();
    initSeoToggle();
    initBackToTop();
  });
})();
