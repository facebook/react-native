/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+jsinfra
 */

 /* eslint-disable fb-www/object-create-only-one-param */

jest.autoMockOff();

describe('Object (ES7)', () => {
  beforeEach(() => {
    delete Object.entries;
    delete Object.values;
    jest.resetModuleRegistry();
    require('../Object.es7');
  });

  describe('Object.entries', () => {
    it('should have a length of 1', () => {
      expect(Object.entries.length).toBe(1);
    });

    it('should check for type', () => {
      expect(Object.entries.bind(null, null)).toThrow(TypeError(
        'Object.entries called on non-object'
      ));
      expect(Object.entries.bind(null, undefined)).toThrow(TypeError(
        'Object.entries called on non-object'
      ));
      expect(Object.entries.bind(null, [])).not.toThrow();
      expect(Object.entries.bind(null, () => {})).not.toThrow();
      expect(Object.entries.bind(null, {})).not.toThrow();
      expect(Object.entries.bind(null, 'abc')).not.toThrow();
    });

    it('should return enumerable entries', () => {
      let foo = Object.defineProperties({}, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.entries(foo)).toEqual([['x', 10]]);

      let bar = {x: 10, y: 20};
      expect(Object.entries(bar)).toEqual([['x', 10], ['y', 20]]);
    });

    it('should work with proto-less objects', () => {
      let foo = Object.create(null, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.entries(foo)).toEqual([['x', 10]]);
    });

    it('should return only own entries', () => {
      let foo = Object.create({z: 30}, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.entries(foo)).toEqual([['x', 10]]);
    });

    it('should convert to object primitive string', () => {
      expect(Object.entries('ab')).toEqual([['0', 'a'], ['1', 'b']]);
    });
  });

  describe('Object.values', () => {
    it('should have a length of 1', () => {
      expect(Object.values.length).toBe(1);
    });

    it('should check for type', () => {
      expect(Object.values.bind(null, null)).toThrow(TypeError(
        'Object.values called on non-object'
      ));
      expect(Object.values.bind(null, [])).not.toThrow();
      expect(Object.values.bind(null, () => {})).not.toThrow();
      expect(Object.values.bind(null, {})).not.toThrow();
    });

    it('should return enumerable values', () => {
      let foo = Object.defineProperties({}, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.values(foo)).toEqual([10]);

      let bar = {x: 10, y: 20};
      expect(Object.values(bar)).toEqual([10, 20]);
    });

    it('should work with proto-less objects', () => {
      let foo = Object.create(null, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.values(foo)).toEqual([10]);
    });

    it('should return only own values', () => {
      let foo = Object.create({z: 30}, {
        x: {value: 10, enumerable: true},
        y: {value: 20},
      });

      expect(Object.values(foo)).toEqual([10]);
    });

    it('should convert to object primitive string', () => {
      expect(Object.values('ab')).toEqual(['a', 'b']);
    });
  });
});