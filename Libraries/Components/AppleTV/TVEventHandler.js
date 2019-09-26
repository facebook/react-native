/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const TVNavigationEventEmitter = require('../../BatchedBridge/NativeModules')
  .TVNavigationEventEmitter;
const NativeEventEmitter = require('../../EventEmitter/NativeEventEmitter');

function TVEventHandler() {
  this.__nativeTVNavigationEventListener = null;
  this.__nativeTVNavigationEventEmitter = null;
}

TVEventHandler.prototype.enable = function(
  component: ?any,
  callback: Function,
) {
  if (Platform.OS === 'ios' && !TVNavigationEventEmitter) {
    return;
  }

  this.__nativeTVNavigationEventEmitter = new NativeEventEmitter(
    TVNavigationEventEmitter,
  );
  this.__nativeTVNavigationEventListener = this.__nativeTVNavigationEventEmitter.addListener(
    'onHWKeyEvent',
    data => {
      if (callback) {
        callback(component, data);
      }
    },
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
