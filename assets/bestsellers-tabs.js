document.querySelectorAll('.bestsellers-tabs').forEach(function (wrapper) {
  const tabs = wrapper.querySelectorAll('.bestsellers-tabs__tab');
  const panels = wrapper.querySelectorAll('.bestsellers-tabs__panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(function (p) {
        p.classList.remove('is-active');
        p.hidden = true;
      });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const panel = wrapper.querySelector('#' + tab.getAttribute('aria-controls'));
      if (panel) {
        panel.classList.add('is-active');
        panel.hidden = false;
      }
    });
  });
});