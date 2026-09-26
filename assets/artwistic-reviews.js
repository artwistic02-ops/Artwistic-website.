/**
 * ARTWISTIC REVIEWS — presentation layer on top of Judge.me's real
 * review widget (see sections/artwistic-reviews.liquid).
 *
 * Judge.me renders its own widget asynchronously via its own script —
 * this file never invents review content, it only reads whatever
 * Judge.me has actually rendered and re-presents it:
 *   - a featured "pull quote" hero built from the first real review
 *   - every other real review as a card in a grid below it
 *   - a circular avatar per review (their real photo if attached, else
 *     initials computed from their real name) with a smooth FLIP
 *     expand-in-place animation into a lightbox on click
 *   - the "Write a Review" button proxies a click to Judge.me's own
 *     real, verified-purchase-aware review form trigger
 *
 * Judge.me's own verified-buyer badge is left exactly where Judge.me
 * renders it (restyled via CSS only) — this script never rebuilds or
 * clones it, so it stays fully functional and tied to Judge.me's real
 * backend.
 *
 * NOTE: the class names below are Judge.me's real "revamped" widget
 * markup (confirmed by inspecting a live review on this store — their
 * newer widget uses jm-*-prefixed classes, not the older documented
 * .jdgm-rev* ones). The reviewer-location (city) selector is a best
 * guess and hasn't been confirmed against real markup yet — if this
 * store's Judge.me install doesn't render a location element (or the
 * "Show reviewer location" widget setting is off), cityOf() correctly
 * returns '' and nothing city-related displays, same as any other
 * lookup here: it fails silently rather than breaking the page.
 */
