/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('../Platform.ios');
jest.unmock('../Platform.android');

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

    it('should return platform default if ios key missing', () => {
      const noIOSKey = { android: { flexWrap: 'wrap', width: 125, marginLeft: 40, }, default: 'default' };
      expect(PlatformIOS.select(noIOSKey)).toEqual('default');
    });
    it('should return platform default if android key missing', () => {
      const noAndroidKey = { ios: { flexWrap: 'wrap', width: 125, marginLeft: 40, }, default: 'default' };
      expect(PlatformAndroid.select(noAndroidKey)).toEqual('default');
    });

    it('should return the value, if a multi-key is present and no single key present', () => {
      const multiKeyWithoutSingleKeyPresent = { ['ios, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40, }, default: 'default' };
      expect(PlatformIOS.select(multiKeyWithoutSingleKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 40, });
      expect(PlatformAndroid.select(multiKeyWithoutSingleKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 40, });
    });

    it('should return the merged value, if a multi-key is present and a single key present; the single key value should override the multi-key value if there is overlap', () => {
      const multiKeyWithIOSKeyPresent = { ['ios, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, ios: { marginLeft: 50 }, default: 'default' };
      const multiKeyWithAndroidKeyPresent = { ['ios, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, android: { marginLeft: 60 }, default: 'default' };
      expect(PlatformIOS.select(multiKeyWithIOSKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 50});
      expect(PlatformAndroid.select(multiKeyWithAndroidKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 60});
    });

    it('should return the merged value, if more than one multi-keys are present and a single key present; the single key value should override the multi-key value if there is overlap', () => {
      const moreMultiKeyWithSingleKeyPresent = { ['android, ios']: { width: 150, }, ['ios, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, ios: { marginLeft: 50 }, android: { marginLeft: 60 }, default: 'default' }
      expect(PlatformIOS.select(moreMultiKeyWithSingleKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 50});
      expect(PlatformAndroid.select(moreMultiKeyWithSingleKeyPresent)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 60});
    });

    it('should return default, if there is multi-key with a misspelled platform name', () => {
      const multiKeyWithIOSMisspelled = { ['iosssss, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, default: 'default' };
      const multiKeyWithAndroidMisspelled = { ['ios, androiddddd']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, default: 'default' };
      expect(PlatformIOS.select(multiKeyWithIOSMisspelled)).toEqual('default');
      expect(PlatformAndroid.select(multiKeyWithAndroidMisspelled)).toEqual('default');
    });

    it('should return the value of the single key, if there is multi-key with a misspelled platform name and a proper single key', () => {
      const multiKeyWithIOSMisspelledAndIOSPresent = { ['iosssss, android']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, ios: { marginLeft: 50 }, default: 'default' };
      const multiKeyWithAndroidMisspelledAndAndroidPresent = { ['ios, androiddddd']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, android: { marginLeft: 60 }, default: 'default' };
      expect(PlatformIOS.select(multiKeyWithIOSMisspelledAndIOSPresent)).toEqual({ marginLeft: 50 });
      expect(PlatformAndroid.select(multiKeyWithAndroidMisspelledAndAndroidPresent)).toEqual({ marginLeft: 60 });
    });

    it('should silently ignore unsupported platforms', () => {
      const unsupportedPlatform = { ['ios, android, windows']: { flexWrap: 'wrap', width: 125, marginLeft: 40 }, default: 'default' };
      expect(PlatformIOS.select(unsupportedPlatform)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 40 });
      expect(PlatformAndroid.select(unsupportedPlatform)).toEqual({ flexWrap: 'wrap', width: 125, marginLeft: 40 });
    });
  });
});
