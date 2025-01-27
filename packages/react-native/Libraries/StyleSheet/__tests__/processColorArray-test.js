/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const {OS} = require('../../Utilities/Platform');
const PlatformColorAndroid =
  require('../PlatformColorValueTypes.android').PlatformColor;
const PlatformColorIOS =
  require('../PlatformColorValueTypes.ios').PlatformColor;
const DynamicColorIOS =
  require('../PlatformColorValueTypesIOS.ios').DynamicColorIOS;
const processColorArray = require('../processColorArray');

const platformSpecific =
  OS === 'android'
    ? unsigned => unsigned | 0 // eslint-disable-line no-bitwise
    : x => x;

describe('processColorArray', () => {
  describe('predefined color name array', () => {
    it('should convert array of color name type', () => {
      const colorFromStringArray = processColorArray(['red', 'white', 'black']);
      const expectedIntArray = [0xffff0000, 0xffffffff, 0xff000000].map(
        platformSpecific,
      );
      expect(colorFromStringArray).toEqual(expectedIntArray);
    });

    it('should convert array of color type rgb(x, y, z)', () => {
      const colorFromRGBArray = processColorArray([
        'rgb(10, 20, 30)',
        'rgb(30, 20, 10)',
        'rgb(50, 150, 250)',
      ]);
      const expectedIntArray = [0xff0a141e, 0xff1e140a, 0xff3296fa].map(
        platformSpecific,
      );
      expect(colorFromRGBArray).toEqual(platformSpecific(expectedIntArray));
    });

    it('should convert array of color type hsl(x, y%, z%)', () => {
      const colorFromHSLArray = processColorArray([
        'hsl(318, 69%, 55%)',
        'hsl(218, 59%, 33%)',
        'hsl(118, 49%, 22%)',
      ]);
      const expectedIntArray = [0xffdb3dac, 0xff234786, 0xff1e541d].map(
        platformSpecific,
      );
      expect(colorFromHSLArray).toEqual(platformSpecific(expectedIntArray));
    });

    it('should return null if no array', () => {
      const colorFromNoArray = processColorArray(null);
      expect(colorFromNoArray).toEqual(null);
    });

    it('converts invalid colors to transparent', () => {
      const spy = jest.spyOn(console, 'error').mockReturnValue(undefined);

      const colors = ['red', '???', null, undefined, false];
      const colorFromStringArray = processColorArray(colors);
      const expectedIntArray = [
        0xffff0000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
      ].map(platformSpecific);
      expect(colorFromStringArray).toEqual(expectedIntArray);

      for (const color of colors.slice(1)) {
        expect(spy).toHaveBeenCalledWith(
          'Invalid value in color array:',
          color,
        );
      }

      spy.mockRestore();
    });
  });

  describe('iOS', () => {
    if (OS === 'ios') {
      it('should convert array of iOS PlatformColor colors', () => {
        const colorFromArray = processColorArray([
          PlatformColorIOS('systemColorWhite'),
          PlatformColorIOS('systemColorBlack'),
        ]);
        const expectedColorValueArray = [
          {semantic: ['systemColorWhite']},
          {semantic: ['systemColorBlack']},
        ];
        expect(colorFromArray).toEqual(expectedColorValueArray);
      });

      it('should process iOS Dynamic colors', () => {
        const colorFromArray = processColorArray([
          DynamicColorIOS({light: 'black', dark: 'white'}),
          DynamicColorIOS({light: 'white', dark: 'black'}),
        ]);
        const expectedColorValueArray = [
          {dynamic: {light: 0xff000000, dark: 0xffffffff}},
          {dynamic: {light: 0xffffffff, dark: 0xff000000}},
        ];
        expect(colorFromArray).toEqual(expectedColorValueArray);
      });
    }
  });

  describe('Android', () => {
    if (OS === 'android') {
      it('should convert array of Android PlatformColor colors', () => {
        const colorFromArray = processColorArray([
          PlatformColorAndroid('?attr/colorPrimary'),
          PlatformColorAndroid('?colorPrimaryDark'),
        ]);
        const expectedColorValueArray = [
          {resource_paths: ['?attr/colorPrimary']},
          {resource_paths: ['?colorPrimaryDark']},
        ];
        expect(colorFromArray).toEqual(expectedColorValueArray);
      });
    }
  });
});
