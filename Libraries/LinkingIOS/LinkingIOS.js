/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LinkingIOS
 * @flow
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLinkingManager = require('NativeModules').LinkingManager;
var invariant = require('invariant');

var _notifHandlers = {};
var _initialURL = RCTLinkingManager &&
  RCTLinkingManager.initialURL;

var DEVICE_NOTIF_EVENT = 'openURL';

class LinkingIOS {
  static addEventListener(type, handler) {
    invariant(
      type === 'url',
      'LinkingIOS only supports `url` events'
    );
    _notifHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      (notifData) => {
        handler(new LinkingIOS(notifData));
      }
    );
  }

  static removeEventListener(type, handler) {
    invariant(
      type === 'url',
      'LinkingIOS only supports `url` events'
    );
    if (!_notifHandlers[handler]) {
      return;
    }
    _notifHandlers[handler].remove();
    _notifHandlers[handler] = null;
  }

  static openURL(url) {
    invariant(
      typeof url === 'string',
      'Invalid url: should be a string'
    );
    RCTLinkingManager.openURL(url);
  }

  static canOpenURL(url, callback) {
    invariant(
      typeof url === 'string',
      'Invalid url: should be a string'
    );
    invariant(
      typeof callback === 'function',
      'A valid callback function is required'
    );
    RCTLinkingManager.canOpenURL(url, callback);
  }

  static popInitialURL() {
    var initialURL = _initialURL;
    _initialURL = null;
    return initialURL;
  }
}

module.exports = LinkingIOS;
