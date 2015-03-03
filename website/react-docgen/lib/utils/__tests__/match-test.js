/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

describe('match', function() {
  var match;

  beforeEach(function() {
    match = require('../match');
  });

  it('matches with exact properties', function() {
    expect(match({foo: {bar: 42}}, {foo: {bar: 42}})).toBe(true);
  });

  it('matches a subset of properties in the target', function() {
    expect(match({foo: {bar: 42, baz: "xyz"}}, {foo: {bar: 42}})).toBe(true);
  });

  it('does not match if properties are different/missing', function() {
    expect(match(
      {foo: {bar: 42, baz: "xyz"}},
      {foo: {bar: 21, baz: "xyz"}}
    )).toBe(false);

    expect(match(
      {foo: {baz: "xyz"}},
      {foo: {bar: 21, baz: "xyz"}}
    )).toBe(false);
  });
});
