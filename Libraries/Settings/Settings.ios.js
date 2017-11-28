/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Settings
 * @flow
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTSettingsManager = require('NativeModules').SettingsManager;

var invariant = require('fbjs/lib/invariant');

var subscriptions: Array<{keys: Array<string>, callback: ?Function}> = [];

var Settings = {
  _settings: RCTSettingsManager && RCTSettingsManager.settings,

  get(key: string): mixed {
    return this._settings[key];
  },

  set(settings: Object) {
    this._settings = Object.assign(this._settings, settings);
    RCTSettingsManager.setValues(settings);
  },

  watchKeys(keys: string | Array<string>, callback: Function): number {
    if (typeof keys === 'string') {
      keys = [keys];
    }

    invariant(
      Array.isArray(keys),
      'keys should be a string or array of strings'
    );

    var sid = subscriptions.length;
    subscriptions.push({keys: keys, callback: callback});
    return sid;
  },

  clearWatch(watchId: number) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {keys: [], callback: null};
    }
  },

  _sendObservations(body: Object) {
    const watchedKeys = new Set(subscriptions.reduce((keys, subscription) => {
      return subscription.keys.concat(subscription.keys);
    }, []));

    watchedKeys.forEach((key) => {
      const newValue = body[key];
      this._checkValue(key, newValue);
    });

    this._settings = {
      ...body,
    };
  },

  _checkValue(key: String, newValue: mixed) {
    var didChange = this._settings[key] !== newValue;
    this._settings[key] = newValue;
    if (didChange) {
      this._sendUpdate(key);
    }
  },

  _sendUpdate(key: String) {
    // TODO maybe combine the updates so that only one is triggered per
    // subscription instead of 1 per key change.
    subscriptions.forEach((subscription) => {
      if (subscription.keys.indexOf(key) !== -1 && subscription.callback) {
        subscription.callback();
      }
    });
  }
};

RCTDeviceEventEmitter.addListener(
  'settingsUpdated',
  Settings._sendObservations.bind(Settings)
);

module.exports = Settings;
