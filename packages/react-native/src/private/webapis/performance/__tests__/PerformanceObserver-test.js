/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type Performance from '../Performance';
import type {PerformanceEntryList} from '../PerformanceEntry';

jest.mock(
  '../specs/NativePerformance',
  () => require('../specs/__mocks__/NativePerformanceMock').default,
);

declare var performance: Performance;

describe('PerformanceObserver', () => {
  let PerformanceObserver;

  beforeEach(() => {
    jest.resetModules();

    const Performance = require('../Performance').default;
    // $FlowExpectedError[cannot-write]
    global.performance = new Performance();
    PerformanceObserver = require('../PerformanceObserver').PerformanceObserver;
  });

  it('prevents durationThreshold to be used together with entryTypes', async () => {
    const observer = new PerformanceObserver((list, _observer) => {});

    expect(() =>
      observer.observe({entryTypes: ['event', 'mark'], durationThreshold: 100}),
    ).toThrow();
  });

  it('ignores durationThreshold when used with marks or measures', async () => {
    let entries: PerformanceEntryList = [];

    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'measure', durationThreshold: 100});

    performance.measure('measure1', {
      start: 0,
      duration: 10,
    });

    await jest.runAllTicks();
    expect(entries).toHaveLength(1);
    expect(entries.map(e => e.name)).toStrictEqual(['measure1']);
  });
});
