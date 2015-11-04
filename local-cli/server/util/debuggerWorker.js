/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* global self, importScripts, postMessage, onmessage: true */
/* eslint no-unused-vars: 0 */
'use strict';

var messageHandlers = {
  'executeApplicationScript': function(message, sendReply) {
    for (var key in message.inject) {
      self[key] = JSON.parse(message.inject[key]);
    }
    importScripts(message.url);
    sendReply();
  },
  'executeJSCall': function(message, sendReply) {
    var returnValue = [[], [], [], [], []];
    try {
      if (typeof require === 'function') {
        returnValue = require(message.moduleName)[message.moduleMethod].apply(null, message.arguments);
      }
    } finally {
      sendReply(JSON.stringify(returnValue));
    }
  }
};

onmessage = function(message) {
  var object = message.data;

  var sendReply = function(result) {
    postMessage({replyID: object.id, result: result});
  };

  var handler = messageHandlers[object.method];
  if (handler) {
    handler(object, sendReply);
  } else {
    console.warn('Unknown method: ' + object.method);
  }
};
