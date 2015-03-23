/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule main
 */
var Channel = require('Channel');

function toArray(arr) {return Array.prototype.slice.apply(arr);}
function $(sel) {return document.querySelector(sel);}
function $$(sel) {return toArray(document.querySelectorAll(sel));}

window.addEventListener('load', function() {
  function channelLog() {
    var args = Array.prototype.slice.apply(arguments);
    var ts = new Date();
    var el = document.createElement('li');
    args.unshift(ts.getHours() + ':' +
      ('0' + ts.getMinutes()).substr(0,2) + ':' +
      ('0' + ts.getSeconds()).substr(0,2));
    el.className = 'console-entry';
    el.innerHTML = args.join(' ');
    $('#console').appendChild(el);
    el.scrollIntoView();
  }

  global.addEventListener('ChannelInit', function(event) {
    $('#console').innerHTML = '';
    channelLog(event.type);
  });

  global.addEventListener('ChannelLog', function(event) {
    channelLog.apply(null, event.detail);
  });

  // Tab pane support
  function showTab(paneId) {
    paneId = paneId.replace(/\W/g, '');
    if (paneId) {
      $$('#nav-panes > div').forEach(function(pane) {
        pane.classList.toggle('active', pane.id === paneId);
      });
      $$('#nav-tabs li').forEach(function(tab) {
        tab.classList.toggle('active',
          tab.getAttribute('data-pane') === paneId);
      });
      global.history.replaceState(null, null, '#' + paneId);
    }
  }

  $('#nav-tabs').onclick = function(e) {
    showTab(e.target.getAttribute('data-pane'));
  };

  // Show current pane
  showTab(location.hash);

  // Connect to server-push channel
  Channel.connect();
});
