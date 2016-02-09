/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

var processColor = require('processColor');

describe('processColor', () => {

  describe('predefined color names', () => {

    it('should convert red', () => {
      var colorFromString = processColor('red');
      var expectedInt = 0xFFFF0000;
      expect(colorFromString).toEqual(expectedInt);
    });

    it('should convert white', () => {
      var colorFromString = processColor('white');
      var expectedInt = 0xFFFFFFFF;
      expect(colorFromString).toEqual(expectedInt);
    });

    it('should convert black', () => {
      var colorFromString = processColor('black');
      var expectedInt = 0xFF000000;
      expect(colorFromString).toEqual(expectedInt);
    });

    it('should convert transparent', () => {
      var colorFromString = processColor('transparent');
      var expectedInt = 0x00000000;
      expect(colorFromString).toEqual(expectedInt);
    });
  });

  describe('RGB strings', () => {

    it('should convert rgb(x, y, z)', () => {
      var colorFromString = processColor('rgb(10, 20, 30)');
      var expectedInt = 0xFF0A141E;
      expect(colorFromString).toEqual(expectedInt);
    });

  });

  describe('RGBA strings', () => {

    it('should convert rgba(x, y, z, a)', () => {
      var colorFromString = processColor('rgba(10, 20, 30, 0.4)');
      var expectedInt = 0x660A141E;
      expect(colorFromString).toEqual(expectedInt);
    });

  });

  describe('HSL strings', () => {

    it('should convert hsl(x, y%, z%)', () => {
      var colorFromString = processColor('hsl(318, 69%, 55%)');
      var expectedInt = 0xFFDB3DAC;
      expect(colorFromString).toEqual(expectedInt);
    });

  });

  describe('HSLA strings', () => {

    it('should convert hsla(x, y%, z%, a)', () => {
      var colorFromString = processColor('hsla(318, 69%, 55%, 0.25)');
      var expectedInt = 0x40DB3DAC;
      expect(colorFromString).toEqual(expectedInt);
    });

  });

  describe('hex strings', () => {

    it('should convert #xxxxxx', () => {
      var colorFromString = processColor('#1e83c9');
      var expectedInt = 0xFF1E83C9;
      expect(colorFromString).toEqual(expectedInt);
    });

  });

});
