/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TVEventHandler
 * @flow
 */
'use strict';

const React = require('../../react-native/React');
const TVNavigationEventEmitter = require('../../BatchedBridge/NativeModules').TVNavigationEventEmitter;
const NativeEventEmitter = require('../../EventEmitter/NativeEventEmitter');

function TVEventHandler() {
  this.__nativeTVNavigationEventListener = null;
  this.__nativeTVNavigationEventEmitter = null;
}

TVEventHandler.prototype.enable = function(component: ?any, callback: Function) {
  if (!TVNavigationEventEmitter) {
    return;
  }

  this.__nativeTVNavigationEventEmitter = new NativeEventEmitter(TVNavigationEventEmitter);
  this.__nativeTVNavigationEventListener = this.__nativeTVNavigationEventEmitter.addListener(
    'onTVNavEvent',
    (data) => {
      if (callback) {
        callback(component, data);
      }
    }
  );
};

TVEventHandler.prototype.disable = function() {
  if (this.__nativeTVNavigationEventListener) {
    this.__nativeTVNavigationEventListener.remove();
    delete this.__nativeTVNavigationEventListener;
  }
  if (this.__nativeTVNavigationEventEmitter) {
    delete this.__nativeTVNavigationEventEmitter;
  }
};

module.exports = TVEventHandler;
