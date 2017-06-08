/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

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
      let obj = {
        ios: 'ios',
        android: 'android'
      };
      expect(PlatformIOS.select(obj)).toEqual(obj.ios);
      expect(PlatformAndroid.select(obj)).toEqual(obj.android);
    });

    it('should return platform default if single key missing', () => {
      let obj = {
        android: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40,
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual('default');
      obj = {
        ios: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40,
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual('default');
    });

    it('should return the value, if a multi-key is present and no single key present', () => {
      const obj = {
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual(obj['ios, android']);
      expect(PlatformAndroid.select(obj)).toEqual(obj['ios, android']);
    });

    it('should return the merged value, if a multi-key is present and a single key present; the single key value should override the multi-key value if there is overlap', () => {
      let obj = {
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        ios: {
          marginLeft: 50
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 50
      });

      obj = {
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        android: {
          marginLeft: 60
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 60
      });
    });

    it('should return the merged value, if a multi-key is present and a single key present; the single key value should override the multi-key value if there is overlap', () => {
      let obj = {
        ios: {
          marginLeft: 50
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 50
      });
      obj = {
        android: {
          marginLeft: 60
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 60
      });
    });

    it('should return the merged value, if more than one multi-keys are present and a single key present; the single key value should override the multi-key value if there is overlap, if a value appears in several multi-keys, the last one prevails', () => {
      let obj = {
        ['android, ios']: {
          width: 150,
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        ios: {
          marginLeft: 50
        },
        android: {
          marginLeft: 60
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 50
      });
      expect(PlatformAndroid.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 60
      });

      obj = {
        ios: {
          marginLeft: 50
        },
        ['android, ios']: {
          width: 150,
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        android: {
          marginLeft: 60
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 50
      });

      obj = {
        android: {
          marginLeft: 60
        },
        ['android, ios']: {
          width: 150,
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        ios: {
          marginLeft: 50
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 125,
        marginLeft: 60
      });

      obj = {
        ios: {
          marginLeft: 50
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        ['android, ios']: {
          width: 150,
        },
        android: {
          marginLeft: 60
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 150,
        marginLeft: 50
      });

      obj = {
        android: {
          marginLeft: 60
        },
        ['ios, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        ['android, ios']: {
          width: 150,
        },
        ios: {
          marginLeft: 50
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual({
        flexWrap: 'wrap',
        width: 150,
        marginLeft: 60
      });
    });

    it('should return default, if there is multi-key with a misspelled platform name', () => {
      let obj = {
        ['iosssss, android']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        default: 'default'
      };
      expect(PlatformIOS.select(obj)).toEqual('default');
      obj = {
        ['ios, androidddddd']: {
          flexWrap: 'wrap',
          width: 125,
          marginLeft: 40
        },
        default: 'default'
      };
      expect(PlatformAndroid.select(obj)).toEqual('default');


      it('should silently ignore unsupported platforms', () => {
        obj = {
          ['ios, android, windows']: {
            flexWrap: 'wrap',
            width: 125,
            marginLeft: 40
          },
          default: 'default'
        };
        expect(PlatformIOS.select(obj)).toEqual(obj['ios, android, windows']);
        expect(PlatformAndroid.select(obj)).toEqual(obj['ios, android, windows']);
      });
    });
  });
});
