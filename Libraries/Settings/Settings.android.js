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

const Settings = require('NativeModules').Settings;
const DeviceEventEmitter = require('RCTDeviceEventEmitter');
let COUNT = 0;

module.exports = {
  get(key: string, name: string): mixed {
    return Settings.get(key, name);
  },

  set(settings: Object, name: string) {
    Settings.set(settings, name);
  },

  watchKeys(keys: string | Array<string>, callback: Function , name: string): number {
    const id = COUNT++;
    DeviceEventEmitter.addListener('' + id, (e) => {
      callback(e);
    });
    if (typeof keys === 'string') {
      keys = [keys];
    }
    Settings.watchKeys(keys, '' + id, name);
    return id;
  },

  clearWatch(watchId: number) {
    return Settings.clearWatch('' + watchId);
  },
};

