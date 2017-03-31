/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* global __fbBatchedBridge, self, importScripts, postMessage, onmessage: true */
/* eslint no-unused-vars: 0 */

'use strict';

onmessage = (function() {
  var visibilityState;
  var showVisibilityWarning = (function() {
    var hasWarned = false;
    return function() {
      // Wait until `YellowBox` gets initialized before displaying the warning.
      if (hasWarned || console.warn.toString().includes('[native code]')) {
        return;
      }
      hasWarned = true;
      console.warn(
        'Remote debugger is in a background tab which may cause apps to ' +
        'perform slowly. Fix this by foregrounding the tab (or opening it in ' +
        'a separate window).'
      );
    };
  })();

  var messageHandlers = {
    'executeApplicationScript': function(message, sendReply) {
      for (var key in message.inject) {
        self[key] = JSON.parse(message.inject[key]);
      }
      var error;
      try {
        importScripts(message.url);
      } catch (err) {
        error = JSON.stringify(err);
      }
      sendReply(null /* result */, error);
    },
    'setDebuggerVisibility': function(message) {
      visibilityState = message.visibilityState;
    },
  };

  return function(message) {
    if (visibilityState === 'hidden') {
      showVisibilityWarning();
    }

    var object = message.data;

    var sendReply = function(result, error) {
      postMessage({replyID: object.id, result: result, error: error});
    };

    var handler = messageHandlers[object.method];
    if (handler) {
      // Special cased handlers
      handler(object, sendReply);
    } else {
      // Other methods get called on the bridge
      var returnValue = [[], [], [], 0];
      try {
        if (typeof __fbBatchedBridge === 'object') {
          returnValue = __fbBatchedBridge[object.method].apply(null, object.arguments);
        }
      } finally {
        sendReply(JSON.stringify(returnValue));
      }
    }
  };
})();
