document.addEventListener('DOMContentLoaded', function () {
  if (typeof CustomerAddresses === 'function' && document.querySelector('[data-customer-addresses]')) {
    new CustomerAddresses();
  }
});
