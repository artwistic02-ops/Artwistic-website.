/**
 * ARTWISTIC DELIVERY ESTIMATE (manual, no-API).
 *
 * Business rules, exact as specified:
 * - Business days are Monday–Saturday, excluding Sunday and every date
 *   in the merchant's holiday list.
 * - Dispatch: a configurable min–max business-day range from today.
 * - Transit: Gujarat/Maharashtra get one (faster) business-day range;
 *   every other state/UT gets a second (slower) range.
 * - Delivery estimate = dispatch range, then transit range added on top
 *   of each end of the dispatch range, all measured in business days.
 *
 * All computed client-side from "today" at page-load time — no courier
 * API, no server round-trip.
 */
(function () {
  'use strict';

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
    var select = container.querySelector('[data-aw-delivery-state]');
    var result = container.querySelector('[data-aw-delivery-result]');
    var tierRow = container.querySelector('[data-aw-tier-row]');
    var tierFill = container.querySelector('[data-aw-tier-fill]');
    var tierDispatch = container.querySelector('[data-aw-tier-dispatch]');
    var tierDelivered = container.querySelector('[data-aw-tier-delivered]');
    var tierDispatchDate = container.querySelector('[data-aw-tier-dispatch-date]');
    var tierDeliveredDate = container.querySelector('[data-aw-tier-delivered-date]');
    if (!select || !result) return;

    var holidays = parseHolidays(container.getAttribute('data-holidays'));
    var dispatchMin = Number(container.getAttribute('data-dispatch-min')) || 1;
    var dispatchMax = Number(container.getAttribute('data-dispatch-max')) || 2;
    var transit = {
      fast: {
        min: Number(container.getAttribute('data-transit-fast-min')) || 2,
        max: Number(container.getAttribute('data-transit-fast-max')) || 3,
      },
      other: {
        min: Number(container.getAttribute('data-transit-other-min')) || 3,
        max: Number(container.getAttribute('data-transit-other-max')) || 5,
      },
    };

    select.addEventListener('change', function () {
      var group = select.value;
      if (!group) {
        result.textContent = '';
        if (tierRow) tierRow.hidden = true;
        if (tierFill) tierFill.style.width = '';
        if (tierDispatch) tierDispatch.classList.remove('is-active');
        if (tierDelivered) tierDelivered.classList.remove('is-active');
        return;
      }

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
        // Force a reflow before adding the fill class so the width
        // transition (0% -> 100%) actually plays, matching how the
        // approved mockup animates the tier line filling in left to right.
        // eslint-disable-next-line no-unused-expressions
        tierRow.offsetWidth;
        if (tierFill) tierFill.style.width = '100%';
        if (tierDispatch) tierDispatch.classList.add('is-active');
        if (tierDelivered) tierDelivered.classList.add('is-active');
      }
    });
  }

  document.querySelectorAll('[data-aw-delivery-estimate]').forEach(init);
})();
