/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');

describe('deepFreezeAndThrowOnMutationInDev', function() {

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

  it('should throw on mutation in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    var o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key = 'newValue'; }).toThrowError(
      'You attempted to set the key `key` with the value `"newValue"` ' +
      'on an object that is meant to be immutable and has been frozen.'
    );
    expect(o.key).toBe('oldValue');
  });

  it('should throw on mutation in dev without strict', () => {
    __DEV__ = true;
    var o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key = 'newValue'; }).toThrowError(
      'You attempted to set the key `key` with the value `"newValue"` ' +
      'on an object that is meant to be immutable and has been frozen.'
    );
    expect(o.key).toBe('oldValue');
  });

  it('should throw on nested mutation in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    var o = {key1: {key2: {key3: 'oldValue'}}};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key1.key2.key3 = 'newValue'; }).toThrowError(
      'You attempted to set the key `key3` with the value `"newValue"` ' +
      'on an object that is meant to be immutable and has been frozen.'
    );
    expect(o.key1.key2.key3).toBe('oldValue');
  });

  it('should throw on nested mutation in dev without strict', () => {
    __DEV__ = true;
    var o = {key1: {key2: {key3: 'oldValue'}}};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key1.key2.key3 = 'newValue'; }).toThrowError(
      'You attempted to set the key `key3` with the value `"newValue"` ' +
      'on an object that is meant to be immutable and has been frozen.'
    );
    expect(o.key1.key2.key3).toBe('oldValue');
  });

  it('should throw on insertion in dev with strict', () => {
    'use strict';
    __DEV__ = true;
    var o = {oldKey: 'value'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.newKey = 'value'; })
      .toThrowError(
        /(Cannot|Can't) add property newKey, object is not extensible/
      );
    expect(o.newKey).toBe(undefined);
  });

  it('should not throw on insertion in dev without strict', () => {
    __DEV__ = true;
    var o = {oldKey: 'value'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.newKey = 'value'; }).not.toThrow();
    expect(o.newKey).toBe(undefined);
  });

  it('should mutate and not throw on mutation in prod', () => {
    'use strict';
    __DEV__ = false;
    var o = {key: 'oldValue'};
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key = 'newValue'; }).not.toThrow();
    expect(o.key).toBe('newValue');
  });

  // This is a limitation of the technique unfortunately
  it('should not deep freeze already frozen objects', () => {
    'use strict';
    __DEV__ = true;
    var o = {key1: {key2: 'oldValue'}};
    Object.freeze(o);
    deepFreezeAndThrowOnMutationInDev(o);
    expect(() => { o.key1.key2 = 'newValue'; }).not.toThrow();
    expect(o.key1.key2).toBe('newValue');
  });

  it("shouldn't recurse infinitely", () => {
    __DEV__ = true;
    var o = {};
    o.circular = o;
    deepFreezeAndThrowOnMutationInDev(o);
  });

});
