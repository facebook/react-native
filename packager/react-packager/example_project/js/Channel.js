/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Channel
 */

var XHR = require('XHR');

/**
 * Client implementation of a server-push channel.
 *
 * @see Channel.js for full documentation
 */
var channel = null, at = null, delay = 0;
var Channel = {};

Channel.connect = function() {
  var url = '/pull';
  if (channel) {
    url += '?channel=' + channel + '&at=' + at;
  }
  XHR.get(url, function(err, xhr) {
    if (err) {
      delay = Math.min(Math.max(1000, delay * 2), 30000);
    } else {
      var res = xhr.responseText;
      res = JSON.parse(res);

      delay = 0;

      // Cache channel state
      channel = res.channel;
      at = res.at;

      var messages = res.messages;
      messages.forEach(function(message) {
        var ev = document.createEvent('CustomEvent');
        ev.initCustomEvent(message.event, true, true, message.detail);
        window.dispatchEvent(ev);
      });
    }

    // Reconnect
    setTimeout(Channel.connect, delay);
  });
};

module.exports = Channel;
