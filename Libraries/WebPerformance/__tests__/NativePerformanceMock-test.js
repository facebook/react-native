/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const NativePerformanceMock = require('../__mocks__/NativePerformance').default;
const PerformanceObserver = require('../PerformanceObserver').default;

describe('NativePerformanceMock', () => {
  jest.mock(
    '../NativePerformanceObserver',
    () => require('../__mocks__/NativePerformanceObserver').default,
  );

  it('marks get reported', async () => {
    let entries = [];
    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'mark'});

    NativePerformanceMock.mark('mark1', 0, 10);
    NativePerformanceMock.mark('mark2', 5, 10);
    NativePerformanceMock.mark('mark3', 10, 20);

    await jest.runAllTicks();
    expect(entries).toHaveLength(3);
    expect(entries.map(e => e.name)).toStrictEqual(['mark1', 'mark2', 'mark3']);
    expect(entries.map(e => e.startTime)).toStrictEqual([0, 5, 10]);
  });

  it('measures get reported', async () => {
    let entries = [];
    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({entryTypes: ['measure']});

    NativePerformanceMock.mark('mark0', 0.0, 1.0);
    NativePerformanceMock.mark('mark1', 1.0, 3.0);
    NativePerformanceMock.mark('mark2', 2.0, 4.0);

    NativePerformanceMock.measure('measure0', 0, 2);
    NativePerformanceMock.measure('measure1', 0, 2, 4);
    NativePerformanceMock.measure(
      'measure2',
      0,
      0,
      undefined,
      'mark1',
      'mark2',
    );
    NativePerformanceMock.measure('measure3', 0, 0, 5, 'mark1');
    NativePerformanceMock.measure(
      'measure4',
      1.5,
      0,
      undefined,
      undefined,
      'mark2',
    );

    await jest.runAllTicks();
    expect(entries).toHaveLength(5);
    expect(entries.map(e => e.name)).toStrictEqual([
      'measure0',
      'measure1',
      'measure2',
      'measure3',
      'measure4',
    ]);
    expect(entries.map(e => e.startTime)).toStrictEqual([0, 0, 1, 1, 1.5]);
    expect(entries.map(e => e.duration)).toStrictEqual([2, 4, 1, 5, 0.5]);
  });
});
