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
const normalizeColor = require('../normalizeColor');

it('forwards calls to @react-native/normalize-colors', () => {
  jest.resetModules().mock('@react-native/normalize-colors', () => jest.fn());

  expect(require('../normalizeColor')('#abc')).not.toBe(null);
  expect(require('@react-native/normalize-colors')).toBeCalled();
});

describe('iOS', () => {
  if (OS === 'ios') {
    const PlatformColor =
      require('../PlatformColorValueTypes.ios').PlatformColor;
    const DynamicColorIOS =
      require('../PlatformColorValueTypesIOS.ios').DynamicColorIOS;

    it('should normalize iOS PlatformColor colors', () => {
      const color = PlatformColor('systemRedColor');
      const normalizedColor = normalizeColor(color);
      const expectedColor = {semantic: ['systemRedColor']};
      expect(normalizedColor).toEqual(expectedColor);
    });

    it('should normalize iOS Dynamic colors with named colors', () => {
      const color = DynamicColorIOS({light: 'black', dark: 'white'});
      const normalizedColor = normalizeColor(color);
      const expectedColor = {
        dynamic: {
          light: normalizeColor('black'),
          dark: normalizeColor('white'),
        },
      };
      expect(normalizedColor).toEqual(expectedColor);
    });

    it('should normalize iOS Dynamic colors with accessible colors', () => {
      const color = DynamicColorIOS({
        light: 'black',
        dark: 'white',
        highContrastLight: 'red',
        highContrastDark: 'blue',
      });
      const normalizedColor = normalizeColor(color);
      const expectedColor = {
        dynamic: {
          light: normalizeColor('black'),
          dark: normalizeColor('white'),
          highContrastLight: normalizeColor('red'),
          highContrastDark: normalizeColor('blue'),
        },
      };
      expect(normalizedColor).toEqual(expectedColor);
    });

    it('should normalize iOS Dynamic colors with PlatformColor colors', () => {
      const color = DynamicColorIOS({
        light: PlatformColor('systemBlackColor'),
        dark: PlatformColor('systemWhiteColor'),
      });
      const normalizedColor = normalizeColor(color);
      const expectedColor = {
        dynamic: {
          light: {semantic: ['systemBlackColor']},
          dark: {semantic: ['systemWhiteColor']},
        },
      };
      expect(normalizedColor).toEqual(expectedColor);
    });
  }
});

describe('Android', () => {
  if (OS === 'android') {
    const PlatformColor =
      require('../PlatformColorValueTypes.android').PlatformColor;

    it('should normalize Android PlatformColor colors', () => {
      const color = PlatformColor('?attr/colorPrimary');
      const normalizedColor = normalizeColor(color);
      const expectedColor = {resource_paths: ['?attr/colorPrimary']};
      expect(normalizedColor).toEqual(expectedColor);
    });
  }
});
