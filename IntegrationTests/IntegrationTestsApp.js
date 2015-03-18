/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule IntegrationTestsApp
 */
'use strict';

var React = require('react-native');

var {
  AppRegistry,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = React;

var TESTS = [
  require('./IntegrationTestHarnessTest'),
  require('./TimersTest'),
  require('./AsyncStorageTest'),
];

TESTS.forEach(
  (test) => AppRegistry.registerComponent(test.displayName, () => test)
);

var IntegrationTestsApp = React.createClass({
  getInitialState: function() {
    return {
      test: null,
    };
  },
  render: function() {
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
          development.  Run all tests in the testing envirnment with cmd+U in
          Xcode.
        </Text>
        <View style={styles.separator} />
        <ScrollView>
          {TESTS.map((test) => [
            <TouchableOpacity onPress={() => this.setState({test})}>
              <View style={styles.row}>
                <Text style={styles.testName}>
                  {test.displayName}
                </Text>
              </View>
            </TouchableOpacity>,
            <View style={styles.separator} />
          ])}
        </ScrollView>
      </View>
    );
  }
});

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
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#bbbbbb',
  },
});

AppRegistry.registerComponent('IntegrationTestsApp', () => IntegrationTestsApp);
