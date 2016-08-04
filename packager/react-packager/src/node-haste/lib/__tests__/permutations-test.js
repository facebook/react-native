/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
jest.dontMock('../permutations');
const permutate = require('../permutations');

const expected = [
  ['a', 'b', 'c'],
  ['a', 'c', 'b'],
  ['b', 'a', 'c'],
  ['b', 'c', 'a'],
  ['c', 'a', 'b'],
  ['c', 'b', 'a'],
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'a'],
  ['b', 'c'],
  ['c', 'a'],
  ['c', 'b'],
  ['a'],
  ['b'],
  ['c']
];

describe('permutations', () => {
  it('should preserve the incoming order', () => {
    console.log(JSON.stringify(permutate(['a', 'b', 'c']), null, ''));
    console.log(JSON.stringify(expected, null, ''));
   expect(permutate(['a', 'b', 'c']))
      .toEqual(expected)
  });
});
