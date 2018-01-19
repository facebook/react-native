/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

const FillRateHelper = require('FillRateHelper');

let rowFramesGlobal;
const dataGlobal = [
  {key: 'header'},
  {key: 'a'},
  {key: 'b'},
  {key: 'c'},
  {key: 'd'},
  {key: 'footer'},
];
function getFrameMetrics(index: number) {
  const frame = rowFramesGlobal[dataGlobal[index].key];
  return {length: frame.height, offset: frame.y, inLayout: frame.inLayout};
}

function computeResult({helper, props, state, scroll}): number {
  helper.activate();
  return helper.computeBlankness(
    {
      data: dataGlobal,
      getItemCount: data2 => data2.length,
      initialNumToRender: 10,
      ...(props || {}),
    },
    {first: 1, last: 2, ...(state || {})},
    {offset: 0, visibleLength: 100, ...(scroll || {})},
  );
}

describe('computeBlankness', function() {
  beforeEach(() => {
    FillRateHelper.setSampleRate(1);
    FillRateHelper.setMinSampleCount(0);
  });

  it('computes correct blankness of viewport', function() {
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      header: {y: 0, height: 0, inLayout: true},
      a: {y: 0, height: 50, inLayout: true},
      b: {y: 50, height: 50, inLayout: true},
    };
    let blankness = computeResult({helper});
    expect(blankness).toBe(0);
    blankness = computeResult({helper, state: {last: 1}});
    expect(blankness).toBe(0.5);
    blankness = computeResult({helper, scroll: {offset: 25}});
    expect(blankness).toBe(0.25);
    blankness = computeResult({helper, scroll: {visibleLength: 400}});
    expect(blankness).toBe(0.75);
    blankness = computeResult({helper, scroll: {offset: 100}});
    expect(blankness).toBe(1);
  });

  it('skips frames that are not in layout', function() {
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      header: {y: 0, height: 0, inLayout: false},
      a: {y: 0, height: 10, inLayout: false},
      b: {y: 10, height: 30, inLayout: true},
      c: {y: 40, height: 40, inLayout: true},
      d: {y: 80, height: 20, inLayout: false},
      footer: {y: 100, height: 0, inLayout: false},
    };
    const blankness = computeResult({helper, state: {last: 4}});
    expect(blankness).toBe(0.3);
  });

  it('sampling rate can disable', function() {
    let helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      header: {y: 0, height: 0, inLayout: true},
      a: {y: 0, height: 40, inLayout: true},
      b: {y: 40, height: 40, inLayout: true},
    };
    let blankness = computeResult({helper});
    expect(blankness).toBe(0.2);

    FillRateHelper.setSampleRate(0);

    helper = new FillRateHelper(getFrameMetrics);
    blankness = computeResult({helper});
    expect(blankness).toBe(0);
  });

  it('can handle multiple listeners and unsubscribe', function() {
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const subscriptions = listeners.map(listener =>
      FillRateHelper.addListener(listener),
    );
    subscriptions[1].remove();
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      header: {y: 0, height: 0, inLayout: true},
      a: {y: 0, height: 40, inLayout: true},
      b: {y: 40, height: 40, inLayout: true},
    };
    const blankness = computeResult({helper});
    expect(blankness).toBe(0.2);
    helper.deactivateAndFlush();
    const info0 = listeners[0].mock.calls[0][0];
    expect(info0.pixels_blank / info0.pixels_sampled).toBe(blankness);
    expect(listeners[1]).not.toBeCalled();
    const info1 = listeners[2].mock.calls[0][0];
    expect(info1.pixels_blank / info1.pixels_sampled).toBe(blankness);
  });
});
