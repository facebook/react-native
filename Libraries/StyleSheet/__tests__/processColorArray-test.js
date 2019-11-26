/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const {OS} = require('../../Utilities/Platform');
const processColorArray = require('../processColorArray');

const platformSpecific =
  OS === 'android'
    ? unsigned => unsigned | 0 //eslint-disable-line no-bitwise
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
  });
});
