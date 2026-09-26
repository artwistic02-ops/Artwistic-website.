/**
 * ARTWISTIC DELIVERY ESTIMATE (manual, no-API).
 *
 * Business rules:
 * - Business days are Monday–Saturday, excluding Sunday and every date
 *   in the merchant's holiday list (block setting) — the shopper's own
 *   Indian national holidays go there, since there's no live calendar.
 * - Dispatch: a configurable min–max business-day range from today.
 * - Transit: Gujarat (pincode prefix 360–396) and Mumbai (pincode prefix
 *   400) get one (faster) business-day range; every other pincode gets
 *   a second (slower) range. This is a standard-postal-prefix guess, not
 *   a live serviceability check — the merchant confirms real values via
 *   the block's own settings.
 * - Delivery estimate = dispatch range, then transit range added on top
 *   of each end of the dispatch range, all measured in business days.
 *
 * All computed client-side from "today" at page-load time — no courier
 * API, no server round-trip.
 */
(function () {
  'use strict';

  /** Gujarat (Indian postal circle prefixes 360–396) or Mumbai (400) → 'fast'; anything else → 'other'. */
  function regionFor(pincode) {
    var prefix3 = Number(pincode.slice(0, 3));
    if (prefix3 >= 360 && prefix3 <= 396) return 'fast';
    if (prefix3 === 400) return 'fast';
    return 'other';
  }

  /**
   * Typewriter placeholder — there's no visible label anymore, so the
   * empty pincode field hints at itself: types its hint text out,
   * holds, deletes, and repeats, entirely via the `placeholder`
   * attribute (no extra DOM needed). Pauses the moment the shopper
   * focuses or types, and only resumes once the field is empty and
   * blurred again — it never fights with real input.
   */
  function initTypingHint(input) {
    var phrase = input.getAttribute('data-aw-typing-hint');
    if (!phrase) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      input.placeholder = phrase;
      return;
    }

    var TYPE_MS = 55;
    var DELETE_MS = 28;
    var HOLD_MS = 1800;
    var RESTART_MS = 500;

    var charIndex = 0;
    var deleting = false;
    var timer = null;

    function tick() {
      if (!deleting) {
        charIndex += 1;
        input.placeholder = phrase.slice(0, charIndex);
        if (charIndex >= phrase.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
        } else {
          timer = setTimeout(tick, TYPE_MS);
        }
      } else {
        charIndex -= 1;
        input.placeholder = phrase.slice(0, charIndex);
        if (charIndex <= 0) {
          deleting = false;
          timer = setTimeout(tick, RESTART_MS);
        } else {
          timer = setTimeout(tick, DELETE_MS);
        }
      }
    }

    function stop() {
      clearTimeout(timer);
      timer = null;
    }

    function start() {
      stop();
      charIndex = 0;
      deleting = false;
      input.placeholder = '';
      timer = setTimeout(tick, RESTART_MS);
    }

    input.addEventListener('focus', stop);
    input.addEventListener('input', function () {
      if (input.value) stop();
    });
    input.addEventListener('blur', function () {
      if (!input.value) start();
    });

    start();
  }

  function parseHolidays(raw) {
    return new Set(
      (raw || '')
        .split(',')
        .map(function (value) {
          return value.trim();
        })
        .filter(Boolean)
    );
  }

  function dateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function isBusinessDay(date, holidays) {
    return date.getDay() !== 0 && !holidays.has(dateKey(date));
  }

  /** Returns a new Date that is `count` business days after `start` (start itself never counted). */
  function addBusinessDays(start, count, holidays) {
    var date = new Date(start.getTime());
    var added = 0;
    while (added < count) {
      date.setDate(date.getDate() + 1);
      if (isBusinessDay(date, holidays)) added += 1;
    }
    return date;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function formatRange(from, to) {
    return from.getTime() === to.getTime() ? formatDate(from) : formatDate(from) + ' – ' + formatDate(to);
  }

  function init(container) {
    var input = container.querySelector('[data-aw-delivery-pincode]');
    var checkButton = container.querySelector('[data-aw-delivery-check]');
    var errorMessage = container.querySelector('[data-aw-delivery-error]');
    var result = container.querySelector('[data-aw-delivery-result]');
    var tierRow = container.querySelector('[data-aw-tier-row]');
    var tierFill = container.querySelector('[data-aw-tier-fill]');
    var tierOrder = container.querySelector('[data-aw-tier-order]');
    var tierDispatch = container.querySelector('[data-aw-tier-dispatch]');
    var tierDelivered = container.querySelector('[data-aw-tier-delivered]');
    var tierDispatchDate = container.querySelector('[data-aw-tier-dispatch-date]');
    var tierDeliveredDate = container.querySelector('[data-aw-tier-delivered-date]');
    if (!input || !checkButton || !result) return;

    initTypingHint(input);

    var holidays = parseHolidays(container.getAttribute('data-holidays'));
    var dispatchMin = Number(container.getAttribute('data-dispatch-min')) || 1;
    var dispatchMax = Number(container.getAttribute('data-dispatch-max')) || 2;
    var transit = {
      fast: {
        min: Number(container.getAttribute('data-transit-fast-min')) || 1,
        max: Number(container.getAttribute('data-transit-fast-max')) || 2,
      },
      other: {
        min: Number(container.getAttribute('data-transit-other-min')) || 4,
        max: Number(container.getAttribute('data-transit-other-max')) || 6,
      },
    };

    function reset() {
      result.textContent = '';
      if (tierRow) tierRow.hidden = true;
      if (tierFill) tierFill.style.width = '';
      if (tierOrder) tierOrder.classList.remove('is-active');
      if (tierDispatch) tierDispatch.classList.remove('is-active');
      if (tierDelivered) tierDelivered.classList.remove('is-active');
    }

    function checkPincode() {
      var pincode = input.value.replace(/\D/g, '');
      if (pincode.length !== 6) {
        if (errorMessage) errorMessage.hidden = false;
        reset();
        return;
      }
      if (errorMessage) errorMessage.hidden = true;

      var group = regionFor(pincode);
      var today = new Date();
      var dispatchEarliest = addBusinessDays(today, dispatchMin, holidays);
      var dispatchLatest = addBusinessDays(today, dispatchMax, holidays);
      var transitRange = transit[group];
      var deliveryEarliest = addBusinessDays(dispatchEarliest, transitRange.min, holidays);
      var deliveryLatest = addBusinessDays(dispatchLatest, transitRange.max, holidays);

      result.textContent = 'Arrives ' + formatRange(deliveryEarliest, deliveryLatest);

      if (tierDispatchDate) tierDispatchDate.textContent = formatRange(dispatchEarliest, dispatchLatest);
      if (tierDeliveredDate) tierDeliveredDate.textContent = formatRange(deliveryEarliest, deliveryLatest);

      if (tierRow) {
        tierRow.hidden = false;
        // Force a reflow before setting the fill width so the
        // transition (0% -> 100%, left to right) actually plays.
        // eslint-disable-next-line no-unused-expressions
        tierRow.offsetWidth;
        if (tierFill) tierFill.style.width = '100%';
        if (tierOrder) tierOrder.classList.add('is-active');
        if (tierDispatch) tierDispatch.classList.add('is-active');
        if (tierDelivered) tierDelivered.classList.add('is-active');
      }
    }

    checkButton.addEventListener('click', checkPincode);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkPincode();
      }
    });
    input.addEventListener('input', function () {
      if (errorMessage) errorMessage.hidden = true;
    });
  }

  document.querySelectorAll('[data-aw-delivery-estimate]').forEach(init);
})();
