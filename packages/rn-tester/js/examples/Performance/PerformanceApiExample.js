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
import type ReactNativeStartupTiming from '../../../../../Libraries/WebPerformance/ReactNativeStartupTiming';

import * as React from 'react';
import {StyleSheet, View, Text, Button} from 'react-native';
import RNTesterPage from '../../components/RNTesterPage';
import Performance from '../../../../../Libraries/WebPerformance/Performance';

const {useState, useCallback} = React;
const performance = new Performance();

function MemoryExample(): React.Node {
  // Memory API testing
  const [memoryInfo, setMemoryInfo] = useState<{
    jsHeapSizeLimit?: ?number,
    totalJSHeapSize?: ?number,
    usedJSHeapSize?: ?number,
  }>({});
  const onGetMemoryInfo = useCallback(() => {
    // performance.memory is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[incompatible-call]
    setMemoryInfo(performance.memory);
  }, []);
  return (
    <RNTesterPage noSpacer={true} noScroll={true} title="performance.memory">
      <View style={styles.container}>
        <Button onPress={onGetMemoryInfo} title="Click to update memory info" />
        <View>
          <Text>
            {`jsHeapSizeLimit: ${
              memoryInfo.jsHeapSizeLimit == null
                ? 'N/A'
                : memoryInfo.jsHeapSizeLimit
            } bytes`}
          </Text>
          <Text>
            {`totalJSHeapSize: ${
              memoryInfo.totalJSHeapSize == null
                ? 'N/A'
                : memoryInfo.totalJSHeapSize
            } bytes`}
          </Text>
          <Text>
            {`usedJSHeapSize: ${
              memoryInfo.usedJSHeapSize == null
                ? 'N/A'
                : memoryInfo.usedJSHeapSize
            } bytes`}
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
    <RNTesterPage
      noSpacer={true}
      noScroll={true}
      title="performance.reactNativeStartupTiming">
      <View style={styles.container}>
        <Button
          onPress={onGetStartupTiming}
          title="Click to update React startup timing"
        />
        <View>
          <Text>{`startTime: ${
            startUpTiming == null ? 'N/A' : startUpTiming.startTime
          } ms`}</Text>
          <Text>
            {`executeJavaScriptBundleEntryPointStart: ${
              startUpTiming == null
                ? 'N/A'
                : startUpTiming.executeJavaScriptBundleEntryPointStart
            } ms`}
          </Text>
          <Text>{`executeJavaScriptBundleEntryPointEnd: ${
            startUpTiming == null
              ? 'N/A'
              : startUpTiming.executeJavaScriptBundleEntryPointEnd
          } ms`}</Text>
          <Text>{`endTime: ${
            startUpTiming == null ? 'N/A' : startUpTiming.endTime
          } ms`}</Text>
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
