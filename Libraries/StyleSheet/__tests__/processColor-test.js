/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const {OS} = require('Platform');
const processColor = require('processColor');

const platformSpecific =
  OS === 'android'
    ? unsigned => unsigned | 0 //eslint-disable-line no-bitwise
    : x => x;

describe('processColor', () => {
  describe('predefined color names', () => {
    it('should convert red', () => {
      const colorFromString = processColor('red');
      const expectedInt = 0xffff0000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert white', () => {
      const colorFromString = processColor('white');
      const expectedInt = 0xffffffff;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert black', () => {
      const colorFromString = processColor('black');
      const expectedInt = 0xff000000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert transparent', () => {
      const colorFromString = processColor('transparent');
      const expectedInt = 0x00000000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('RGB strings', () => {
    it('should convert rgb(x, y, z)', () => {
      const colorFromString = processColor('rgb(10, 20, 30)');
      const expectedInt = 0xff0a141e;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('RGBA strings', () => {
    it('should convert rgba(x, y, z, a)', () => {
      const colorFromString = processColor('rgba(10, 20, 30, 0.4)');
      const expectedInt = 0x660a141e;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('HSL strings', () => {
    it('should convert hsl(x, y%, z%)', () => {
      const colorFromString = processColor('hsl(318, 69%, 55%)');
      const expectedInt = 0xffdb3dac;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('HSLA strings', () => {
    it('should convert hsla(x, y%, z%, a)', () => {
      const colorFromString = processColor('hsla(318, 69%, 55%, 0.25)');
      const expectedInt = 0x40db3dac;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('hex strings', () => {
    it('should convert #xxxxxx', () => {
      const colorFromString = processColor('#1e83c9');
      const expectedInt = 0xff1e83c9;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });
});
