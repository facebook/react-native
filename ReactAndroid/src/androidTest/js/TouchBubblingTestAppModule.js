/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  NativeModules,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} = require('react-native');

const {Recording} = NativeModules;

class TouchBubblingTestApp extends React.Component {
  handlePress = record => {
    Recording.record(record);
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback
          onPress={this.handlePress.bind(this, 'outer')}
          testID="D">
          <View style={styles.outer}>
            <TouchableWithoutFeedback
              onPress={this.handlePress.bind(this, 'inner')}
              testID="B">
              <View style={styles.inner}>
                <View style={styles.superinner} testID="A" />
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.inner} testID="C" />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={this.handlePress.bind(this, 'outsider')}
          testID="E">
          <View style={styles.element} />
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#ccdd44',
  },
  element: {
    backgroundColor: '#ff0000',
    height: 100,
    margin: 30,
  },
  outer: {
    backgroundColor: '#00ff00',
    height: 100,
    margin: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inner: {
    backgroundColor: '#0000ff',
    height: 50,
    width: 50,
    margin: 10,
  },
  superinner: {
    backgroundColor: '#eeeeee',
    height: 20,
    width: 20,
  },
});

module.exports = TouchBubblingTestApp;
