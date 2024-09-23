/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

jest.mock(
  '../specs/NativePerformance',
  () => require('../specs/__mocks__/NativePerformance').default,
);

jest.mock(
  '../specs/NativePerformanceObserver',
  () => require('../specs/__mocks__/NativePerformanceObserver').default,
);

// NOTE: Jest mocks of transitive dependencies don't appear to work with
// ES6 module imports, therefore forced to use commonjs style imports here.
const Performance = require('../Performance').default;
const NativePerformanceMock =
  require('../specs/__mocks__/NativePerformance').default;

describe('EventCounts', () => {
  it('defines EventCounts for Performance', () => {
    const eventCounts = new Performance().eventCounts;
    expect(eventCounts).not.toBeUndefined();
  });

  it('consistently implements the API for EventCounts', async () => {
    let interactionId = 0;
    const eventDefaultValues = [
      0, // startTime
      100, // duration
      0, // processing start
      100, // processingEnd
    ];

    NativePerformanceMock?.testOnly_logEvent('click', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('input', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('input', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);

    const eventCounts = new Performance().eventCounts;
    expect(eventCounts.size).toBe(3);
    expect(Array.from(eventCounts.entries())).toStrictEqual([
      ['click', 1],
      ['input', 2],
      ['keyup', 3],
    ]);

    expect(eventCounts.get('click')).toEqual(1);
    expect(eventCounts.get('input')).toEqual(2);
    expect(eventCounts.get('keyup')).toEqual(3);

    expect(eventCounts.has('click')).toEqual(true);
    expect(eventCounts.has('input')).toEqual(true);
    expect(eventCounts.has('keyup')).toEqual(true);

    expect(Array.from(eventCounts.keys())).toStrictEqual([
      'click',
      'input',
      'keyup',
    ]);
    expect(Array.from(eventCounts.values())).toStrictEqual([1, 2, 3]);

    await jest.runAllTicks();
    NativePerformanceMock?.testOnly_logEvent('input', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);
    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);
    expect(Array.from(eventCounts.values())).toStrictEqual([1, 3, 5]);

    await jest.runAllTicks();
    NativePerformanceMock?.testOnly_logEvent('click', ...eventDefaultValues, interactionId++);

    await jest.runAllTicks();

    NativePerformanceMock?.testOnly_logEvent('keyup', ...eventDefaultValues, interactionId++);

    expect(Array.from(eventCounts.values())).toStrictEqual([2, 3, 6]);
  });
});
