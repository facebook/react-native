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
const PerformanceObserver = require('../PerformanceObserver').default;

jest.mock(
  '../NativePerformanceObserver',
  () => require('../__mocks__/NativePerformanceObserver').default,
);

describe('PerformanceObserver', () => {
  it('can be mocked by a reference NativePerformanceObserver implementation', async () => {
    expect(NativePerformanceObserver).not.toBe(undefined);

    let totalEntries = 0;
    const observer = new PerformanceObserver((list, _observer) => {
      expect(_observer).toBe(observer);
      const entries = list.getEntries();
      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry.name).toBe('mark1');
      expect(entry.entryType).toBe('mark');
      totalEntries += entries.length;
    });
    expect(() => observer.observe({entryTypes: ['mark']})).not.toThrow();

    NativePerformanceObserver.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    await jest.runAllTicks();
    expect(totalEntries).toBe(1);
    observer.disconnect();
  });

  it('prevents durationThreshold to be used together with entryTypes', async () => {
    const observer = new PerformanceObserver((list, _observer) => {});

    expect(() =>
      observer.observe({entryTypes: ['mark'], durationThreshold: 100}),
    ).toThrow();
  });

  it('handles durationThreshold argument as expected', async () => {
    let entries = [];
    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'mark', durationThreshold: 100});

    NativePerformanceObserver.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark3',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 100,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark4',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 500,
    });

    await jest.runAllTicks();
    expect(entries).toHaveLength(3);
    expect(entries.map(e => e.name)).toStrictEqual(['mark1', 'mark3', 'mark4']);
  });

  it('correctly works with multiple PerformanceObservers with durationThreshold', async () => {
    let entries1 = [];
    const observer1 = new PerformanceObserver((list, _observer) => {
      entries1 = [...entries1, ...list.getEntries()];
    });

    let entries2 = [];
    const observer2 = new PerformanceObserver((list, _observer) => {
      entries2 = [...entries2, ...list.getEntries()];
    });

    let entries3 = [];
    const observer3 = new PerformanceObserver((list, _observer) => {
      entries3 = [...entries3, ...list.getEntries()];
    });

    let entries4 = [];
    const observer4 = new PerformanceObserver((list, _observer) => {
      entries4 = [...entries4, ...list.getEntries()];
    });

    observer2.observe({type: 'mark', durationThreshold: 200});
    observer1.observe({type: 'mark', durationThreshold: 100});
    observer3.observe({type: 'mark', durationThreshold: 300});
    observer3.observe({type: 'measure', durationThreshold: 500});
    observer4.observe({entryTypes: ['mark', 'measure']});

    NativePerformanceObserver.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark3',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 100,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark4',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 500,
    });

    await jest.runAllTicks();
    observer1.disconnect();

    NativePerformanceObserver.logRawEntry({
      name: 'mark5',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserver.logRawEntry({
      name: 'mark6',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 300,
    });

    await jest.runAllTicks();
    observer3.disconnect();

    NativePerformanceObserver.logRawEntry({
      name: 'mark7',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    await jest.runAllTicks();
    observer4.disconnect();

    expect(entries1.map(e => e.name)).toStrictEqual([
      'mark1',
      'mark3',
      'mark4',
    ]);
    expect(entries2.map(e => e.name)).toStrictEqual([
      'mark1',
      'mark4',
      'mark5',
      'mark6',
      'mark7',
    ]);
    expect(entries3.map(e => e.name)).toStrictEqual(['mark4', 'mark6']);
    expect(entries4.map(e => e.name)).toStrictEqual([
      'mark1',
      'mark2',
      'mark3',
      'mark4',
      'mark5',
      'mark6',
      'mark7',
    ]);
  });
});
