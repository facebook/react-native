/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var PlatformIOS = require('../Platform.ios');
var PlatformAndroid = require('../Platform.android');

describe('Platform', () => {

  describe('OS', () => {
    it('should have correct value', () => {
      expect(PlatformIOS.OS).toEqual('ios');
      expect(PlatformAndroid.OS).toEqual('android');
    });
  });

  describe('select', () => {
    it('should return platform specific value', () => {
      const obj = { ios: 'ios', android: 'android' };
      expect(PlatformIOS.select(obj)).toEqual(obj.ios);
      expect(PlatformAndroid.select(obj)).toEqual(obj.android);
    });
  });

});
