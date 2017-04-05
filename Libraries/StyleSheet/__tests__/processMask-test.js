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

const processMask = require('processMask');

describe('processMask', () => {

  describe('color processing', () => {
    it('should support standard color syntax', () => {
      var maskJson = processMask({
        colors: ['#0000', 'white', 'transparent', 'rgba(255,255,255,0.5)']
      });
      expect(maskJson.colors).toEqual([0, 0xffffffff, 0, 0x80ffffff]);
    });
  });

  describe('sideOrCorner processing', () => {
    it('should convert one side', () => {
      var maskJson = processMask({
        colors: ['#0000', 'white'],
        sideOrCorner: 'to right'
      });
      expect(maskJson.start.x).toEqual(0);
      expect(maskJson.start.y).toEqual(0.5);
      expect(maskJson.end.x).toEqual(1.0);
      expect(maskJson.end.y).toEqual(0.5);
    });

    it('should convert two sides to a corner', () => {
      var maskJson = processMask({
        colors: ['#0000', 'white'],
        sideOrCorner: 'to right bottom'
      });
      expect(maskJson.start.x).toEqual(0);
      expect(maskJson.start.y).toEqual(0);
      expect(maskJson.end.x).toEqual(1.0);
      expect(maskJson.end.y).toEqual(1.0);
    });
  });

  describe('validation', () => {
    it('should require colors', () => {
      var mask = { colors: [] };
      expect(() => processMask(mask)).toThrowErrorMatchingSnapshot();
    });

    it('should validate colors and locations', () => {
      var mask = {
        colors: ['#0000', 'white'],
        locations: [0, 0.5, 1.0]
      };
      expect(() => processMask(mask)).toThrowErrorMatchingSnapshot();
    });

    it('should validate sideOrCorner', () => {
      var mask = {
        colors: ['#0000', 'white'],
        locations: [0, 0.5],
        sideOrCorner: 'bottom'
      };
      expect(() => processMask(mask)).toThrowErrorMatchingSnapshot();
    });

    it('should validate sideOrCorner values', () => {
      var mask = {
        colors: ['#0000', 'white'],
        locations: [0, 0.5],
        sideOrCorner: 'to left botttom'
      };
      expect(() => processMask(mask)).toThrowErrorMatchingSnapshot();
    });
  });
});
