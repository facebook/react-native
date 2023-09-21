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

'use strict';
import type MemoryInfo from 'react-native/Libraries/WebPerformance/MemoryInfo';
import type ReactNativeStartupTiming from 'react-native/Libraries/WebPerformance/ReactNativeStartupTiming';

import * as React from 'react';
import {StyleSheet, View, Text, Button} from 'react-native';
import RNTesterPage from '../../components/RNTesterPage';
import Performance from 'react-native/Libraries/WebPerformance/Performance';

const {useState, useCallback} = React;
const performance = new Performance();

function MemoryExample(): React.Node {
  // Memory API testing
  const [memoryInfo, setMemoryInfo] = useState<?MemoryInfo>(null);
  const onGetMemoryInfo = useCallback(() => {
    // performance.memory is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[incompatible-call]
    setMemoryInfo(performance.memory);
  }, []);
  return (
    <RNTesterPage noScroll={true} title="performance.memory">
      <View style={styles.container}>
        <Button onPress={onGetMemoryInfo} title="Click to update memory info" />
        <View>
          <Text>
            {`jsHeapSizeLimit: ${String(memoryInfo?.jsHeapSizeLimit)} bytes`}
          </Text>
          <Text>
            {`totalJSHeapSize: ${String(memoryInfo?.totalJSHeapSize)} bytes`}
          </Text>
          <Text>
            {`usedJSHeapSize: ${String(memoryInfo?.usedJSHeapSize)} bytes`}
          </Text>
        </View>
      </View>
    </RNTesterPage>
  );
}

function StartupTimingExample(): React.Node {
  // React Startup Timing API testing
  const [startUpTiming, setStartUpTiming] =
    useState<?ReactNativeStartupTiming>(null);
  const onGetStartupTiming = useCallback(() => {
    // performance.reactNativeStartupTiming is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[incompatible-call]
    setStartUpTiming(performance.reactNativeStartupTiming);
  }, []);
  return (
    <RNTesterPage noScroll={true} title="performance.reactNativeStartupTiming">
      <View style={styles.container}>
        <Button
          onPress={onGetStartupTiming}
          title="Click to update React startup timing"
        />
        <View>
          <Text>{`startTime: ${String(startUpTiming?.startTime)} ms`}</Text>
          <Text>{`initializeRuntimeStart: ${String(
            startUpTiming?.initializeRuntimeStart,
          )} ms`}</Text>
          <Text>
            {`executeJavaScriptBundleEntryPointStart: ${String(
              startUpTiming?.executeJavaScriptBundleEntryPointStart,
            )} ms`}
          </Text>
          <Text>{`executeJavaScriptBundleEntryPointEnd: ${String(
            startUpTiming?.executeJavaScriptBundleEntryPointEnd,
          )} ms`}</Text>
          <Text>{`initializeRuntimeEnd: ${String(
            startUpTiming?.initializeRuntimeEnd,
          )} ms`}</Text>
          <Text>{`endTime: ${String(startUpTiming?.endTime)} ms`}</Text>
        </View>
      </View>
    </RNTesterPage>
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
];
