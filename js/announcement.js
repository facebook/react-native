document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.fixedHeaderContainer');
  if (container) {
    const div = document.createElement('div');
    div.innerHTML =
      '<div class="announcement"><div class="announcement-inner">Black Lives Matter. <a href="https://support.eji.org/give/153413/#!/donation/checkout">Support the Equal Justice Initiative</a>.</div></div>';
    const content = div.childNodes[0];
    container.insertBefore(content, container.childNodes[0].nextSibling);
  }
});
