/**
 * ARTWISTIC REELS.
 *
 * Rail prev/next-arrow wiring is shared (assets/artwistic-rail.js). This
 * file handles two things:
 *
 * 1. In-grid autoplay: each reel's real <video muted loop playsinline>
 *    plays while it's substantially visible in the rail
 *    (IntersectionObserver), and pauses the moment it scrolls out.
 *
 * 2. The full-screen story lightbox: clicking a reel card (one with a
 *    real linked product) opens a swipeable, full-screen story view.
 *    The two video "slots" are positioned every animation frame by a
 *    hand-rolled overdamped spring simulation rather than a CSS
 *    transition — a spring re-integrates from wherever the previous
 *    frame actually landed, so dropped frames or an interrupted swipe
 *    never produce a visible jump the way restarting a CSS transition
 *    does. Swipe, mouse-wheel, and keyboard navigation all feed the
 *    same spring. A "shop this" pill reveals the linked product's
 *    photo/name/price/Add to Cart 2.5 seconds after a reel opens (or
 *    is navigated to), cancelled instantly on nav so it never appears
 *    on the wrong reel.
 *
 * Add-to-cart uses Shopify's own cart API directly (routes.cart_add_url
 * + fetchConfig + publish(PUB_SUB_EVENTS.cartUpdate, ...) + the site's
 * real cart-notification/cart-drawer renderContents) — the same real
 * mechanism assets/product-form.js uses, so items added here show up
 * in the same cart drawer/notification as anywhere else on the site.
 */
