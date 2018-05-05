/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('Object (ES6)', () => {
  beforeEach(() => {
    delete Object.entries;
    delete Object.values;
    jest.resetModules();
    require('../Object.es6');
  });

  describe('Object.is', () => {
    it('should pass', () => {
      expect(Object.is('foo', 'foo')).toEqual(true);
      const test = {a: 1};
      expect(Object.is(test, test)).toEqual(true);
      expect(Object.is(null, null)).toEqual(true);
      expect(Object.is(0, -0)).toEqual(false);
      expect(Object.is(-0, -0)).toEqual(true);
      expect(Object.is(NaN, 0 / 0)).toEqual(true);
    });
  });
});
