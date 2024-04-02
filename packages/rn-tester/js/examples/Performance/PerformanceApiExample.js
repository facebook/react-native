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

import type MemoryInfo from 'react-native/src/private/webapis/performance/MemoryInfo';
import type ReactNativeStartupTiming from 'react-native/src/private/webapis/performance/ReactNativeStartupTiming';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useContext, useEffect} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import Performance from 'react-native/src/private/webapis/performance/Performance';
import PerformanceObserver, {
  type PerformanceEntry,
} from 'react-native/src/private/webapis/performance/PerformanceObserver';

const {useState, useCallback} = React;
const performance = new Performance();

function MemoryExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

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
        <Text style={{color: theme.LabelColor}}>
          {`jsHeapSizeLimit: ${String(memoryInfo?.jsHeapSizeLimit)} bytes`}
        </Text>
        <Text style={{color: theme.LabelColor}}>
          {`totalJSHeapSize: ${String(memoryInfo?.totalJSHeapSize)} bytes`}
        </Text>
        <Text style={{color: theme.LabelColor}}>
          {`usedJSHeapSize: ${String(memoryInfo?.usedJSHeapSize)} bytes`}
        </Text>
      </View>
    </View>
  );
}

function StartupTimingExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

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
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`startTime: ${String(startUpTiming?.startTime)} ms`}</Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`initializeRuntimeStart: ${String(
          startUpTiming?.initializeRuntimeStart,
        )} ms`}</Text>
        <Text style={{color: theme.LabelColor}}>
          {`executeJavaScriptBundleEntryPointStart: ${String(
            startUpTiming?.executeJavaScriptBundleEntryPointStart,
          )} ms`}
        </Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`executeJavaScriptBundleEntryPointEnd: ${String(
          startUpTiming?.executeJavaScriptBundleEntryPointEnd,
        )} ms`}</Text>
        <Text
          style={{color: theme.LabelColor}}>{`initializeRuntimeEnd: ${String(
          startUpTiming?.initializeRuntimeEnd,
        )} ms`}</Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`endTime: ${String(startUpTiming?.endTime)} ms`}</Text>
      </View>
    </View>
  );
}

function PerformanceObserverUserTimingExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  const [entries, setEntries] = useState<$ReadOnlyArray<PerformanceEntry>>([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      setEntries(list.getEntries());
    });

    observer.observe({entryTypes: ['mark', 'measure']});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    performance.mark('mark1');
    performance.mark('mark2');
    performance.measure('measure1', 'mark1', 'mark2');
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={onPress} title="Click to log some marks and measures" />
      <View>
        {entries.map((entry, index) =>
          entry.entryType === 'mark' ? (
            <Text style={{color: theme.LabelColor}} key={index}>
              Mark {entry.name}: {entry.startTime}
            </Text>
          ) : (
            <Text style={{color: theme.LabelColor}} key={index}>
              Measure {entry.name}: {entry.startTime} -{' '}
              {entry.startTime + entry.duration} ({entry.duration}ms)
            </Text>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

exports.title = 'Performance API Examples';
exports.category = 'Basic';
exports.description = 'Shows the performance API provided in React Native';
exports.examples = [
  {
    title: 'performance.memory',
    render: function (): React.Element<typeof MemoryExample> {
      return <MemoryExample />;
    },
  },
  {
    title: 'performance.reactNativeStartupTiming',
    render: function (): React.Element<typeof StartupTimingExample> {
      return <StartupTimingExample />;
    },
  },
  {
    title: 'PerformanceObserver (marks and measures)',
    render: function (): React.Element<typeof StartupTimingExample> {
      return <PerformanceObserverUserTimingExample />;
    },
  },
];
