/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule GeoLocation
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLocationObserver = require('NativeModules').RCTLocationObserver;

var invariant = require('invariant');
var logError = require('logError');
var warning = require('warning');

var subscriptions = [];

var updatesEnabled = false;

var ensureObserving = function() {
  if (!updatesEnabled) {
    RCTLocationObserver.startObserving();
    updatesEnabled = true;
  }
};

/**
 * /!\ ATTENTION /!\
 * You need to add NSLocationWhenInUseUsageDescription key
 * in Info.plist to enable geolocation, otherwise it's going
 * to *fail silently*!
 * \!/           \!/
 *
 * GeoLocation follows the MDN specification:
 * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 */
class GeoLocation {
  static getCurrentPosition(geo_success, geo_error, geo_options) {
    invariant(
      typeof geo_success === 'function',
      'Must provide a valid geo_success callback.'
    );
    if (geo_options) {
      warning('geo_options are not yet supported.');
    }
    ensureObserving();
    RCTLocationObserver.getCurrentPosition(
      geo_success,
      geo_error || logError
    );
  }
  static watchPosition(callback) {
    ensureObserving();
    var watchID = subscriptions.length;
    subscriptions.push(
      RCTDeviceEventEmitter.addListener(
        'geoLocationDidChange',
        callback
      )
    );
    return watchID;
  }
  static clearWatch(watchID) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }
    sub.remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      GeoLocation.stopObserving();
    }
  }
  static stopObserving() {
    if (updatesEnabled) {
      RCTLocationObserver.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        if (subscriptions[ii]) {
          warning('Called stopObserving with existing subscriptions.');
          subscriptions[ii].remove();
        }
      }
      subscriptions = [];
    } else {
      warning('Tried to stop observing when not observing.');
    }
  }
}

module.exports = GeoLocation;
