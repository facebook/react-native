/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TVEventHandler
 * @flow
 */
'use strict';

const React = require('React');
const TVNavigationEventEmitter = require('NativeModules').TVNavigationEventEmitter;
const NativeEventEmitter = require('NativeEventEmitter');

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
