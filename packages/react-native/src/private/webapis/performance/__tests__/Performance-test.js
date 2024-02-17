/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const Performance = require('../Performance').default;

jest.mock(
  '../NativePerformance',
  () => require('../__mocks__/NativePerformance').default,
);

jest.mock(
  '../NativePerformanceObserver',
  () => require('../__mocks__/NativePerformanceObserver').default,
);

describe('Performance', () => {
  it('clearEntries removes correct entry types', async () => {
    const performance = new Performance();
    performance.mark('entry1', 0, 0);
    performance.mark('mark2', 0, 0);

    performance.measure('entry1', {start: 0, duration: 0});
    performance.measure('measure2', {start: 0, duration: 0});

    performance.clearMarks();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([
      'entry1',
      'measure2',
    ]);

    performance.mark('entry2', 0, 0);
    performance.mark('mark3', 0, 0);

    performance.clearMeasures();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([
      'entry2',
      'mark3',
    ]);

    performance.clearMarks();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([]);
  });

  it('getEntries only works with allowed entry types', async () => {
    const performance = new Performance();
    performance.clearMarks();
    performance.clearMeasures();

    performance.mark('entry1', 0, 0);
    performance.mark('mark2', 0, 0);

    jest.spyOn(console, 'warn').mockImplementation();

    performance.getEntriesByType('mark');
    expect(console.warn).not.toHaveBeenCalled();

    performance.getEntriesByType('measure');
    expect(console.warn).not.toHaveBeenCalled();

    performance.getEntriesByName('entry1');
    expect(console.warn).not.toHaveBeenCalled();

    performance.getEntriesByName('entry1', 'event');
    expect(console.warn).toHaveBeenCalled();

    performance.getEntriesByName('entry1', 'mark');
    expect(console.warn).toHaveBeenCalled();

    performance.getEntriesByType('event');
    expect(console.warn).toHaveBeenCalled();
  });

  it('getEntries works with marks and measures', async () => {
    const performance = new Performance();
    performance.clearMarks();
    performance.clearMeasures();

    performance.mark('entry1', 0, 0);
    performance.mark('mark2', 0, 0);

    performance.measure('entry1', {start: 0, duration: 0});
    performance.measure('measure2', {start: 0, duration: 0});

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([
      'entry1',
      'mark2',
      'entry1',
      'measure2',
    ]);

    expect(performance.getEntriesByType('mark').map(e => e.name)).toStrictEqual(
      ['entry1', 'mark2'],
    );

    expect(
      performance.getEntriesByType('measure').map(e => e.name),
    ).toStrictEqual(['entry1', 'measure2']);

    expect(
      performance.getEntriesByName('entry1').map(e => e.entryType),
    ).toStrictEqual(['mark', 'measure']);

    expect(
      performance.getEntriesByName('entry1', 'measure').map(e => e.entryType),
    ).toStrictEqual(['measure']);
  });
});
