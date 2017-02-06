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

jest.unmock('ViewabilityHelper');
const ViewabilityHelper = require('ViewabilityHelper');

let rowFrames;
let data;
function getFrameMetrics(index: number) {
  const frame = rowFrames[data[index].key];
  return {length: frame.height, offset: frame.y};
}

describe('computeViewableItems', function() {
  it('returns all 4 entirely visible rows as viewable', function() {
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 50},
      c: {y: 100, height: 50},
      d: {y: 150, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(ViewabilityHelper.computeViewableItems(50, data.length, 0, 200, getFrameMetrics))
      .toEqual([0, 1, 2, 3]);
  });

  it(
    'returns top 2 rows as viewable (1. entirely visible and 2. majority)',
    function() {
      rowFrames = {
        a: {y: 0, height: 50},
        b: {y: 50, height: 150},
        c: {y: 200, height: 50},
        d: {y: 250, height: 50},
      };
      data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
      expect(ViewabilityHelper.computeViewableItems(50, data.length, 0, 200, getFrameMetrics))
        .toEqual([0, 1]);
  });

  it(
    'returns only 2nd row as viewable (majority)',
    function() {
      rowFrames = {
        a: {y: 0, height: 50},
        b: {y: 50, height: 150},
        c: {y: 200, height: 50},
        d: {y: 250, height: 50},
      };
      data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
      expect(ViewabilityHelper.computeViewableItems(50, data.length, 25, 200, getFrameMetrics))
        .toEqual([1]);
  });

  it(
    'handles empty input',
    function() {
      rowFrames = {};
      data = [];
      expect(ViewabilityHelper.computeViewableItems(50, data.length, 0, 200, getFrameMetrics))
        .toEqual([]);
  });
});
