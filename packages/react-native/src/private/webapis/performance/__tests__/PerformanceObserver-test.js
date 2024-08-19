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

import type {PerformanceEntryList} from '../PerformanceObserver';

import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

// NOTE: Jest mocks of transitive dependencies don't appear to work with
// ES6 module imports, therefore forced to use commonjs style imports here.
const {PerformanceObserver} = require('../PerformanceObserver');
const NativePerformanceObserverMock =
  require('../specs/__mocks__/NativePerformanceObserver').default;
const NativePerformanceObserver = require('../specs/NativePerformanceObserver');

jest.mock(
  '../specs/NativePerformanceObserver',
  () => require('../specs/__mocks__/NativePerformanceObserver').default,
);

describe('PerformanceObserver', () => {
  it('can be mocked by a reference NativePerformanceObserver implementation', async () => {
    expect(NativePerformanceObserver).not.toBe(undefined);

    let totalEntries = 0;
    const observer: PerformanceObserver = new PerformanceObserver(
      (list, _observer) => {
        expect(_observer).toBe(observer);
        const entries = list.getEntries();
        expect(entries).toHaveLength(1);
        const entry = entries[0];
        expect(entry.name).toBe('mark1');
        expect(entry.entryType).toBe('mark');
        totalEntries += entries.length;
      },
    );
    expect(() => observer.observe({entryTypes: ['mark']})).not.toThrow();

    NativePerformanceObserverMock.logRawEntry({
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
      // $FlowExpectedError[incompatible-call]
      observer.observe({entryTypes: ['event', 'mark'], durationThreshold: 100}),
    ).toThrow();
  });

  it('ignores durationThreshold when used with marks or measures', async () => {
    let entries: PerformanceEntryList = [];

    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'measure', durationThreshold: 100});

    NativePerformanceObserverMock.logRawEntry({
      name: 'measure1',
      entryType: RawPerformanceEntryTypeValues.MEASURE,
      startTime: 0,
      duration: 200,
    });

    await jest.runAllTicks();
    expect(entries).toHaveLength(1);
    expect(entries.map(e => e.name)).toStrictEqual(['measure1']);
  });

  it('handles durationThreshold argument as expected', async () => {
    let entries: PerformanceEntryList = [];
    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'event', durationThreshold: 100});

    NativePerformanceObserverMock.logRawEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event2',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event3',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 100,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event4',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 500,
    });

    await jest.runAllTicks();
    expect(entries).toHaveLength(3);
    expect(entries.map(e => e.name)).toStrictEqual([
      'event1',
      'event3',
      'event4',
    ]);
  });

  it('correctly works with multiple PerformanceObservers with durationThreshold', async () => {
    let entries1: PerformanceEntryList = [];
    const observer1 = new PerformanceObserver((list, _observer) => {
      entries1 = [...entries1, ...list.getEntries()];
    });

    let entries2: PerformanceEntryList = [];
    const observer2 = new PerformanceObserver((list, _observer) => {
      entries2 = [...entries2, ...list.getEntries()];
    });

    let entries3: PerformanceEntryList = [];
    const observer3 = new PerformanceObserver((list, _observer) => {
      entries3 = [...entries3, ...list.getEntries()];
    });

    let entries4: PerformanceEntryList = [];
    const observer4 = new PerformanceObserver((list, _observer) => {
      entries4 = [...entries4, ...list.getEntries()];
    });

    observer2.observe({type: 'event', durationThreshold: 200});
    observer1.observe({type: 'event', durationThreshold: 100});
    observer3.observe({type: 'event', durationThreshold: 300});
    observer3.observe({type: 'event', durationThreshold: 500});
    observer4.observe({entryTypes: ['event']});

    NativePerformanceObserverMock.logRawEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event2',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event3',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 100,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event4',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 500,
    });

    await jest.runAllTicks();
    observer1.disconnect();

    NativePerformanceObserverMock.logRawEntry({
      name: 'event5',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 200,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event6',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 300,
    });

    await jest.runAllTicks();
    observer3.disconnect();

    NativePerformanceObserverMock.logRawEntry({
      name: 'event7',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 200,
    });

    await jest.runAllTicks();
    observer4.disconnect();

    expect(entries1.map(e => e.name)).toStrictEqual([
      'event1',
      'event3',
      'event4',
    ]);
    expect(entries2.map(e => e.name)).toStrictEqual([
      'event1',
      'event4',
      'event5',
      'event6',
      'event7',
    ]);
    expect(entries3.map(e => e.name)).toStrictEqual(['event4', 'event6']);
    expect(entries4.map(e => e.name)).toStrictEqual([
      'event1',
      'event2',
      'event3',
      'event4',
      'event5',
      'event6',
      'event7',
    ]);
  });

  it('should guard against errors in observer callbacks', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const observer1Callback = jest.fn((_entries, _observer, _options) => {
      throw new Error('observer 1 callback');
    });
    const observer1 = new PerformanceObserver(observer1Callback);

    const observer2Callback = jest.fn();
    const observer2 = new PerformanceObserver(observer2Callback);

    observer1.observe({type: 'mark'});
    observer2.observe({type: 'mark'});

    NativePerformanceObserverMock.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    jest.runAllTicks();

    expect(observer1Callback).toHaveBeenCalled();
    expect(observer2Callback).toHaveBeenCalled();

    expect(console.error).toHaveBeenCalledWith(
      new Error('observer 1 callback'),
    );
  });

  it('should not invoke observers with non-matching entries', () => {
    const observer1Callback = jest.fn();
    const observer1 = new PerformanceObserver(observer1Callback);

    const observer2Callback = jest.fn();
    const observer2 = new PerformanceObserver(observer2Callback);

    observer1.observe({type: 'mark'});
    observer2.observe({type: 'measure'});

    NativePerformanceObserverMock.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 200,
    });

    jest.runAllTicks();

    expect(observer1Callback).toHaveBeenCalled();
    expect(observer2Callback).not.toHaveBeenCalled();
  });
});
