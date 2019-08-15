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

describe('mergeIntoFast', () => {
  const mergeIntoFast = require('../mergeIntoFast');

  it('should merge two objects', () => {
    const a = {fontScale: 2, height: 1334};
    const b = {scale: 2, width: 750};

    mergeIntoFast(a, b);

    expect(a).toEqual({fontScale: 2, height: 1334, scale: 2, width: 750});
  });

  it('should use the values of the second object if there are duplicate keys', () => {
    const a = {fontScale: 2};
    const b = {fontScale: 3};

    mergeIntoFast(a, b);

    expect(a).toEqual({fontScale: 3});
  });

  it('should merge into an empty object', () => {
    const a = {};
    const b = {scale: 2, width: 750};

    mergeIntoFast(a, b);

    expect(a).toEqual({scale: 2, width: 750});
  });

  it('should merge from an empty object', () => {
    const a = {scale: 2, width: 750};
    const b = {};

    mergeIntoFast(a, b);

    expect(a).toEqual({scale: 2, width: 750});
  });
});
