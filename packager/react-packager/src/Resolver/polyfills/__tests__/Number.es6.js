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

jest.autoMockOff();

describe('Number (ES6)', () => {
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
