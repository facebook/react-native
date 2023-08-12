/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

// NOTE: Jest mocks of transitive dependencies don't appear to work with
// ES6 module imports, therefore forced to use commonjs style imports here.
const NativePerformanceObserver = require('../NativePerformanceObserver');
const Performance = require('../Performance').default;

jest.mock(
  '../NativePerformanceObserver',
  () => require('../__mocks__/NativePerformanceObserver').default,
);

describe('EventCounts', () => {
  it('defines EventCounts for Performance', () => {
    const eventCounts = new Performance().eventCounts;
    expect(eventCounts).not.toBeUndefined();
  });

  it('consistently implements the API for EventCounts', async () => {
    NativePerformanceObserver.logRawEntry({
      name: 'click',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'input',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'input',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

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
    NativePerformanceObserver.logRawEntry({
      name: 'input',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });
    expect(Array.from(eventCounts.values())).toStrictEqual([1, 3, 5]);

    await jest.runAllTicks();

    NativePerformanceObserver.logRawEntry({
      name: 'click',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    await jest.runAllTicks();

    NativePerformanceObserver.logRawEntry({
      name: 'keyup',
      entryType: RawPerformanceEntryTypeValues.EVENT,
    });

    expect(Array.from(eventCounts.values())).toStrictEqual([2, 3, 6]);
  });
});
