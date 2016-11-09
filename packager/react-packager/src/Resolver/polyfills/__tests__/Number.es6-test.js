/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

jest.disableAutomock();

describe('Number (ES6)', () => {
  describe('EPSILON', () => {
    beforeEach(() => {
      delete Number.EPSILON;
      jest.resetModuleRegistry();
      require('../Number.es6');
    });
    it('is 2^(-52)', () => {
      expect(Number.EPSILON).toBe(Math.pow(2, -52));
    });
    it('can be used to test equality', () => {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON#Testing_equality
      expect(Number.EPSILON).toBeGreaterThan(Math.abs(0.2 - 0.3 + 0.1));
    });
  });
  describe('MAX_SAFE_INTEGER', () => {
    beforeEach(() => {
      delete Number.MAX_SAFE_INTEGER;
      jest.resetModuleRegistry();
      require('../Number.es6');
    });
    it('is 2^53 - 1', () => {
      expect(Number.MAX_SAFE_INTEGER).toBe(Math.pow(2, 53) - 1);
    });
  });
  describe('MIN_SAFE_INTEGER', () => {
    beforeEach(() => {
      delete Number.MIN_SAFE_INTEGER;
      jest.resetModuleRegistry();
      require('../Number.es6');
    });
    it('is -(2^53 - 1)', () => {
      expect(Number.MIN_SAFE_INTEGER).toBe(-(Math.pow(2, 53) - 1));
    });
  });
  describe('isNaN()', () => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN#Examples
    beforeEach(() => {
      delete Number.isNaN;
      jest.resetModuleRegistry();
      require('../Number.es6');
    });
    it('returns true when fed something that is not-a-number', () => {
      [
        NaN,
        Number.NaN,
        0 / 0,
      ].forEach(value => expect(Number.isNaN(value)).toBe(true));
    });
    it('returns false when fed something other than not-a-number', () => {
      [
        'NaN',
        undefined,
        {},
        'blabla',
        true,
        null,
        37,
        '37',
        '37.37',
        '',
        ' ',
      ].forEach(value => expect(Number.isNaN(value)).toBe(false));
    });
  });
});