(function () {
  'use strict';

  function textOf(el) {
    return el ? el.textContent.trim() : '';
  }

  function starsMarkupFor(reviewEl) {
    var ratingEl = reviewEl.querySelector('.jm-star-rating');
    var filled = 0;
    if (ratingEl) {
      var label = ratingEl.getAttribute('aria-label') || '';
      var match = label.match(/([\d.]+)\s+out of/);
      if (match) filled = Math.round(parseFloat(match[1]));
    }
    var markup = '';
    for (var i = 0; i < 5; i++) {
      markup += i < filled ? '★' : '☆';
    }
    return markup;
  }

  function nameOf(reviewEl) {
    return textOf(reviewEl.querySelector('.jm-reviewer-info__name'));
  }

  // Best-guess selectors for Judge.me's optional "reviewer location"
  // display — not yet confirmed against this store's real DOM. Tries a
  // few plausible class names; returns '' if none match (silent no-op).
  function cityOf(reviewEl) {
    var candidates = [
      '.jm-reviewer-info__location',
      '.jm-reviewer-location',
      '.jdgm-rev__location',
      '[class*="reviewer-location"]',
      '[class*="reviewer-info__location"]'
    ];
    for (var i = 0; i < candidates.length; i++) {
      var el = reviewEl.querySelector(candidates[i]);
      if (el && textOf(el)) return textOf(el);
    }
    return '';
  }

  function bodyOf(reviewEl) {
    return reviewEl.querySelector('.jdgm-review-content__body-content, .jm-review-content__body');
  }

  function photoOf(reviewEl) {
    // The reviewer avatar Judge.me renders is a text-initial <span>,
    // never an <img> — so any real <img> found inside a review card can
    // only be an actual attached review photo.
    return reviewEl.querySelector('img');
  }

  function initialsOf(name) {
    var words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Builds (or reuses) a circular avatar element for a review — a real
  // attached photo if present, else two-letter initials from the real
  // reviewer name. Hides Judge.me's own single-letter avatar in favor of
  // this one, since it needs photo support + two-letter initials theirs
  // doesn't do in this slot.
  function buildAvatar(reviewEl) {
    var jdgmAvatar = reviewEl.querySelector('.jm-reviewer-info__avatar, [class*="reviewer-info__avatar"]');
    if (jdgmAvatar) jdgmAvatar.hidden = true;

    var avatar = document.createElement('span');
    avatar.className = 'aw-avatar';
    var pic = photoOf(reviewEl);
    if (pic) {
      var img = document.createElement('img');
      img.src = pic.currentSrc || pic.src;
      img.alt = '';
      avatar.appendChild(img);
    } else {
      avatar.classList.add('aw-avatar--initials');
      avatar.textContent = initialsOf(nameOf(reviewEl) || 'Anonymous');
    }
    return avatar;
  }

  function metaLine(name, city) {
    var line = document.createElement('span');
    line.className = 'aw-meta-line';
    var nameSpan = document.createElement('span');
    nameSpan.className = 'aw-meta-line__name';
    nameSpan.textContent = name || 'Anonymous';
    line.appendChild(nameSpan);
    if (city) {
      var citySpan = document.createElement('span');
      citySpan.className = 'aw-meta-line__city';
      citySpan.textContent = city;
      line.appendChild(citySpan);
    }
    return line;
  }

  function buildHero(container, reviewEl) {
    var hero = container.querySelector('[data-aw-review-hero]');
    if (!hero || hero.dataset.built) return;

    var body = bodyOf(reviewEl);
    if (!body || !textOf(body)) return;

    hero.innerHTML =
      '<div class="aw-pull-note">' +
      '<p class="aw-pull-note__mark" aria-hidden="true">“</p>' +
      '<p class="aw-pull-note__text"></p>' +
      '<div class="aw-pull-note__meta">' +
      '<span class="aw-pull-note__stars"></span>' +
      '<span class="aw-pull-note__who"></span>' +
      '</div>' +
      '</div>';
    hero.querySelector('.aw-pull-note__text').textContent = textOf(body);
    hero.querySelector('.aw-pull-note__stars').textContent = starsMarkupFor(reviewEl);

    var who = hero.querySelector('.aw-pull-note__who');
    who.appendChild(buildAvatar(reviewEl));
    who.appendChild(metaLine(nameOf(reviewEl), cityOf(reviewEl)));

    hero.hidden = false;
    hero.dataset.built = 'true';
    hero.dataset.awReviewRef = reviewEl.dataset.awReviewRef;
    hero.setAttribute('role', 'button');
    hero.setAttribute('tabindex', '0');
  }

  // --- FLIP expand-in-place lightbox -----------------------------------
  // Same technique proven in assets/artwistic-video-bubble.js: measure
  // the clicked avatar's current on-screen rect, pin the lightbox dialog
  // there via inline position/left/top/width/height/border-radius (no
  // visual jump), force a reflow, then let CSS transitions animate it to
  // the large centered target rect. Text reveals with a short delay once
  // the shape has mostly settled. Reversed on close.

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

  var lightboxState = { open: false, restRect: null, sourceEl: null };

  function openLightbox(reviewEl, sourceAvatarEl) {
    var lightbox = document.querySelector('[data-aw-review-lightbox]');
    if (!lightbox || lightboxState.open) return;
    var dialog = lightbox.querySelector('.aw-review-lightbox__dialog');
    if (!dialog) return;

    var body = bodyOf(reviewEl);
    var pic = photoOf(reviewEl);

    var mediaHost = lightbox.querySelector('[data-aw-review-lightbox-media]');
    var textHost = lightbox.querySelector('[data-aw-review-lightbox-text]');
    var authorHost = lightbox.querySelector('[data-aw-review-lightbox-author]');
    var cityHost = lightbox.querySelector('[data-aw-review-lightbox-city]');
    var starsHost = lightbox.querySelector('[data-aw-review-lightbox-stars]');
    var avatarHost = lightbox.querySelector('[data-aw-review-lightbox-avatar]');

    if (textHost) textHost.textContent = textOf(body);
    if (authorHost) authorHost.textContent = nameOf(reviewEl) || 'Anonymous';
    if (cityHost) cityHost.textContent = cityOf(reviewEl);
    if (starsHost) starsHost.textContent = starsMarkupFor(reviewEl);
    if (avatarHost) {
      avatarHost.innerHTML = '';
      avatarHost.appendChild(buildAvatar(reviewEl));
    }

    if (pic && mediaHost) {
      mediaHost.innerHTML = '';
      var img = document.createElement('img');
      img.src = pic.currentSrc || pic.src;
      img.alt = '';
      mediaHost.appendChild(img);
      mediaHost.hidden = false;
      lightbox.classList.remove('aw-review-lightbox--text-only');
    } else if (mediaHost) {
      mediaHost.hidden = true;
      mediaHost.innerHTML = '';
      lightbox.classList.add('aw-review-lightbox--text-only');
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sourceRect = sourceAvatarEl ? sourceAvatarEl.getBoundingClientRect() : null;

    lightbox.hidden = false;
    lightboxState.open = true;
    lightboxState.sourceEl = sourceAvatarEl || null;
    document.body.classList.add('aw-review-lb-open');

    if (reduceMotion || !sourceRect) {
      lightbox.classList.add('is-open');
      dialog.classList.add('is-settled');
      return;
    }

    lightboxState.restRect = sourceRect;
    dialog.classList.remove('is-settled');
    pinDialog(dialog, {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      radius: sourceRect.width / 2
    });
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
    if (!lightbox || !lightboxState.open) return;
    var dialog = lightbox.querySelector('.aw-review-lightbox__dialog');

    if (dialog && dialog.dataset.awRevealTimer) {
      clearTimeout(Number(dialog.dataset.awRevealTimer));
      delete dialog.dataset.awRevealTimer;
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    lightboxState.open = false;
    document.body.classList.remove('aw-review-lb-open');

    if (reduceMotion || !lightboxState.restRect || !dialog) {
      lightbox.classList.remove('is-open');
      if (dialog) dialog.classList.remove('is-settled');
      setTimeout(function () {
        lightbox.hidden = true;
      }, 280);
      return;
    }

    dialog.classList.remove('is-settled');
    pinDialog(dialog, {
      left: lightboxState.restRect.left,
      top: lightboxState.restRect.top,
      width: lightboxState.restRect.width,
      height: lightboxState.restRect.height,
      radius: lightboxState.restRect.width / 2
    });
    lightbox.classList.remove('is-open');

    var done = function () {
      dialog.removeEventListener('transitionend', done);
      if (lightboxState.open) return;
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

  function findAvatarFor(cardEl) {
    return cardEl.querySelector('.aw-avatar');
  }

  function enhance(widgetHost) {
    var container = widgetHost.closest('.aw-reviews');
    var emptyState = container && container.querySelector('[data-aw-reviews-empty]');
    var reviews = widgetHost.querySelectorAll('.jm-review-item');

    if (!reviews.length) {
      if (emptyState) emptyState.hidden = false;
      // Judge.me's own native empty-state markup ("Be the first to
      // write a review", its teal button, "No items found") has no
      // confirmed, stable class name to target with CSS, and Judge.me's
      // own stylesheet apparently sets `display` on this element with
      // enough specificity to beat the plain [hidden] attribute — so
      // set display:none directly with !important, which nothing can
      // out-specificity. Unhidden (also forced) the instant a real
      // review appears (below).
      widgetHost.style.setProperty('display', 'none', 'important');
      return;
    }
    if (emptyState) emptyState.hidden = true;
    widgetHost.style.removeProperty('display');

    var heroReview = null;
    reviews.forEach(function (reviewEl, index) {
      if (!reviewEl.dataset.awReviewRef) reviewEl.dataset.awReviewRef = 'r' + index;
      if (!heroReview && bodyOf(reviewEl) && textOf(bodyOf(reviewEl))) heroReview = reviewEl;
    });
    if (!heroReview) heroReview = reviews[0];

    if (container) {
      buildHero(container, heroReview);
      var hero = container.querySelector('[data-aw-review-hero]');
      if (hero && !hero.dataset.awClickBound) {
        hero.dataset.awClickBound = 'true';
        hero.addEventListener('click', function (event) {
          if (event.target.closest('button, a')) return;
          openLightbox(heroReview, findAvatarFor(hero));
        });
        hero.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLightbox(heroReview, findAvatarFor(hero));
          }
        });
      }
    }

    // .jdgm-review-list is the confirmed real container Judge.me wraps
    // every .jm-review-item in — targeted directly here and in CSS.
    var list = widgetHost.querySelector('.jdgm-review-list') || reviews[0].parentElement;
    if (list) list.classList.add('aw-jdgm-reviews-grid');

    reviews.forEach(function (reviewEl) {
      // The review used for the hero never appears twice in the grid.
      if (heroReview && reviewEl.dataset.awReviewRef === heroReview.dataset.awReviewRef) {
        reviewEl.classList.add('aw-jdgm-card--is-hero-source');
        return;
      }
      reviewEl.classList.remove('aw-jdgm-card--is-hero-source');

      if (reviewEl.dataset.awEnhanced) return;
      reviewEl.dataset.awEnhanced = 'true';
      reviewEl.classList.add('aw-jdgm-card');
      reviewEl.setAttribute('role', 'button');
      reviewEl.setAttribute('tabindex', '0');

      var nameEl = reviewEl.querySelector('.jm-reviewer-info__name');
      if (nameEl && !nameEl.dataset.awMetaWrapped) {
        nameEl.dataset.awMetaWrapped = 'true';
        var who = document.createElement('div');
        who.className = 'aw-jdgm-card__who';
        nameEl.parentNode.insertBefore(who, nameEl);
        who.appendChild(buildAvatar(reviewEl));
        var meta = metaLine(nameOf(reviewEl), cityOf(reviewEl));
        who.appendChild(meta);
        nameEl.hidden = true;
      }

      reviewEl.addEventListener('click', function (event) {
        // Never hijack clicks on Judge.me's own interactive controls —
        // their own reply/report links, etc.
        if (event.target.closest('button, a')) return;
        openLightbox(reviewEl, findAvatarFor(reviewEl));
      });
      reviewEl.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.target.closest('button, a')) return;
          event.preventDefault();
          openLightbox(reviewEl, findAvatarFor(reviewEl));
        }
      });
    });
  }

  function initWriteReviewButton(trigger) {
    trigger.addEventListener('click', function () {
      var jdgmButton = document.querySelector('[data-testid="write-review-button"]');
      if (jdgmButton) {
        jdgmButton.click();
        return;
      }
      var widget = document.querySelector('#judgeme_product_reviews');
      if (widget) widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  document.querySelectorAll('.aw-reviews').forEach(function (container) {
    container.querySelectorAll('[data-aw-write-review]').forEach(initWriteReviewButton);

    var widgetHost = container.querySelector('#judgeme_product_reviews');
    if (!widgetHost) return;

    enhance(widgetHost);

    // Judge.me's script populates the widget asynchronously (and may
    // add more reviews on "load more" pagination) — keep watching.
    var observer = new MutationObserver(function () {
      enhance(widgetHost);
    });
    observer.observe(widgetHost, { childList: true, subtree: true });
  });

  document.querySelectorAll('[data-aw-review-lightbox-close]').forEach(function (el) {
    el.addEventListener('click', closeLightbox);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });
  window.addEventListener('resize', function () {
    if (lightboxState.open && !lightboxState.restRect) return;
    if (lightboxState.open) {
      var lightbox = document.querySelector('[data-aw-review-lightbox]');
      var dialog = lightbox && lightbox.querySelector('.aw-review-lightbox__dialog');
      if (dialog) pinDialog(dialog, targetRect());
    }
  });
})();
