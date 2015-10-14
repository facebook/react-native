(function(){
  // Not on browser
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var backdrop = document.querySelector('.modal-backdrop');
    var modalButtonOpen = document.querySelector('.modal-button-open');
    var modalButtonClose = document.querySelector('.modal-button-close');

    backdrop.addEventListener('click', hideModal);
    modalButtonOpen.addEventListener('click', showModal);
    modalButtonClose.addEventListener('click', hideModal);
  }

  function showModal(e) {
    var backdrop = document.querySelector('.modal-backdrop');
    var modal = document.querySelector('.modal');

    backdrop.classList.add('modal-open');
    modal.classList.add('modal-open');
  }

  function hideModal(e) {
    var backdrop = document.querySelector('.modal-backdrop');
    var modal = document.querySelector('.modal');

    backdrop.classList.remove('modal-open');
    modal.classList.remove('modal-open');
  }

}());
