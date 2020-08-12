document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.fixedHeaderContainer');
  if (container) {
    const announcement = document.createElement('div');
    announcement.className = 'announcement';
    announcement.innerHTML =
      '<div class="announcement-inner">Black Lives Matter. <a href="https://support.eji.org/give/153413/#!/donation/checkout">Support the Equal Justice Initiative.</a></div>';
    container.insertBefore(announcement, container.firstChild);
  }
});

const scrollStartBoundary = 160;

window.onscroll = () => {
  // Simple check for mobile devices
  if (typeof window.orientation !== 'undefined') {
    const fixedHeaderContainer = document.querySelector(
      '.fixedHeaderContainer'
    );
    const navPusher = document.querySelector('.navPusher');

    if (
      document.body.scrollTop > scrollStartBoundary ||
      document.documentElement.scrollTop > scrollStartBoundary
    ) {
      fixedHeaderContainer.style.top = '-100px';
      navPusher.style.top = '-100px';
      navPusher.style.marginBottom = '-100px';
    } else {
      fixedHeaderContainer.style.top = '0';
      navPusher.style.top = '0';
      navPusher.style.marginBottom = '0';
    }
  }
};
