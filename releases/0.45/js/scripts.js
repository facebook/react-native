/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable module-strict */

(function() {
  'use strict';

  // Not on browser
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var mobile = isMobile();

    if (mobile) {
      document
        .querySelector('.nav-site-wrapper a[data-target]')
        .addEventListener('click', toggleTarget);
    }

    var webPlayerList = document.querySelectorAll('.web-player');

    // Either show interactive or static code block, depending on desktop or mobile
    for (var i = 0; i < webPlayerList.length; ++i) {
      webPlayerList[i].classList.add(mobile ? 'mobile' : 'desktop');

      if (!mobile) {
        // Determine location to look up required assets
        var assetRoot = encodeURIComponent(
          document.location.origin + '/react-native'
        );

        // Set iframe src. Do this dynamically so the iframe never loads on mobile.
        var iframe = webPlayerList[i].querySelector('iframe');
        iframe.src = iframe.getAttribute('data-src') +
          '&assetRoot=' +
          assetRoot;
      }
    }

    var snackPlayerList = document.querySelectorAll('.snack-player');

    // Either show interactive or static code block, depending on desktop or mobile
    for (var i = 0; i < snackPlayerList.length; ++i) {
      var snackPlayer = snackPlayerList[i];
      var snackDesktopPlayer = snackPlayer.querySelectorAll(
        '.desktop-friendly-snack'
      )[0];
      var plainCodeExample = snackPlayer.querySelectorAll(
        '.mobile-friendly-snack'
      )[0];

      if (mobile) {
        snackDesktopPlayer.remove();
        plainCodeExample.style.display = 'block';
      } else {
        plainCodeExample.remove();
      }
    }

    var backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      return;
    }

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
    if (!backdrop) {
      return;
    }

    var modal = document.querySelector('.modal');

    backdrop.classList.add('modal-open');
    modal.classList.add('modal-open');
  }

  function hideModal(e) {
    var backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      return;
    }

    var modal = document.querySelector('.modal');

    backdrop.classList.remove('modal-open');
    modal.classList.remove('modal-open');
  }

  var toggledTarget;
  function toggleTarget(event) {
    var target = document.body.querySelector(
      event.target.getAttribute('data-target')
    );

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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
})();
