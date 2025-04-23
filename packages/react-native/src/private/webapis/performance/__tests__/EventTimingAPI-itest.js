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

import 'react-native/Libraries/Core/InitializeCore';

import type {PerformanceObserverEntryList} from 'react-native/src/private/webapis/performance/PerformanceObserver';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import {useState} from 'react';
import {Text, View} from 'react-native';
import setUpPerformanceObserver from 'react-native/src/private/setup/setUpPerformanceObserver';
import {PerformanceEventTiming} from 'react-native/src/private/webapis/performance/EventTiming';
import {PerformanceObserver} from 'react-native/src/private/webapis/performance/PerformanceObserver';

setUpPerformanceObserver();

function sleep(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

function ensurePerformanceEventTiming(value: mixed): PerformanceEventTiming {
  if (!(value instanceof PerformanceEventTiming)) {
    throw new Error(
      `Expected instance of PerformanceEventTiming but got ${String(value)}`,
    );
  }

  return value;
}

describe('Event Timing API', () => {
  it('reports events without event handlers or updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['event']});

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View />);
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });

  it('reports events with handlers but no updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['event']});

    const SIMULATED_PROCESSING_DELAY = 50;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          onClick={event => {
            sleep(SIMULATED_PROCESSING_DELAY);
          }}
        />,
      );
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.processingEnd - entry.processingStart).toBeGreaterThanOrEqual(
      SIMULATED_PROCESSING_DELAY,
    );

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });

  it('reports events with updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['event']});

    function MyComponent() {
      const [count, setCount] = useState(0);

      return (
        <View
          onClick={event => {
            setCount(count + 1);
          }}>
          <Text>{count}</Text>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyComponent />);
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    // TODO: When Fantom provides structured data from mounting manager, add timestamp to operations and verify that the duration includes that.

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });
});
