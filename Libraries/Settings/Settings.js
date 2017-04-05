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

const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const RCTSettingsManager = require('NativeModules').SettingsManager;

const invariant = require('fbjs/lib/invariant');

const subscriptions: Array<{keys: Array<string>; callback: ?Function}> = [];

/**
 * @class
 * @description
 * An interface to the native "preferences" file storage that uses simple key-value pairs
 * 
 */
const Settings = {
  _settings: RCTSettingsManager && RCTSettingsManager.settings,

  get(key: string): mixed {
    return this._settings[key];
  },

 /**
   * Sets the value for a name-value pairs
   * @param settings the object with the name/value pairs to set
   *
   * Note that on android the only allowed value types are number, string and boolean
   */
  set(settings: Object): void {
    Object.assign(this._settings, settings);
    RCTSettingsManager.setValues(settings);
  },


 /**
   * Monitor one or more keys for changed values
   * @param keys a string or an array of strings naming the keys to monitor
   * @callback the callback to invoke when one of the specified keys updates its value
   * @returns a number representing the watch ID which can be used to clear the watch
   */
  watchKeys(keys: string | Array<string>, callback: Function): number {
    if (typeof keys === 'string') {
      keys = [keys];
    }

    invariant(
      Array.isArray(keys),
      'keys should be a string or array of strings'
    );

    const sid = subscriptions.length;
    subscriptions.push({keys: keys, callback: callback});
    return sid;
  },

  /**
   * 
   * @param {*} watchId a number identifying which set of monitoried keys is to be cleared
   */
  clearWatch(watchId: number) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {keys: [], callback: null};
    }
  },

  _sendObservations(body: Object) {
    Object.keys(body).forEach((key) => {
      const newValue = body[key];
      const didChange = this._settings[key] !== newValue;
      this._settings[key] = newValue;

      if (didChange) {
        subscriptions.forEach((sub) => {
          if (sub.keys.indexOf(key) !== -1 && sub.callback) {
            sub.callback();
          }
        });
      }
    });
  },
};

RCTDeviceEventEmitter.addListener(
  'settingsUpdated',
  Settings._sendObservations.bind(Settings)
);

module.exports = Settings;
