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
  OS: 'ios',
  get Version() {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.osVersion;
  },
  get isPad() {
    const constants = NativeModules.PlatformConstants;
    return constants ? constants.interfaceIdiom === 'pad' : false;
  },
  get isTVOS() {
    const constants = NativeModules.PlatformConstants;
    return constants ? constants.interfaceIdiom === 'tv' : false;
  },
  get isTesting(): boolean {
    const constants = NativeModules.PlatformConstants;
    return constants && constants.isTesting;
  },
  select: (obj: Object): Object => {
    let retObj: Object = obj.default;
    const keys = Object.keys(obj).filter(x => x.match(/\bios\b/));
    if (keys.length === 1 && 'ios' in obj) {
      return obj.ios;
    }
    if (keys.length >= 1) {
      retObj = {};
      const multiVal: Object = keys.reduce((prev: Object, curr: Object) => ({...prev, ...obj[curr]}), {});
      retObj = {...retObj, ...multiVal};
    }
    return retObj;
  },
};

module.exports = Platform;
