/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Turn off ESLint for this file because it's sent down to users as-is.

/* eslint-disable */
window.addEventListener('load', function() {
  // add event listener for all tab
  document.querySelectorAll('.nav-link').forEach(function(el) {
    el.addEventListener('click', function(e) {
      var groupId = e.target.getAttribute('data-group');
      document
        .querySelectorAll('.nav-link[data-group='.concat(groupId, ']'))
        .forEach(function(el) {
          el.classList.remove('active');
        });
      document
        .querySelectorAll('.tab-pane[data-group='.concat(groupId, ']'))
        .forEach(function(el) {
          el.classList.remove('active');
        });
      e.target.classList.add('active');
      document
        .querySelector('#'.concat(e.target.getAttribute('data-tab')))
        .classList.add('active');
    });
  });
});
