/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {
  PerformanceObserverCallbackOptions,
  PerformanceObserverEntryList,
} from 'react-native/src/private/webapis/performance/PerformanceObserver';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import setUpPerformanceObserver from 'react-native/src/private/setup/setUpPerformanceObserver';
import {PerformanceLongTaskTiming} from 'react-native/src/private/webapis/performance/LongTasks';
import {PerformanceObserver} from 'react-native/src/private/webapis/performance/PerformanceObserver';

setUpPerformanceObserver();

function sleep(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

function ensurePerformanceLongTaskTiming(
  value: mixed,
): PerformanceLongTaskTiming {
  if (!(value instanceof PerformanceLongTaskTiming)) {
    throw new Error(
      `Expected instance of PerformanceLongTaskTiming but got ${String(value)}`,
    );
  }

  return value;
}

describe('LongTasks API', () => {
  it('does NOT report short tasks (under 50ms)', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['longtask']});

    Fantom.runTask(() => {
      // Short task.
    });

    expect(callback).not.toHaveBeenCalled();

    Fantom.runTask(() => {
      // Slightly longer task, but still not long.
      sleep(40);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('reports long tasks (over 50ms)', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['longtask']});

    const beforeTaskStartTime = performance.now();
    let afterTaskStartTime;

    Fantom.runTask(() => {
      afterTaskStartTime = performance.now();
      // Long task.
      sleep(51);
    });

    const afterTaskEndTime = performance.now();

    expect(callback).toHaveBeenCalledTimes(1);

    const [entries, _observer, options] = callback.mock
      .lastCall as $FlowFixMe as [
      PerformanceObserverEntryList,
      PerformanceObserver,
      PerformanceObserverCallbackOptions,
    ];

    expect(_observer).toBe(observer);
    expect(options).toEqual({droppedEntriesCount: 0});

    const allEntries = entries.getEntries();
    expect(allEntries.length).toBe(1);
    expect(allEntries[0]).toBeInstanceOf(PerformanceLongTaskTiming);

    const entry = ensurePerformanceLongTaskTiming(allEntries[0]);

    expect(entry.name).toBe('self');
    expect(entry.entryType).toBe('longtask');
    expect(entry.startTime).toBeGreaterThanOrEqual(beforeTaskStartTime);
    expect(entry.startTime).toBeLessThanOrEqual(nullthrows(afterTaskStartTime));
    expect(entry.duration).toBeGreaterThanOrEqual(51);
    expect(entry.duration).toBeLessThanOrEqual(
      afterTaskEndTime - beforeTaskStartTime,
    );
    expect(entry.attribution).toEqual([]);
  });

  describe('tasks that yield', () => {
    it('should NOT be reported if they are longer than 50ms but had yielding opportunities in intervals shorter than 50ms', () => {
      const callback = jest.fn();

      const observer = new PerformanceObserver(callback);
      observer.observe({entryTypes: ['longtask']});

      const shouldYield = global.nativeRuntimeScheduler.unstable_shouldYield;

      Fantom.runTask(() => {
        sleep(40);
        shouldYield();
        sleep(40);
        shouldYield();
        sleep(40);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should be reported if running for longer than 50ms between yielding opportunities', () => {
      const callback = jest.fn();

      const observer = new PerformanceObserver(callback);
      observer.observe({entryTypes: ['longtask']});

      const shouldYield = global.nativeRuntimeScheduler.unstable_shouldYield;

      const beforeTaskStartTime = performance.now();
      let afterTaskStartTime;

      Fantom.runTask(() => {
        afterTaskStartTime = performance.now();
        sleep(40);
        shouldYield();
        sleep(51); // long interval without yielding
        shouldYield();
        sleep(40);
      });

      const afterTaskEndTime = performance.now();

      expect(callback).toHaveBeenCalledTimes(1);

      const entries = callback.mock.lastCall[0] as PerformanceObserverEntryList;
      const allEntries = entries.getEntries();
      expect(allEntries.length).toBe(1);

      const entry = ensurePerformanceLongTaskTiming(allEntries[0]);
      expect(entry.name).toBe('self');
      expect(entry.entryType).toBe('longtask');
      expect(entry.startTime).toBeGreaterThanOrEqual(beforeTaskStartTime);
      expect(entry.startTime).toBeLessThanOrEqual(
        nullthrows(afterTaskStartTime),
      );
      expect(entry.duration).toBeGreaterThanOrEqual(131); // just the sum of the sleep times in the task
      expect(entry.duration).toBeLessThanOrEqual(
        afterTaskEndTime - beforeTaskStartTime,
      );
      expect(entry.attribution).toEqual([]);
    });
  });
});
