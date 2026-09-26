document.querySelectorAll('.sticky-atc').forEach(function (bar) {
  const sectionId = bar.id.replace('StickyATC-', '');
  const priceEl = document.getElementById('StickyATCPrice-' + sectionId);
  const buttonEl = document.getElementById('StickyATCButton-' + sectionId);
  const realButton = document.getElementById('ProductSubmitButton-' + sectionId);
  const realPriceWrapper = document.querySelector('[id^="price-' + sectionId + '"]');
  const anchor = document.querySelector('.product-form__buttons') || realButton;

  if (!realButton || !anchor) return;

  function sync() {
    if (priceEl && realPriceWrapper) {
      priceEl.textContent = realPriceWrapper.textContent.trim().split('\n')[0].trim();
    }
    if (buttonEl) {
      buttonEl.textContent = realButton.textContent.trim();
      buttonEl.disabled = realButton.disabled;
    }
  }

  buttonEl.addEventListener('click', function () {
    realButton.click();
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        bar.hidden = entry.isIntersecting;
      });
    },
    { threshold: 0 }
  );
  observer.observe(anchor);

  sync();
  new MutationObserver(sync).observe(document.querySelector('product-info') || document.body, {
    childList: true,
    subtree: true,
  });
});
