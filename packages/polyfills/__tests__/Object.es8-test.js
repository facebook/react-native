/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall jsinfra
 */

'use strict';

describe('Object (ES8)', () => {
  beforeEach(() => {
    delete Object.entries;
    delete Object.values;
    jest.resetModules();
    require('../Object.es8');
  });

  describe('Object.entries', () => {
    it('should have a length of 1', () => {
      expect(Object.entries.length).toBe(1);
    });

    it('should check for type', () => {
      expect(Object.entries.bind(null, null)).toThrow(
        TypeError('Object.entries called on non-object'),
      );
      expect(Object.entries.bind(null, undefined)).toThrow(
        TypeError('Object.entries called on non-object'),
      );
      expect(Object.entries.bind(null, [])).not.toThrow();
      expect(Object.entries.bind(null, () => {})).not.toThrow();
      expect(Object.entries.bind(null, {})).not.toThrow();
      expect(Object.entries.bind(null, 'abc')).not.toThrow();
    });

    it('should return enumerable entries', () => {
      const foo = Object.defineProperties(
        {},
        {
          x: {value: 10, enumerable: true},
          y: {value: 20},
        },
      );

      expect(Object.entries(foo)).toEqual([['x', 10]]);

      const bar = {x: 10, y: 20};
      expect(Object.entries(bar)).toEqual([
        ['x', 10],
        ['y', 20],
      ]);
    });

    it('should work with proto-less objects', () => {
      const foo = Object.create(null, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.entries(foo)).toEqual([['x', 10]]);
    });

    it('should return only own entries', () => {
      const foo = Object.create(
        {z: 30},
        {
          x: {value: 10, enumerable: true},
          y: {value: 20},
        },
      );

      expect(Object.entries(foo)).toEqual([['x', 10]]);
    });

    it('should convert to object primitive string', () => {
      expect(Object.entries('ab')).toEqual([
        ['0', 'a'],
        ['1', 'b'],
      ]);
    });
  });

  describe('Object.values', () => {
    it('should have a length of 1', () => {
      expect(Object.values.length).toBe(1);
    });

    it('should check for type', () => {
      expect(Object.values.bind(null, null)).toThrow(
        TypeError('Object.values called on non-object'),
      );
      expect(Object.values.bind(null, [])).not.toThrow();
      expect(Object.values.bind(null, () => {})).not.toThrow();
      expect(Object.values.bind(null, {})).not.toThrow();
    });

    it('should return enumerable values', () => {
      const foo = Object.defineProperties(
        {},
        {
          x: {value: 10, enumerable: true},
          y: {value: 20},
        },
      );

      expect(Object.values(foo)).toEqual([10]);

      const bar = {x: 10, y: 20};
      expect(Object.values(bar)).toEqual([10, 20]);
    });

    it('should work with proto-less objects', () => {
      const foo = Object.create(null, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.values(foo)).toEqual([10]);
    });

    it('should return only own values', () => {
      const foo = Object.create(
        {z: 30},
        {
          x: {value: 10, enumerable: true},
          y: {value: 20},
        },
      );

      expect(Object.values(foo)).toEqual([10]);
    });

    it('should convert to object primitive string', () => {
      expect(Object.values('ab')).toEqual(['a', 'b']);
    });
  });
});
