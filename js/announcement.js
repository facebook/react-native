document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.fixedHeaderContainer');
  if (container) {
    const announcement = document.createElement('div');
    announcement.className = 'announcement';
    announcement.innerHTML =
      '<div class="announcement-inner">Black Lives Matter. <a href="https://support.eji.org/give/153413/#!/donation/checkout">Support the Equal Justice Initiative.</a></div>';
    container.insertBefore(announcement, container.firstChild);
  }
});
