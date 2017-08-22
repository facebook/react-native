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

    var webPlayerList = document.querySelectorAll(
      '.web-player'
    );

    // Either show interactive or static code block, depending on desktop or mobile
    for (var i = 0; i < webPlayerList.length; ++i) {
      webPlayerList[i].classList.add(
        mobile ? 'mobile' : 'desktop'
      );

      if (!mobile) {
        // Determine location to look up required assets
        var assetRoot = encodeURIComponent(
          document.location.origin + '/react-native'
        );

        // Set iframe src. Do this dynamically so the iframe never loads on mobile.
        var iframe = webPlayerList[i].querySelector(
          'iframe'
        );
        iframe.src = iframe.getAttribute('data-src') +
          '&assetRoot=' +
          assetRoot;
      }
    }

    var snackPlayerList = document.querySelectorAll(
      '.snack-player'
    );

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

    // handle tabs in docs
    convertBlocks();
    guessPlatformAndOS();

    var backdrop = document.querySelector(
      '.modal-backdrop'
    );
    if (!backdrop) {
      return;
    }

    var modalButtonOpenList = document.querySelectorAll(
      '.modal-button-open'
    );
    var modalButtonClose = document.querySelector(
      '.modal-button-close'
    );

    backdrop.addEventListener('click', hideModal);
    modalButtonClose.addEventListener('click', hideModal);

    // Bind event to NodeList items
    for (var i = 0; i < modalButtonOpenList.length; ++i) {
      modalButtonOpenList[i].addEventListener(
        'click',
        showModal
      );
    }
  }

  function showModal(e) {
    var backdrop = document.querySelector(
      '.modal-backdrop'
    );
    if (!backdrop) {
      return;
    }

    var modal = document.querySelector('.modal');

    backdrop.classList.add('modal-open');
    modal.classList.add('modal-open');
  }

  function hideModal(e) {
    var backdrop = document.querySelector(
      '.modal-backdrop'
    );
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
        toggledTarget &&
          toggledTarget.classList.remove('in');
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

  function convertBlocks() {
    // Convert <div>...<span><block /></span>...</div>
    // Into <div>...<block />...</div>
    var blocks = document.querySelectorAll('block');
    for (var i = 0; i < blocks.length; ++i) {
      var block = blocks[i];
      var span = blocks[i].parentNode;
      var container = span.parentNode;
      container.insertBefore(block, span);
      container.removeChild(span);
    }
    // Convert <div>...<block />content<block />...</div>
    // Into <div>...<block>content</block><block />...</div>
    blocks = document.querySelectorAll('block');
    for (var i = 0; i < blocks.length; ++i) {
      var block = blocks[i];
      while (
        block.nextSibling &&
        block.nextSibling.tagName !== 'BLOCK'
      ) {
        block.appendChild(block.nextSibling);
      }
    }
  }

  function displayTab(type, value) {
    var container = document.querySelectorAll('block')[
      0
    ].parentNode;
    container.className = 'display-' +
      type +
      '-' +
      value +
      ' ' +
      container.className.replace(
        RegExp('display-' + type + '-[a-z]+ ?'),
        ''
      );
  }

  function guessPlatformAndOS() {
    if (!document.querySelector('block')) {
      return;
    }

    // If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
    // us as close as possible to the correct platform and dev os using the hashtag and block walk up.
    var foundHash = false;
    if (
      window.location.hash !== '' &&
      window.location.hash !== 'content'
    ) {
      // content is default
      var hashLinks = document.querySelectorAll(
        'a.hash-link'
      );
      for (
        var i = 0;
        i < hashLinks.length && !foundHash;
        ++i
      ) {
        if (hashLinks[i].hash === window.location.hash) {
          var parent = hashLinks[i].parentElement;
          while (parent) {
            if (parent.tagName === 'BLOCK') {
              // Could be more than one target os and dev platform, but just choose some sort of order
              // of priority here.

              // Dev OS
              if (parent.className.indexOf('mac') > -1) {
                displayTab('os', 'mac');
                foundHash = true;
              } else if (
                parent.className.indexOf('linux') > -1
              ) {
                displayTab('os', 'linux');
                foundHash = true;
              } else if (
                parent.className.indexOf('windows') > -1
              ) {
                displayTab('os', 'windows');
                foundHash = true;
              } else {
                break;
              }

              // Target Platform
              if (parent.className.indexOf('ios') > -1) {
                displayTab('platform', 'ios');
                foundHash = true;
              } else if (
                parent.className.indexOf('android') > -1
              ) {
                displayTab('platform', 'android');
                foundHash = true;
              } else {
                break;
              }

              // Guide
              if (parent.className.indexOf('native') > -1) {
                displayTab('guide', 'native');
                foundHash = true;
              } else if (
                parent.className.indexOf('quickstart') > -1
              ) {
                displayTab('guide', 'quickstart');
                foundHash = true;
              } else {
                break;
              }

              break;
            }
            parent = parent.parentElement;
          }
        }
      }
    }

    // Do the default if there is no matching hash
    if (!foundHash) {
      var isMac = navigator.platform === 'MacIntel';
      var isWindows = navigator.platform === 'Win32';
      displayTab('platform', isMac ? 'ios' : 'android');
      displayTab(
        'os',
        isMac ? 'mac' : isWindows ? 'windows' : 'linux'
      );
      displayTab('guide', 'quickstart');
      displayTab('language', 'objc');
    }
  }
})();
