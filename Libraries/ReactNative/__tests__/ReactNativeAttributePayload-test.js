/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest.dontMock('ReactNativeAttributePayload');
jest.dontMock('deepDiffer');
jest.dontMock('styleDiffer');
jest.dontMock('precomputeStyle');
jest.dontMock('flattenStyle');
var ReactNativeAttributePayload = require('ReactNativeAttributePayload');

var diff = ReactNativeAttributePayload.diff;

describe('ReactNativeAttributePayload', function() {

  it('should work with simple example', () => {
    expect(diff(
      {a: 1, c: 3},
      {b: 2, c: 3},
      {a: true, b: true}
    )).toEqual({a: null, b: 2});
  });

  it('should skip fields that are equal', () => {
    expect(diff(
      {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
      {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
      {a: true, b: true, c: true, d: true, e: true, f: true}
    )).toEqual(null);
  });

  it('should remove fields', () => {
    expect(diff(
      {a: 1},
      {},
      {a: true}
    )).toEqual({a: null});
  });

  it('should remove fields that are set to undefined', () => {
    expect(diff(
      {a: 1},
      {a: undefined},
      {a: true}
    )).toEqual({a: null});
  });

  it('should ignore invalid fields', () => {
    expect(diff(
      {a: 1},
      {b: 2},
      {}
    )).toEqual(null);
  });

  it('should use the diff attribute', () => {
    var diffA = jest.genMockFunction().mockImpl((a, b) => true);
    var diffB = jest.genMockFunction().mockImpl((a, b) => false);
    expect(diff(
      {a: [1], b: [3]},
      {a: [2], b: [4]},
      {a: {diff: diffA}, b: {diff: diffB}}
    )).toEqual({a: [2]});
    expect(diffA).toBeCalledWith([1], [2]);
    expect(diffB).toBeCalledWith([3], [4]);
  });

  it('should not use the diff attribute on addition/removal', () => {
    var diffA = jest.genMockFunction();
    var diffB = jest.genMockFunction();
    expect(diff(
      {a: [1]},
      {b: [2]},
      {a: {diff: diffA}, b: {diff: diffB}}
    )).toEqual({a: null, b: [2]});
    expect(diffA).not.toBeCalled();
    expect(diffB).not.toBeCalled();
  });

  it('should do deep diffs of Objects by default', () => {
    expect(diff(
      {a: [1], b: {k: [3,4]}, c: {k: [4,4]} },
      {a: [2], b: {k: [3,4]}, c: {k: [4,5]} },
      {a: true, b: true, c: true}
    )).toEqual({a: [2], c: {k: [4,5]}});
  });

  it('should work with undefined styles', () => {
    expect(diff(
      { style: { a: '#ffffff', b: 1 } },
      { style: undefined },
      { style: { b: true } }
    )).toEqual({ b: null });
    expect(diff(
      { style: undefined },
      { style: { a: '#ffffff', b: 1 } },
      { style: { b: true } }
    )).toEqual({ b: 1 });
    expect(diff(
      { style: undefined },
      { style: undefined },
      { style: { b: true } }
    )).toEqual(null);
  });

  it('should work with empty styles', () => {
    expect(diff(
      {a: 1, c: 3},
      {},
      {a: true, b: true}
    )).toEqual({a: null});
    expect(diff(
      {},
      {a: 1, c: 3},
      {a: true, b: true}
    )).toEqual({a: 1});
    expect(diff(
      {},
      {},
      {a: true, b: true}
    )).toEqual(null);
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    // Note that if the property changes from one function to another, we don't
    // need to send an update.
    expect(diff(
      {a: function() { return 1; }, b: function() { return 2; }, c: 3},
      {b: function() { return 9; }, c: function() { return 3; }, },
      {a: true, b: true, c: true}
    )).toEqual({a: null, c: true});
  });

 });
