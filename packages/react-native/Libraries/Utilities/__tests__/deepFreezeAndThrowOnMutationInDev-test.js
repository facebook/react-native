/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const deepFreezeAndThrowOnMutationInDev = require('../deepFreezeAndThrowOnMutationInDev');

describe('deepFreezeAndThrowOnMutationInDev', function () {
  it('should be a noop on non object values', () => {
    __DEV__ = true;
    expect(() => deepFreezeAndThrowOnMutationInDev('')).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(null)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(false)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(5)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev()).not.toThrow();
    __DEV__ = false;
    expect(() => deepFreezeAndThrowOnMutationInDev('')).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(null)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(false)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev(5)).not.toThrow();
    expect(() => deepFreezeAndThrowOnMutationInDev()).not.toThrow();
  });

  it('should not throw on object without prototype', () => {
    __DEV__ = true;
    const o = Object.create(null);
    o.key = 'Value';
    expect(() => deepFreezeAndThrowOnMutationInDev(o)).not.toThrow();
  });

  it('should throw on mutation in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    const o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key = 'newValue';
    }).toThrowError(
      'You attempted to set the key `key` with the value `"newValue"` ' +
        'on an object that is meant to be immutable and has been frozen.',
    );
    expect(o.key).toBe('oldValue');
  });

  it('should throw on mutation in dev without strict', () => {
    __DEV__ = true;
    const o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key = 'newValue';
    }).toThrowError(
      'You attempted to set the key `key` with the value `"newValue"` ' +
        'on an object that is meant to be immutable and has been frozen.',
    );
    expect(o.key).toBe('oldValue');
  });

  it('should throw on nested mutation in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    const o = {key1: {key2: {key3: 'oldValue'}}};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key1.key2.key3 = 'newValue';
    }).toThrowError(
      'You attempted to set the key `key3` with the value `"newValue"` ' +
        'on an object that is meant to be immutable and has been frozen.',
    );
    expect(o.key1.key2.key3).toBe('oldValue');
  });

  it('should throw on nested mutation in dev without strict', () => {
    __DEV__ = true;
    const o = {key1: {key2: {key3: 'oldValue'}}};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key1.key2.key3 = 'newValue';
    }).toThrowError(
      'You attempted to set the key `key3` with the value `"newValue"` ' +
        'on an object that is meant to be immutable and has been frozen.',
    );
    expect(o.key1.key2.key3).toBe('oldValue');
  });

  it('should throw on insertion in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    const o = {oldKey: 'value'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.newKey = 'value';
    }).toThrowError(
      /(Cannot|Can't) add property newKey, object is not extensible/,
    );
    expect(o.newKey).toBe(undefined);
  });

  it('should not throw on insertion in dev without strict', () => {
    __DEV__ = true;
    const o = {oldKey: 'value'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.newKey = 'value';
    }).not.toThrow();
    expect(o.newKey).toBe(undefined);
  });

  it('should mutate and not throw on mutation in prod', () => {
    'use strict';
    __DEV__ = false;
    const o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key = 'newValue';
    }).not.toThrow();
    expect(o.key).toBe('newValue');
  });

  // This is a limitation of the technique unfortunately
  it('should not deep freeze already frozen objects', () => {
    'use strict';
    __DEV__ = true;
    const o = {key1: {key2: 'oldValue'}};
    Object.freeze(o);
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => {
      o.key1.key2 = 'newValue';
    }).not.toThrow();
    expect(o.key1.key2).toBe('newValue');
  });

  it("shouldn't recurse infinitely", () => {
    __DEV__ = true;
    const o = {};
    o.circular = o;
    deepFreezeAndThrowOnMutationInDev(o);
  });
});
