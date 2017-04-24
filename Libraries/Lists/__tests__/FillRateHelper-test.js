/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.unmock('FillRateHelper');

const FillRateHelper = require('FillRateHelper');

let rowFramesGlobal;
const dataGlobal = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
function getFrameMetrics(index: number) {
  const frame = rowFramesGlobal[dataGlobal[index].key];
  return {length: frame.height, offset: frame.y, inLayout: frame.inLayout};
}

function computeResult({helper, props, state, scroll}) {
  return helper.computeInfoSampled(
    'test',
    {
      data: dataGlobal,
      fillRateTrackingSampleRate: 1,
      getItemCount: (data2) => data2.length,
      initialNumToRender: 10,
      ...(props || {}),
    },
    {first: 0, last: 1, ...(state || {})},
    {offset: 0, visibleLength: 100, ...(scroll || {})},
  );
}

describe('computeInfoSampled', function() {
  beforeEach(() => {
    FillRateHelper.setSampleRate(1);
  });

  it('computes correct blankness of viewport', function() {
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      a: {y: 0, height: 50, inLayout: true},
      b: {y: 50, height: 50, inLayout: true},
    };
    let result = computeResult({helper});
    expect(result).toBeNull();
    result = computeResult({helper, state: {last: 0}});
    expect(result.event.blankness).toBe(0.5);
    result = computeResult({helper, scroll: {offset: 25}});
    expect(result.event.blankness).toBe(0.25);
    result = computeResult({helper, scroll: {visibleLength: 400}});
    expect(result.event.blankness).toBe(0.75);
    result = computeResult({helper, scroll: {offset: 100}});
    expect(result.event.blankness).toBe(1);
    expect(result.aggregate.avg_blankness).toBe(0.5);
  });

  it('skips frames that are not in layout', function() {
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      a: {y: 0, height: 10, inLayout: false},
      b: {y: 10, height: 30, inLayout: true},
      c: {y: 40, height: 40, inLayout: true},
      d: {y: 80, height: 20, inLayout: false},
    };
    const result = computeResult({helper, state: {last: 3}});
    expect(result.event.blankness).toBe(0.3);
  });

  it('sampling rate can disable', function() {
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      a: {y: 0, height: 40, inLayout: true},
      b: {y: 40, height: 40, inLayout: true},
    };
    let result = computeResult({helper});
    expect(result.event.blankness).toBe(0.2);

    FillRateHelper.setSampleRate(0);

    result = computeResult({helper});
    expect(result).toBeNull();
  });

  it('can handle multiple listeners and unsubscribe', function() {
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const subscriptions = listeners.map(
      (listener) => FillRateHelper.addFillRateExceededListener(listener)
    );
    subscriptions[1].remove();
    const helper = new FillRateHelper(getFrameMetrics);
    rowFramesGlobal = {
      a: {y: 0, height: 40, inLayout: true},
      b: {y: 40, height: 40, inLayout: true},
    };
    const result = computeResult({helper});
    expect(result.event.blankness).toBe(0.2);
    expect(listeners[0]).toBeCalledWith(result);
    expect(listeners[1]).not.toBeCalled();
    expect(listeners[2]).toBeCalledWith(result);
  });
});
