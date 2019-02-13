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

const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const RCTSettingsManager = require('NativeModules').SettingsManager;

const invariant = require('invariant');

const subscriptions: Array<{keys: Array<string>, callback: ?Function}> = [];

const Settings = {
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
      'keys should be a string or array of strings',
    );

    const sid = subscriptions.length;
    subscriptions.push({keys: keys, callback: callback});
    return sid;
  },

  clearWatch(watchId: number) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {keys: [], callback: null};
    }
  },

  _sendObservations(body: Object) {
    Object.keys(body).forEach(key => {
      const newValue = body[key];
      const didChange = this._settings[key] !== newValue;
      this._settings[key] = newValue;

      if (didChange) {
        subscriptions.forEach(sub => {
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
  Settings._sendObservations.bind(Settings),
);

module.exports = Settings;
