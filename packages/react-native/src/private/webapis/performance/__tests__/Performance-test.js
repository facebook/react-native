/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// eslint-disable-next-line @react-native/monorepo/sort-imports
import type Performance from '../Performance';

import {performanceEntryTypeToRaw} from '../internals/RawPerformanceEntry';
import {reportEntry} from '../specs/__mocks__/NativePerformanceMock';

jest.mock('../specs/NativePerformance', () =>
  require('../specs/__mocks__/NativePerformanceMock'),
);

declare var performance: Performance;

const NativePerformanceMock =
  require('../specs/__mocks__/NativePerformanceMock').default;

describe('Performance', () => {
  beforeEach(() => {
    jest.resetModules();

    const PerformanceClass = require('../Performance').default;
    // $FlowExpectedError[cannot-write]
    global.performance = new PerformanceClass();
  });

  it('reports marks and measures', () => {
    NativePerformanceMock.setCurrentTime(25);

    performance.mark('mark-now');
    performance.mark('mark-in-the-past', {
      startTime: 10,
    });
    performance.mark('mark-in-the-future', {
      startTime: 50,
    });
    performance.measure('measure-with-specific-time', {
      start: 30,
      duration: 4,
    });
    performance.measure('measure-now-with-start-mark', 'mark-in-the-past');
    performance.measure(
      'measure-with-start-and-end-mark',
      'mark-in-the-past',
      'mark-in-the-future',
    );

    const entries = performance.getEntries();
    expect(entries.length).toBe(6);
    expect(entries.map(entry => entry.toJSON())).toEqual([
      {
        duration: 0,
        entryType: 'mark',
        name: 'mark-in-the-past',
        startTime: 10,
      },
      {
        duration: 15,
        entryType: 'measure',
        name: 'measure-now-with-start-mark',
        startTime: 10,
      },
      {
        duration: 40,
        entryType: 'measure',
        name: 'measure-with-start-and-end-mark',
        startTime: 10,
      },
      {
        duration: 0,
        entryType: 'mark',
        name: 'mark-now',
        startTime: 25,
      },
      {
        duration: 4,
        entryType: 'measure',
        name: 'measure-with-specific-time',
        startTime: 30,
      },
      {
        duration: 0,
        entryType: 'mark',
        name: 'mark-in-the-future',
        startTime: 50,
      },
    ]);
  });

  it('clearMarks and clearMeasures remove correct entry types', async () => {
    performance.mark('entry1', {startTime: 0});
    performance.mark('mark2', {startTime: 0});

    performance.measure('entry1', {start: 0, duration: 0});
    performance.measure('measure2', {start: 0, duration: 0});

    performance.clearMarks();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([
      'entry1',
      'measure2',
    ]);

    performance.mark('entry2', {startTime: 0});
    performance.mark('mark3', {startTime: 0});

    performance.clearMeasures();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([
      'entry2',
      'mark3',
    ]);

    performance.clearMarks();

    expect(performance.getEntries().map(e => e.name)).toStrictEqual([]);
  });

  it('getEntries only works with allowed entry types', async () => {
    performance.clearMarks();
    performance.clearMeasures();

    performance.mark('entry1', {startTime: 0});
    performance.mark('mark2', {startTime: 0});

    jest.spyOn(console, 'warn').mockImplementation(() => {});

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
    performance.clearMarks();
    performance.clearMeasures();

    performance.mark('entry1', {startTime: 0});
    performance.mark('mark2', {startTime: 0});

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

  it('defines EventCounts for Performance', () => {
    expect(performance.eventCounts).not.toBeUndefined();
  });

  it('consistently implements the API for EventCounts', async () => {
    let interactionId = 0;
    const eventDefaultValues = {
      entryType: performanceEntryTypeToRaw('event'),
      startTime: 0, // startTime
      duration: 100, // duration
      processingStart: 0, // processing start
      processingEnd: 100, // processingEnd
    };

    reportEntry({
      name: 'click',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'input',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'input',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });

    const eventCounts = performance.eventCounts;
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
    reportEntry({
      name: 'input',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });
    expect(Array.from(eventCounts.values())).toStrictEqual([1, 3, 5]);

    await jest.runAllTicks();
    reportEntry({
      name: 'click',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });

    await jest.runAllTicks();

    reportEntry({
      name: 'keyup',
      ...eventDefaultValues,
      interactionId: interactionId++,
    });

    expect(Array.from(eventCounts.values())).toStrictEqual([2, 3, 6]);
  });
});
