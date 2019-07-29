/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

require('react-native/Libraries/Core/InitializeCore');
const React = require('react');
const ReactNative = require('react-native');
const {
  AppRegistry,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

// Keep this list in sync with RNTesterIntegrationTests.m
const TESTS = [
  require('./IntegrationTestHarnessTest'),
  require('./TimersTest'),
  require('./AsyncStorageTest'),
  require('./LayoutEventsTest'),
  require('./AppEventsTest'),
  require('./SimpleSnapshotTest'),
  require('./ImageCachePolicyTest'),
  require('./ImageSnapshotTest'),
  require('./PromiseTest'),
  require('./SyncMethodTest'),
  require('./WebSocketTest'),
  require('./AccessibilityManagerTest'),
  require('./GlobalEvalWithSourceUrlTest'),
];

TESTS.forEach(
  /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
   * suppresses an error found when Flow v0.54 was deployed. To see the error
   * delete this comment and run Flow. */
  test => AppRegistry.registerComponent(test.displayName, () => test),
);

// Modules required for integration tests
require('./LoggingTestModule');

type Test = any;

class IntegrationTestsApp extends React.Component<{}, $FlowFixMeState> {
  state = {
    test: (null: ?Test),
  };

  render() {
    if (this.state.test) {
      return (
        <ScrollView>
          {/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
           * comment suppresses an error when upgrading Flow's support for
           * React. To see the error delete this comment and run Flow. */}
          <this.state.test />
        </ScrollView>
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.row}>
          Click on a test to run it in this shell for easier debugging and
          development. Run all tests in the testing environment with cmd+U in
          Xcode.
        </Text>
        <View style={styles.separator} />
        <ScrollView>
          {TESTS.map(test => [
            <TouchableOpacity
              onPress={() => this.setState({test})}
              style={styles.row}>
              <Text style={styles.testName}>{test.displayName}</Text>
            </TouchableOpacity>,
            <View style={styles.separator} />,
          ])}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginTop: 40,
    margin: 15,
  },
  row: {
    padding: 10,
  },
  testName: {
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#bbbbbb',
  },
});

AppRegistry.registerComponent('IntegrationTestsApp', () => IntegrationTestsApp);
