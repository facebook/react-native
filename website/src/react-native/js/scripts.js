(function(){
  // Not on browser
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (isMobile()) {
      document.querySelector('.nav-site-wrapper a[data-target]').addEventListener('click', toggleTarget);
    }

    var backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) return;

    var modalButtonOpenList = document.querySelectorAll('.modal-button-open');
    var modalButtonClose = document.querySelector('.modal-button-close');

    backdrop.addEventListener('click', hideModal);
    modalButtonClose.addEventListener('click', hideModal);

    // Bind event to NodeList items
    for (var i = 0; i < modalButtonOpenList.length; ++i) {
      modalButtonOpenList[i].addEventListener('click', showModal);
    }
  }

  function showModal(e) {
    var backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) return;

    var modal = document.querySelector('.modal');

    backdrop.classList.add('modal-open');
    modal.classList.add('modal-open');
  }

  function hideModal(e) {
    var backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) return;

    var modal = document.querySelector('.modal');

    backdrop.classList.remove('modal-open');
    modal.classList.remove('modal-open');
  }

  var toggledTarget;
  function toggleTarget(event) {
    var target = document.body.querySelector(event.target.getAttribute('data-target'));

    if (target) {
      event.preventDefault();

      if (toggledTarget === target) {
        toggledTarget.classList.toggle('in');
      } else {
        toggledTarget && toggledTarget.classList.remove('in');
        target.classList.add('in');
      }

      toggledTarget = target;
    }
  }

  // Primitive mobile detection
  function isMobile() {
    return ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );
  }

}());
