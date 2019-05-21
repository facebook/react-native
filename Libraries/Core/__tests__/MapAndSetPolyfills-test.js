/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

// Save these methods so that we can restore them afterward.
const {freeze, seal, preventExtensions} = Object;

function setup() {
  jest.setMock('../../vendor/core/_shouldPolyfillES6Collection', () => true);
}

function cleanup() {
  Object.assign(Object, {freeze, seal, preventExtensions});
}

describe('Map polyfill', () => {
  setup();

  const Map = require('../../vendor/core/Map');

  it('is not native', () => {
    const getCode = Function.prototype.toString.call(Map.prototype.get);
    expect(getCode).not.toContain('[native code]');
    expect(getCode).toContain('getIndex');
  });

  it('should tolerate non-extensible object keys', () => {
    const map = new Map();
    const key = Object.create(null);
    Object.freeze(key);
    map.set(key, key);
    expect(map.size).toBe(1);
    expect(map.has(key)).toBe(true);
    map.delete(key);
    expect(map.size).toBe(0);
    expect(map.has(key)).toBe(false);
  });

  it('should not get confused by prototypal inheritance', () => {
    const map = new Map();
    const proto = Object.create(null);
    const base = Object.create(proto);
    map.set(proto, proto);
    expect(map.size).toBe(1);
    expect(map.has(proto)).toBe(true);
    expect(map.has(base)).toBe(false);
    map.set(base, base);
    expect(map.size).toBe(2);
    expect(map.get(proto)).toBe(proto);
    expect(map.get(base)).toBe(base);
  });

  afterAll(cleanup);
});

describe('Set polyfill', () => {
  setup();

  const Set = require('../../vendor/core/Set');

  it('is not native', () => {
    const addCode = Function.prototype.toString.call(Set.prototype.add);
    expect(addCode).not.toContain('[native code]');
  });

  it('should tolerate non-extensible object elements', () => {
    const set = new Set();
    const elem = Object.create(null);
    Object.freeze(elem);
    set.add(elem);
    expect(set.size).toBe(1);
    expect(set.has(elem)).toBe(true);
    set.add(elem);
    expect(set.size).toBe(1);
    set.delete(elem);
    expect(set.size).toBe(0);
    expect(set.has(elem)).toBe(false);
  });

  it('should not get confused by prototypal inheritance', () => {
    const set = new Set();
    const proto = Object.create(null);
    const base = Object.create(proto);
    set.add(proto);
    expect(set.size).toBe(1);
    expect(set.has(proto)).toBe(true);
    expect(set.has(base)).toBe(false);
    set.add(base);
    expect(set.size).toBe(2);
    expect(set.has(proto)).toBe(true);
    expect(set.has(base)).toBe(true);
  });

  afterAll(cleanup);
});
