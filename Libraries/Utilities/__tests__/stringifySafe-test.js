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

describe('stringifySafe', () => {
  const stringifySafe = require('stringifySafe');

  it('stringifySafe stringifies undefined values', () => {
    const arg = undefined;
    const result = stringifySafe(arg);
    expect(result).toEqual('undefined');
  });

  it('stringifySafe stringifies null values', () => {
    const arg = null;
    const result = stringifySafe(arg);
    expect(result).toEqual('null');
  });

  it('stringifySafe stringifies string values', () => {
    const arg = 'abc';
    const result = stringifySafe(arg);
    expect(result).toEqual('"abc"');
  });

  it('stringifySafe stringifies function values', () => {
    const arg = function() {};
    const result = stringifySafe(arg);
    expect(result).toEqual('function arg() {}');
  });

  it('stringifySafe stringifies non-circular objects', () => {
    const arg = {a: 1};
    const result = stringifySafe(arg);
    expect(result).toEqual('{"a":1}');
  });

  it('stringifySafe stringifies circular objects with toString', () => {
    const arg = {};
    arg.arg = arg;
    const result = stringifySafe(arg);
    expect(result).toEqual('[object Object]');
  });

  it('stringifySafe stringifies circular objects without toString', () => {
    const arg = {};
    arg.arg = arg;
    arg.toString = undefined;
    const result = stringifySafe(arg);
    expect(result).toEqual('["object" failed to stringify]');
  });
});
