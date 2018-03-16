/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RCTRootViewIntegrationTestApp
 */
'use strict';

require('regenerator-runtime/runtime');

var React = require('react');
var ReactNative = require('react-native');

var {
  AppRegistry,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

/* Keep this list in sync with RCTRootViewIntegrationTests.m */
var TESTS = [
  require('./PropertiesUpdateTest'),
  require('./ReactContentSizeUpdateTest'),
  require('./SizeFlexibilityUpdateTest'),
];

TESTS.forEach(
  (test) => AppRegistry.registerComponent(test.displayName, () => test)
);

class RCTRootViewIntegrationTestApp extends React.Component {
  state = {
    test: null,
  };

  render() {
    if (this.state.test) {
      return (
        <ScrollView>
          <this.state.test />
        </ScrollView>
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.row}>
          Click on a test to run it in this shell for easier debugging and
          development.  Run all tests in the testing environment with cmd+U in
          Xcode.
        </Text>
        <View style={styles.separator} />
        <ScrollView>
          {TESTS.map((test) => [
            <TouchableOpacity
              onPress={() => this.setState({test})}
              style={styles.row}>
              <Text style={styles.testName}>
                {test.displayName}
              </Text>
            </TouchableOpacity>,
            <View style={styles.separator} />
          ])}
        </ScrollView>
      </View>
    );
  }
}

var styles = StyleSheet.create({
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

AppRegistry.registerComponent('RCTRootViewIntegrationTestApp', () => RCTRootViewIntegrationTestApp);
