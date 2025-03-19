/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type MemoryInfo from 'react-native/src/private/webapis/performance/MemoryInfo';
import type ReactNativeStartupTiming from 'react-native/src/private/webapis/performance/ReactNativeStartupTiming';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect} from 'react';
import {Button, StyleSheet, View} from 'react-native';
import Performance from 'react-native/src/private/webapis/performance/Performance';
import {
  type PerformanceEntry,
  type PerformanceEventTiming,
  PerformanceObserver,
} from 'react-native/src/private/webapis/performance/PerformanceObserver';

const {useState, useCallback} = React;
const performance = new Performance();

function MemoryExample(): React.Node {
  // Memory API testing
  const [memoryInfo, setMemoryInfo] = useState<?MemoryInfo>(null);
  const onGetMemoryInfo = useCallback(() => {
    // performance.memory is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    setMemoryInfo(performance.memory);
  }, []);
  return (
    <View style={styles.container}>
      <Button onPress={onGetMemoryInfo} title="Click to update memory info" />
      <View>
        <RNTesterText>
          {`jsHeapSizeLimit: ${String(memoryInfo?.jsHeapSizeLimit)} bytes`}
        </RNTesterText>
        <RNTesterText>
          {`totalJSHeapSize: ${String(memoryInfo?.totalJSHeapSize)} bytes`}
        </RNTesterText>
        <RNTesterText>
          {`usedJSHeapSize: ${String(memoryInfo?.usedJSHeapSize)} bytes`}
        </RNTesterText>
      </View>
    </View>
  );
}

function StartupTimingExample(): React.Node {
  // React Startup Timing API testing
  const [startUpTiming, setStartUpTiming] =
    useState<?ReactNativeStartupTiming>(null);
  const onGetStartupTiming = useCallback(() => {
    // performance.reactNativeStartupTiming is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    setStartUpTiming(performance.rnStartupTiming);
  }, []);
  return (
    <View style={styles.container}>
      <Button
        onPress={onGetStartupTiming}
        title="Click to update React startup timing"
      />
      <View>
        <RNTesterText>{`startTime: ${String(startUpTiming?.startTime)} ms`}</RNTesterText>
        <RNTesterText>{`initializeRuntimeStart: ${String(
          startUpTiming?.initializeRuntimeStart,
        )} ms`}</RNTesterText>
        <RNTesterText>
          {`executeJavaScriptBundleEntryPointStart: ${String(
            startUpTiming?.executeJavaScriptBundleEntryPointStart,
          )} ms`}
        </RNTesterText>
        <RNTesterText>{`executeJavaScriptBundleEntryPointEnd: ${String(
          startUpTiming?.executeJavaScriptBundleEntryPointEnd,
        )} ms`}</RNTesterText>
        <RNTesterText>{`initializeRuntimeEnd: ${String(
          startUpTiming?.initializeRuntimeEnd,
        )} ms`}</RNTesterText>
        <RNTesterText>{`endTime: ${String(startUpTiming?.endTime)} ms`}</RNTesterText>
      </View>
    </View>
  );
}

function PerformanceObserverUserTimingExample(): React.Node {
  const [entries, setEntries] = useState<$ReadOnlyArray<PerformanceEntry>>([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      const newEntries = list
        .getEntries()
        .filter(entry => entry.name.startsWith('rntester-'));
      if (newEntries.length > 0) {
        setEntries(newEntries);
      }
    });

    observer.observe({entryTypes: ['mark', 'measure']});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    performance.mark('rntester-mark1');
    performance.mark('rntester-mark2');
    performance.measure(
      'rntester-measure1',
      'rntester-mark1',
      'rntester-mark2',
    );
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={onPress} title="Click to log some marks and measures" />
      <View>
        {entries.map((entry, index) =>
          entry.entryType === 'mark' ? (
            <RNTesterText key={index}>
              Mark {entry.name}: {entry.startTime.toFixed(2)}
            </RNTesterText>
          ) : (
            <RNTesterText key={index}>
              Measure {entry.name}: {entry.startTime.toFixed(2)} -{' '}
              {(entry.startTime + entry.duration).toFixed(2)} (
              {entry.duration.toFixed(2)}ms)
            </RNTesterText>
          ),
        )}
      </View>
    </View>
  );
}

function PerformanceObserverEventTimingExample(): React.Node {
  const [count, setCount] = useState(0);

  const [entries, setEntries] = useState<
    $ReadOnlyArray<PerformanceEventTiming>,
  >([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      const newEntries: $ReadOnlyArray<PerformanceEventTiming> =
        // $FlowExpectedError[incompatible-type] This is guaranteed because we're only observing `event` entry types.
        list.getEntries();
      setEntries(newEntries);
    });

    observer.observe({type: 'event'});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    busyWait(500);
    // Force a state update to show how/if we're reporting paint times as well.
    setCount(currentCount => currentCount + 1);
  }, []);

  return (
    <View style={styles.container}>
      <Button
        onPress={onPress}
        title={`Click to force a slow event (clicked ${count} times)`}
      />
      <View>
        {entries.map((entry, index) => (
          <RNTesterText key={index}>
            Event: {entry.name}
            {'\n'}
            Start: {entry.startTime.toFixed(2)}
            {'\n'}
            End: {(entry.startTime + entry.duration).toFixed(2)}
            {'\n'}
            Duration: {entry.duration.toFixed(2)}ms{'\n'}
            Processing start: {entry.processingStart.toFixed(2)} (delay:{' '}
            {(entry.processingStart - entry.startTime).toFixed(2)}ms){'\n'}
            Processing end: {entry.processingEnd.toFixed(2)} (duration:{' '}
            {(entry.processingEnd - entry.processingStart).toFixed(2)}ms){'\n'}
          </RNTesterText>
        ))}
      </View>
    </View>
  );
}

function PerformanceObserverLongtaskExample(): React.Node {
  const [entries, setEntries] = useState<$ReadOnlyArray<PerformanceEntry>>([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      setEntries(list.getEntries());
    });

    observer.observe({entryTypes: ['longtask']});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    // Wait 1s to force a long task
    busyWait(1000);
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={onPress} title="Click to force a long task" />
      <View>
        {entries.map((entry, index) => (
          <RNTesterText key={index}>
            Long task {entry.name}: {entry.startTime} -{' '}
            {entry.startTime + entry.duration} ({entry.duration}ms)
          </RNTesterText>
        ))}
      </View>
    </View>
  );
}

function busyWait(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export const title = 'Performance API Examples';
export const category = 'Basic';
export const description = 'Shows the performance API provided in React Native';
export const examples: Array<RNTesterModuleExample> = ([
  {
    title: 'performance.memory',
    render: (): React.Node => {
      return <MemoryExample />;
    },
  },
  {
    title: 'performance.reactNativeStartupTiming',
    render: (): React.Node => {
      return <StartupTimingExample />;
    },
  },
  {
    title: 'PerformanceObserver (marks and measures)',
    render: (): React.Node => {
      return <PerformanceObserverUserTimingExample />;
    },
  },
  {
    title: 'PerformanceObserver (events)',
    render: (): React.Node => {
      return <PerformanceObserverEventTimingExample />;
    },
  },
  PerformanceObserver.supportedEntryTypes.includes('longtask')
    ? {
        title: 'PerformanceObserver (long tasks)',
        render: (): React.Node => {
          return <PerformanceObserverLongtaskExample />;
        },
      }
    : null,
]: Array<?RNTesterModuleExample>).filter(Boolean);
