/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.unmock('VirtualizeUtils');

const { elementsThatOverlapOffsets, newRangeCount } = require('VirtualizeUtils');

describe('newRangeCount', function() {
  it('handles subset', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 2, last: 3})).toBe(0);
  });
  it('handles forward disjoint set', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 6, last: 9})).toBe(4);
  });
  it('handles reverse disjoint set', function() {
    expect(newRangeCount({first: 6, last: 8}, {first: 1, last: 4})).toBe(4);
  });
  it('handles superset', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 0, last: 5})).toBe(2);
  });
  it('handles end extension', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 1, last: 8})).toBe(4);
  });
  it('handles front extension', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 0, last: 4})).toBe(1);
  });
  it('handles forward insersect', function() {
    expect(newRangeCount({first: 1, last: 4}, {first: 3, last: 6})).toBe(2);
  });
  it('handles reverse intersect', function() {
    expect(newRangeCount({first: 3, last: 6}, {first: 1, last: 4})).toBe(2);
  });
});

describe('elementsThatOverlapOffsets', function() {
  it('handles fixed length', function() {
    const offsets = [0, 250, 350, 450];
    function getFrameMetrics(index: number) {
      return {
        length: 100,
        offset: (100 * index),
      };
    }
    expect(elementsThatOverlapOffsets(offsets, 100, getFrameMetrics)).toEqual([0, 2, 3, 4]);
  });
  it('handles variable length', function() {
    const offsets = [150, 250, 900];
    const frames = [
      {offset: 0, length: 50},
      {offset: 50, length: 200},
      {offset: 250, length: 600},
      {offset: 850, length: 100},
      {offset: 950, length: 150},
    ];
    expect(elementsThatOverlapOffsets(offsets, frames.length, (ii) => frames[ii])).toEqual([1,1,3]);
  });
  it('handles out of bounds', function() {
    const offsets = [150, 900];
    const frames = [
      {offset: 0, length: 50},
      {offset: 50, length: 150},
      {offset: 250, length: 100},
    ];
    expect(elementsThatOverlapOffsets(offsets, frames.length, (ii) => frames[ii])).toEqual([1]);
  });
});
