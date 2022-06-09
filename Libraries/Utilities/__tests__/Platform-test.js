/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const PlatformIOS = require('../Platform.ios');
const PlatformAndroid = require('../Platform.android');

describe('Platform', () => {
  describe('OS', () => {
    it('should have correct value', () => {
      expect(PlatformIOS.OS).toEqual('ios');
      expect(PlatformAndroid.OS).toEqual('android');
    });
  });

  describe('select', () => {
    it('should return platform specific value', () => {
      const obj = {ios: 'ios', android: 'android'};
      expect(PlatformIOS.select(obj)).toEqual(obj.ios);
      expect(PlatformAndroid.select(obj)).toEqual(obj.android);
    });

    it('should return native value if no specific value was found', () => {
      const obj = {native: 'native', default: 'default'};
      expect(PlatformIOS.select(obj)).toEqual(obj.native);
      expect(PlatformAndroid.select(obj)).toEqual(obj.native);
    });

    it('should return default value if no specific value was found', () => {
      const obj = {default: 'default'};
      expect(PlatformIOS.select(obj)).toEqual(obj.default);
      expect(PlatformAndroid.select(obj)).toEqual(obj.default);
    });
  });
});
