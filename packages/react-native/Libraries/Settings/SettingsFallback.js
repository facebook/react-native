/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Settings = {
  get(key: string): any {
    console.warn('Settings is not yet supported on this platform.');
    return null;
  },

  set(settings: Object) {
    console.warn('Settings is not yet supported on this platform.');
  },

  watchKeys(keys: string | Array<string>, callback: () => void): number {
    console.warn('Settings is not yet supported on this platform.');
    return -1;
  },

  clearWatch(watchId: number) {
    console.warn('Settings is not yet supported on this platform.');
  },
};

export default Settings;
