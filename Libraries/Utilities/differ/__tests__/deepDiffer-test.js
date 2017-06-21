/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var deepDiffer = require('deepDiffer');

describe('deepDiffer', function() {
  it('should diff primitives of the same type', () => {
    expect(deepDiffer(1, 2)).toBe(true);
    expect(deepDiffer(42, 42)).toBe(false);
    expect(deepDiffer('foo', 'bar')).toBe(true);
    expect(deepDiffer('foo', 'foo')).toBe(false);
    expect(deepDiffer(true, false)).toBe(true);
    expect(deepDiffer(false, true)).toBe(true);
    expect(deepDiffer(true, true)).toBe(false);
    expect(deepDiffer(false, false)).toBe(false);
    expect(deepDiffer(null, null)).toBe(false);
    expect(deepDiffer(undefined, undefined)).toBe(false);
  });
  it('should diff primitives of different types', () => {
    expect(deepDiffer(1, '1')).toBe(true);
    expect(deepDiffer(true, 'true')).toBe(true);
    expect(deepDiffer(true, 1)).toBe(true);
    expect(deepDiffer(false, 0)).toBe(true);
    expect(deepDiffer(null, undefined)).toBe(true);
    expect(deepDiffer(null, 0)).toBe(true);
    expect(deepDiffer(null, false)).toBe(true);
    expect(deepDiffer(null, '')).toBe(true);
    expect(deepDiffer(undefined, 0)).toBe(true);
    expect(deepDiffer(undefined, false)).toBe(true);
    expect(deepDiffer(undefined, '')).toBe(true);
  });
  it('should diff Objects', () => {
    expect(deepDiffer({}, {})).toBe(false);
    expect(deepDiffer({}, null)).toBe(true);
    expect(deepDiffer(null, {})).toBe(true);
    expect(deepDiffer({a: 1}, {a: 1})).toBe(false);
    expect(deepDiffer({a: 1}, {a: 2})).toBe(true);
    expect(deepDiffer({a: 1}, {a: 1, b: null})).toBe(true);
    expect(deepDiffer({a: 1}, {a: 1, b: 1})).toBe(true);
    expect(deepDiffer({a: 1, b: 1}, {a: 1})).toBe(true);
    expect(deepDiffer({a: {A: 1}, b: 1}, {a: {A: 1}, b: 1})).toBe(false);
    expect(deepDiffer({a: {A: 1}, b: 1}, {a: {A: 2}, b: 1})).toBe(true);
    expect(deepDiffer(
      {a: {A: {aA: 1, bB: 1}}, b: 1},
      {a: {A: {aA: 1, bB: 1}}, b: 1}
    )).toBe(false);
    expect(deepDiffer(
      {a: {A: {aA: 1, bB: 1}}, b: 1},
      {a: {A: {aA: 1, cC: 1}}, b: 1}
    )).toBe(true);
  });
  it('should diff Arrays', () => {
    expect(deepDiffer([], [])).toBe(false);
    expect(deepDiffer([], null)).toBe(true);
    expect(deepDiffer(null, [])).toBe(true);
    expect(deepDiffer([42], [42])).toBe(false);
    expect(deepDiffer([1], [2])).toBe(true);
    expect(deepDiffer([1, 2, 3], [1, 2, 3])).toBe(false);
    expect(deepDiffer([1, 2, 3], [1, 2, 4])).toBe(true);
    expect(deepDiffer([1, 2, 3], [1, 4, 3])).toBe(true);
    expect(deepDiffer([1, 2, 3, 4], [1, 2, 3])).toBe(true);
    expect(deepDiffer([1, 2, 3], [1, 2, 3, 4])).toBe(true);
    expect(deepDiffer([0, null, false, ''], [0, null, false, ''])).toBe(false);
    expect(deepDiffer([0, null, false, ''], ['', false, null, 0])).toBe(true);
  });
  it('should diff mixed types', () => {
    expect(deepDiffer({}, [])).toBe(true);
    expect(deepDiffer([], {})).toBe(true);
    expect(deepDiffer(
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false]]},
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false]]}
    )).toBe(false);
    expect(deepDiffer(
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false]]},
      {a: [{A: {aA: 1, bB: 2}}, 'bar'], c: [1, [false]]}
    )).toBe(true);
    expect(deepDiffer(
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false]]},
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false], null]}
    )).toBe(true);
    expect(deepDiffer(
      {a: [{A: {aA: 1, bB: 1}}, 'bar'], c: [1, [false]]},
      {a: [{A: {aA: 1, bB: 1}}, ['bar']], c: [1, [false]]}
    )).toBe(true);
  });
  it('should distinguish between proper Array and Object', () => {
    expect(deepDiffer(['a', 'b'], {0: 'a', 1: 'b', length: 2})).toBe(true);
    expect(deepDiffer(['a', 'b'], {length: 2, 0: 'a', 1: 'b'})).toBe(true);
  });
  it('should diff same object', () => {
    var obj = [1,[2,3]];
    expect(deepDiffer(obj, obj)).toBe(false);
  });
});
