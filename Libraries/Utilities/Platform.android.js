/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Platform
 * @flow
 */

'use strict';

const NativeModules = require('NativeModules');

const Platform = {
  OS: 'android',
  get Version() {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.Version;
  },
  get isTesting(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object) => {
    let retObj: Object = obj.default;
    const keys = Object.keys(obj).filter(x => x.match(/\bandroid\b/));
    if (keys.length === 1 && 'android' in obj) {
      return obj.android;
    }
    if (keys.length >= 1) {
      retObj = {};
      const multiVal = keys.reduce((prev: Object, curr: Object) => ({...prev, ...obj[curr]}), {});
      retObj = {...retObj, ...multiVal};
    }
    return retObj;
  },
};

module.exports = Platform;
