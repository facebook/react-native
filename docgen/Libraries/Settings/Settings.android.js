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

var Settings = {
  get(key: string): mixed {
    console.warn('Settings is not yet supported on Android');
    return null;
  },

  set(settings: Object) {
    console.warn('Settings is not yet supported on Android');
  },

  watchKeys(keys: string | Array<string>, callback: Function): number {
    console.warn('Settings is not yet supported on Android');
    return -1;
  },

  clearWatch(watchId: number) {
    console.warn('Settings is not yet supported on Android');
  },
};

module.exports = Settings;
