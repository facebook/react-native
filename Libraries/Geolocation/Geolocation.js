/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Geolocation
 * @flow
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLocationObserver = require('NativeModules').LocationObserver;

var invariant = require('invariant');
var logError = require('logError');
var warning = require('warning');

var subscriptions = [];

var updatesEnabled = false;

/**
 * You need to include the `NSLocationWhenInUseUsageDescription` key
 * in Info.plist to enable geolocation. Geolocation is enabled by default
 * when you create a project with `react-native init`.
 *
 * Geolocation follows the MDN specification:
 * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 */
var Geolocation = {

  getCurrentPosition: function(
    geo_success: Function,
    geo_error?: Function,
    geo_options?: Object
  ) {
    invariant(
      typeof geo_success === 'function',
      'Must provide a valid geo_success callback.'
    );
    RCTLocationObserver.getCurrentPosition(
      geo_options || {},
      geo_success,
      geo_error || logError
    );
  },

  watchPosition: function(success: Function, error?: Function, options?: Object): number {
    if (!updatesEnabled) {
      RCTLocationObserver.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      RCTDeviceEventEmitter.addListener(
        'geolocationDidChange',
        success
      ),
      error ? RCTDeviceEventEmitter.addListener(
        'geolocationError',
        error
      ) : null,
    ]);
    return watchID;
  },

  clearWatch: function(watchID: number) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }

    sub[0].remove();
    // array element refinements not yet enabled in Flow
    var sub1 = sub[1]; sub1 && sub1.remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      Geolocation.stopObserving();
    }
  },

  stopObserving: function() {
    if (updatesEnabled) {
      RCTLocationObserver.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        var sub = subscriptions[ii];
        if (sub) {
          warning('Called stopObserving with existing subscriptions.');
          sub[0].remove();
          // array element refinements not yet enabled in Flow
          var sub1 = sub[1]; sub1 && sub1.remove();
        }
      }
      subscriptions = [];
    }
  }
}

module.exports = Geolocation;