(function () {
  'use strict';

  // --- In-grid autoplay-on-scroll -----------------------------------
  var reelFrames = document.querySelectorAll('[data-aw-reel]');
  if (reelFrames.length && typeof IntersectionObserver !== 'undefined') {
    var frameObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target.querySelector('video');
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );
    reelFrames.forEach(function (frame) {
      frameObserver.observe(frame);
    });
  }

  // --- Story lightbox -------------------------------------------------
  var lightbox = document.querySelector('[data-aw-reel-lightbox]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-aw-reel-card]'));
  if (!lightbox || !cards.length) return;

  var stage = lightbox.querySelector('[data-aw-reel-stage]');
  var slotEls = Array.prototype.slice.call(lightbox.querySelectorAll('[data-aw-reel-slot]'));
  var slotVideos = slotEls.map(function (el) {
    return el.querySelector('video');
  });
  var soundButton = lightbox.querySelector('[data-aw-reel-sound]');
  var soundIcon = lightbox.querySelector('[data-aw-reel-sound-icon]');
  var progressFill = lightbox.querySelector('[data-aw-reel-progress]');
  var counterEl = lightbox.querySelector('[data-aw-reel-counter]');
  var pillEl = lightbox.querySelector('[data-aw-reel-pill]');
  var pillImg = lightbox.querySelector('[data-aw-reel-pill-img]');
  var pillName = lightbox.querySelector('[data-aw-reel-pill-name]');
  var pillPrice = lightbox.querySelector('[data-aw-reel-pill-price]');
  var pillLink = lightbox.querySelector('[data-aw-reel-pill-link]');
  var pillCart = lightbox.querySelector('[data-aw-reel-pill-cart]');

  var sizeSheet = document.querySelector('[data-aw-reel-sizes]');
  var sizeTitle = sizeSheet && sizeSheet.querySelector('[data-aw-reel-sizes-title]');
  var sizeGrid = sizeSheet && sizeSheet.querySelector('[data-aw-reel-sizes-grid]');

  var PILL_REVEAL_DELAY = 2500;

  function getVideoSource(card) {
    var video = card.querySelector('.aw-reels__video--source');
    if (!video) return '';
    var source = video.querySelector('source');
    return source ? source.src : video.src;
  }

  var reels = cards.map(function (card) {
    var variants = [];
    var sizeValues = null;
    try {
      variants = JSON.parse(card.dataset.variants || '[]');
    } catch (e) {}
    try {
      sizeValues = JSON.parse(card.dataset.sizeValues || 'null');
    } catch (e) {}
    return {
      src: getVideoSource(card),
      pimg: card.dataset.pimg,
      pname: card.dataset.pname,
      pprice: card.dataset.pprice,
      purl: card.dataset.purl,
      phandle: card.dataset.phandle,
      available: card.dataset.available === 'true',
      sizeIdx: parseInt(card.dataset.sizeIdx, 10),
      sizeValues: sizeValues,
      variants: variants
    };
  });

  cards.forEach(function (card, index) {
    card.addEventListener('click', function () {
      openLightbox(index, card);
    });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(index, card);
      }
    });
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
  });

  // --- Spring physics ---------------------------------------------------
  // Overdamped (ratio > 1): the slide arrives at its target and stops
  // cleanly, no overshoot/bounce. A single shared spring value drives
  // both slots from one formula, so they're always mathematically
  // exactly one screen-height apart — two independent springs would
  // drift by fractions of a pixel and read as jitter.
  var SPRING_K = 260;
  var SPRING_D = 36;
  var SPRING_MASS = 1;
  var SPRING_SUBSTEPS = 8;
  var SPRING_KICK = 3.5;

  var spring = { pos: 0, vel: 0, target: 1 };

  function advanceSpring(dt) {
    var step = dt / SPRING_SUBSTEPS;
    var p = spring.pos;
    var v = spring.vel;
    var t = spring.target;
    for (var i = 0; i < SPRING_SUBSTEPS; i++) {
      var a = (-SPRING_K * (p - t) - SPRING_D * v) / SPRING_MASS;
      v += a * step;
      p += v * step;
    }
    spring.pos = p;
    spring.vel = v;
  }

  function springSettled() {
    return Math.abs(spring.vel) < 0.003 && Math.abs(spring.pos - spring.target) < 0.0008;
  }

  var active = 0;
  var standby = 1;
  var navDir = 0;
  var wrapHeight = 0;
  var navigating = false;
  var currentIndex = 0;
  var isMuted = false;
  var rafNav = null;
  var rafProgress = null;
  var lastTs = null;
  var pillTimer = null;

  function cacheHeight() {
    wrapHeight = stage.offsetHeight || Math.round(window.innerHeight * 0.88);
  }
  window.addEventListener('resize', cacheHeight, { passive: true });

  function applySlots() {
    var p = spring.pos;
    var activeY = -navDir * wrapHeight * p;
    var standbyY = navDir * wrapHeight * (1 - p);
    slotEls[active].style.transform = 'translate3d(0,' + activeY + 'px,0)';
    slotEls[standby].style.transform = 'translate3d(0,' + standbyY + 'px,0)';
  }

  function springLoop(ts) {
    if (lastTs === null) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    advanceSpring(dt);

    if (springSettled()) {
      spring.pos = spring.target;
      applySlots();
      cancelAnimationFrame(rafNav);
      rafNav = null;
      lastTs = null;
      if (spring.target >= 1) onNavComplete();
      else onSnapBack();
    } else {
      applySlots();
      rafNav = requestAnimationFrame(springLoop);
    }
  }

  function startSpring() {
    if (rafNav) cancelAnimationFrame(rafNav);
    lastTs = null;
    requestAnimationFrame(function () {
      rafNav = requestAnimationFrame(springLoop);
    });
  }

  function onNavComplete() {
    var outgoing = slotVideos[active];
    outgoing.onended = null;
    outgoing.pause();
    outgoing.src = '';

    var tmp = active;
    active = standby;
    standby = tmp;
    slotVideos[active].onended = function () {
      setTimeout(function () {
        navigate(1);
      }, 1500);
    };
    navigating = false;
    startProgress();
  }

  function onSnapBack() {
    var sv = slotVideos[standby];
    sv.pause();
    sv.src = '';
    slotEls[standby].style.transform = 'translate3d(0,' + navDir * wrapHeight + 'px,0)';
    navigating = false;
  }

  // --- Progress + counter -------------------------------------------
  function startProgress() {
    cancelAnimationFrame(rafProgress);
    var video = slotVideos[active];
    (function tick() {
      if (video.duration && !isNaN(video.duration)) {
        progressFill.style.width = (video.currentTime / video.duration) * 100 + '%';
      }
      rafProgress = requestAnimationFrame(tick);
    })();
  }

  function stopProgress() {
    cancelAnimationFrame(rafProgress);
    if (progressFill) progressFill.style.width = '0%';
  }

  function updateCounter(index) {
    if (counterEl) counterEl.textContent = index + 1 + ' / ' + reels.length;
  }

  // --- Product pill ---------------------------------------------------
  function updatePillData(reel) {
    if (!reel.pname || !reel.phandle) {
      pillEl.dataset.ready = '0';
      return;
    }
    pillImg.src = reel.pimg || '';
    pillImg.style.display = reel.pimg ? 'block' : 'none';
    pillName.textContent = reel.pname;
    // reel.pprice comes from Liquid's `money` filter, which on this
    // store's currency format returns literal markup (e.g.
    // "<span class=money>Rs. 3,999.00</span>") rather than plain text —
    // innerHTML renders it correctly; textContent would print the tags
    // themselves as visible text and inflate the string's length.
    pillPrice.innerHTML = reel.pprice;
    pillEl.dataset.ready = '1';
    pillCart.disabled = !reel.available;
    pillCart.textContent = reel.available ? 'Add to Cart' : 'Sold Out';
  }

  function hidePill() {
    clearTimeout(pillTimer);
    pillEl.classList.remove('is-visible');
    pillEl.style.display = 'none';
  }

  function schedulePillReveal(reel) {
    hidePill();
    updatePillData(reel);
    if (pillEl.dataset.ready !== '1') return;
    pillTimer = setTimeout(function () {
      if (pillEl.dataset.ready !== '1') return;
      pillEl.style.display = 'flex';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          pillEl.classList.add('is-visible');
        });
      });
    }, PILL_REVEAL_DELAY);
  }

  // pillLink and pillEl are the same element — the whole capsule is the
  // "go to product" click target; the Add to Cart button inside it
  // stops its own click from bubbling here (see below).
  pillLink.addEventListener('click', function (event) {
    if (event.target.closest('[data-aw-reel-pill-cart]')) return;
    var reel = reels[currentIndex];
    if (reel && reel.purl) window.location.href = reel.purl;
  });
  pillLink.addEventListener('keydown', function (event) {
    if (event.target.closest('[data-aw-reel-pill-cart]')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      var reel = reels[currentIndex];
      if (reel && reel.purl) window.location.href = reel.purl;
    }
  });

  // --- Cart -------------------------------------------------------------
  // Mirrors the real, proven mechanism in assets/product-form.js: fetch
  // the cart-add endpoint, then hand the response to the site's own
  // cart-notification/cart-drawer so the cart icon/drawer updates the
  // same way it does anywhere else on the site.
  function addToCartAndNotify(variantId, quantity, button) {
    if (!variantId) return;
    var cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    var formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', quantity || 1);
    if (cart) {
      formData.append(
        'sections',
        cart.getSectionsToRender().map(function (section) {
          return section.id;
        })
      );
      formData.append('sections_url', window.location.pathname);
      cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    var originalText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = '…';
    }

    fetch(routes.cart_add_url, config)
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (response.status) {
          console.error('artwistic-reels addToCart:', response.description || response.message);
          return;
        }
        if (!cart) {
          window.location = routes.cart_url;
          return;
        }
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'artwistic-reels',
          productVariantId: variantId,
          cartData: response
        });
        cart.renderContents(response);
        // Auto-dismiss the notification after a couple seconds instead
        // of leaving it open until the customer closes it manually —
        // Dawn's own close() already has the graceful fade/slide-out.
        if (typeof cart.close === 'function') {
          setTimeout(function () {
            cart.close();
          }, 2000);
        }
      })
      .catch(function (error) {
        console.error('artwistic-reels addToCart:', error);
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
  }

  // --- Size-picker sheet ------------------------------------------------
  var sizeSheetResolve = null;

  function closeSizeSheet(chosenVariantId) {
    if (!sizeSheet) return;
    sizeSheet.classList.remove('is-open');
    setTimeout(function () {
      sizeSheet.hidden = true;
    }, 280);
    if (sizeSheetResolve) {
      var resolve = sizeSheetResolve;
      sizeSheetResolve = null;
      resolve(chosenVariantId || null);
    }
  }

  function openSizeSheet(reel) {
    if (!sizeSheet || !sizeGrid) return Promise.resolve(null);
    sizeTitle.textContent = reel.pname || '';
    sizeGrid.innerHTML = '';

    reel.sizeValues.forEach(function (label) {
      var match = reel.variants.filter(function (variant) {
        return variant.options && variant.options[reel.sizeIdx] === label;
      })[0];
      var optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'aw-reel-sizes__option';
      optionButton.textContent = label;
      optionButton.disabled = !(match && match.available);
      optionButton.addEventListener('click', function () {
        closeSizeSheet(match ? match.id : null);
      });
      sizeGrid.appendChild(optionButton);
    });

    sizeSheet.hidden = false;
    // eslint-disable-next-line no-unused-expressions
    sizeSheet.offsetHeight;
    sizeSheet.classList.add('is-open');

    return new Promise(function (resolve) {
      sizeSheetResolve = resolve;
    });
  }

  document.querySelectorAll('[data-aw-reel-sizes-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      closeSizeSheet(null);
    });
  });

  pillCart.addEventListener('click', function (event) {
    event.stopPropagation();
    var reel = reels[currentIndex];
    if (!reel || !reel.phandle || pillCart.disabled) return;

    var hasSizes = reel.sizeIdx >= 0 && reel.sizeValues && reel.sizeValues.length > 1;
    if (!hasSizes) {
      var only = reel.variants[0];
      addToCartAndNotify(only ? only.id : null, 1, pillCart);
      return;
    }

    openSizeSheet(reel).then(function (variantId) {
      if (!variantId) return;
      addToCartAndNotify(variantId, 1, pillCart);
    });
  });

  // --- Open / close -----------------------------------------------------
  function openLightbox(index, cardEl) {
    var reel = reels[index];
    if (!reel || !reel.src) return;

    currentIndex = index;
    cacheHeight();
    active = 0;
    standby = 1;
    slotEls[0].style.transform = 'translate3d(0,0,0)';
    slotEls[1].style.transform = 'translate3d(0,' + wrapHeight + 'px,0)';

    var video = slotVideos[0];
    video.src = reel.src;
    video.muted = isMuted;
    video.load();
    video.play().catch(function () {
      video.muted = true;
      isMuted = true;
      updateSoundIcon();
      video.play().catch(function () {});
    });
    video.onended = function () {
      setTimeout(function () {
        navigate(1);
      }, 1500);
    };

    updateSoundIcon();
    schedulePillReveal(reel);
    updateCounter(index);
    startProgress();

    document.body.classList.add('aw-reel-lb-open');
    lightbox.hidden = false;
    // eslint-disable-next-line no-unused-expressions
    lightbox.offsetHeight;
    lightbox.classList.add('is-open');

    if (cardEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var rect = cardEl.getBoundingClientRect();
      var stageW = stage.offsetWidth || window.innerWidth * 0.9;
      var stageH = stage.offsetHeight || window.innerHeight * 0.88;
      var dx = rect.left + rect.width / 2 - window.innerWidth / 2;
      var dy = rect.top + rect.height / 2 - window.innerHeight / 2;
      stage.style.transition = 'none';
      stage.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + rect.width / stageW + ',' + rect.height / stageH + ')';
      // eslint-disable-next-line no-unused-expressions
      stage.offsetHeight;
      stage.style.transition = '';
      stage.style.transform = '';
    }
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    navigating = false;
    if (rafNav) {
      cancelAnimationFrame(rafNav);
      rafNav = null;
    }
    stopProgress();
    hidePill();

    lightbox.classList.remove('is-open');
    document.body.classList.remove('aw-reel-lb-open');

    setTimeout(function () {
      lightbox.hidden = true;
      slotVideos.forEach(function (video) {
        video.onended = null;
        video.pause();
        video.src = '';
      });
      active = 0;
      standby = 1;
      cacheHeight();
      slotEls[0].style.transform = 'translate3d(0,0,0)';
      slotEls[1].style.transform = 'translate3d(0,' + wrapHeight + 'px,0)';
    }, 460);
  }

  function navigate(direction) {
    if (navigating) return;
    var total = reels.length;
    var nextIndex = (currentIndex + direction + total) % total;
    var reel = reels[nextIndex];
    if (!reel || !reel.src) return;

    navigating = true;
    navDir = direction;
    currentIndex = nextIndex;

    slotEls[standby].style.transform = 'translate3d(0,' + direction * wrapHeight + 'px,0)';

    var sv = slotVideos[standby];
    sv.src = reel.src;
    sv.muted = isMuted;
    sv.load();
    sv.play().catch(function () {
      sv.muted = true;
      isMuted = true;
      updateSoundIcon();
      sv.play().catch(function () {});
    });

    updateCounter(nextIndex);
    stopProgress();
    schedulePillReveal(reel);

    spring.pos = 0;
    spring.vel = SPRING_KICK;
    spring.target = 1;
    startSpring();
  }

  function updateSoundIcon() {
    if (!soundIcon) return;
    soundIcon.innerHTML = isMuted
      ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
      : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
  }

  soundButton.addEventListener('click', function () {
    isMuted = !isMuted;
    updateSoundIcon();
    slotVideos[active].muted = isMuted;
  });

  document.querySelectorAll('[data-aw-reel-close]').forEach(function (el) {
    el.addEventListener('click', closeLightbox);
  });
  lightbox.querySelectorAll('[data-aw-reel-nav]').forEach(function (button) {
    button.addEventListener('click', function () {
      navigate(parseInt(button.dataset.awReelNav, 10));
    });
  });

  document.addEventListener('keydown', function (event) {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') navigate(1);
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') navigate(-1);
    if (event.key === 'm' || event.key === 'M') soundButton.click();
  });

  window.addEventListener(
    'wheel',
    function (event) {
      if (lightbox.hidden) return;
      if (event.target.closest('[data-aw-reel-pill]')) return;
      if (Math.abs(event.deltaY) < 10) return;
      event.preventDefault();
      if (wheelLock || navigating) return;
      wheelLock = true;
      navigate(event.deltaY > 0 ? 1 : -1);
      setTimeout(function () {
        wheelLock = false;
      }, 620);
    },
    { passive: false }
  );
  var wheelLock = false;

  // --- Touch swipe --------------------------------------------------
  var touchStartY = 0;
  var touchStartX = 0;
  var touchAxis = null;
  var touchDragging = false;
  var dragReady = false;
  var dragDir = 0;
  var velocityY = 0;
  var lastTouchY = 0;
  var lastTouchTime = 0;

  lightbox.addEventListener(
    'touchstart',
    function (event) {
      if (event.target.closest('[data-aw-reel-pill], [data-aw-reel-sound], [data-aw-reel-close]')) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchAxis = null;
      touchDragging = false;
      dragReady = false;
      dragDir = 0;
      velocityY = 0;
      lastTouchY = touchStartY;
      lastTouchTime = performance.now();
    },
    { passive: true }
  );

  lightbox.addEventListener(
    'touchmove',
    function (event) {
      if (event.target.closest('[data-aw-reel-pill]')) return;
      var dy = event.touches[0].clientY - touchStartY;
      var dx = event.touches[0].clientX - touchStartX;

      if (!touchAxis && (Math.abs(dy) > 10 || Math.abs(dx) > 10)) {
        touchAxis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      }
      if (touchAxis !== 'v') return;
      touchDragging = true;
      event.preventDefault();

      var now = performance.now();
      var dt = now - lastTouchTime;
      if (dt > 0) {
        var rawVelocity = (event.touches[0].clientY - lastTouchY) / (dt / 1000);
        velocityY = velocityY * 0.65 + rawVelocity * 0.35;
        lastTouchY = event.touches[0].clientY;
        lastTouchTime = now;
      }

      if (!dragReady && Math.abs(dy) > 18 && !navigating) {
        dragDir = dy < 0 ? 1 : -1;
        var nextIndex = (currentIndex + dragDir + reels.length) % reels.length;
        var nextReel = reels[nextIndex];
        if (nextReel && nextReel.src) {
          slotEls[standby].style.transform = 'translate3d(0,' + dragDir * wrapHeight + 'px,0)';
          var sv = slotVideos[standby];
          sv.src = nextReel.src;
          sv.muted = isMuted;
          sv.load();
          dragReady = true;
          navigating = true;
        }
      }

      if (!dragReady) return;

      var rawDy = dy;
      var wrongDirection = (dragDir === 1 && dy > 0) || (dragDir === -1 && dy < 0);
      if (wrongDirection) rawDy = dy * 0.15;
      rawDy = Math.max(-wrapHeight, Math.min(wrapHeight, rawDy));

      spring.pos = Math.min(1, Math.abs(rawDy) / wrapHeight);
      spring.target = 1;

      slotEls[active].style.transform = 'translate3d(0,' + rawDy + 'px,0)';
      slotEls[standby].style.transform = 'translate3d(0,' + (rawDy + dragDir * wrapHeight) + 'px,0)';
    },
    { passive: false }
  );

  lightbox.addEventListener(
    'touchend',
    function (event) {
      if (!touchDragging) {
        touchDragging = false;
        return;
      }
      if (!dragReady) {
        touchDragging = false;
        navigating = false;
        return;
      }

      var dy = event.changedTouches[0].clientY - touchStartY;
      var velocityToward = velocityY * -dragDir;
      var progress = Math.abs(dy) / wrapHeight;
      var shouldComplete = progress > 0.32 || velocityToward > 500;

      if (shouldComplete) {
        var nextIndex = (currentIndex + dragDir + reels.length) % reels.length;
        var nextReel = reels[nextIndex];
        navDir = dragDir;
        currentIndex = nextIndex;
        spring.vel = Math.max(0.5, velocityToward / wrapHeight);
        spring.target = 1;

        var sv = slotVideos[standby];
        sv.play().catch(function () {});
        updateCounter(nextIndex);
        stopProgress();
        if (nextReel) schedulePillReveal(nextReel);
        startSpring();
      } else {
        spring.target = 0;
        spring.vel = velocityToward / wrapHeight;
        navDir = dragDir;
        startSpring();
      }

      touchDragging = false;
      dragReady = false;
      dragDir = 0;
    },
    { passive: true }
  );
})();
