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
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} = require('react-native');

class JSResponderTestApp extends React.Component {
  _handleMoveShouldSetPanResponder = (e, gestureState) => {
    return Math.abs(gestureState.dx) > 30;
  };

  UNSAFE_componentWillMount() {
    this.panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
    });
  }

  render() {
    const views = [];
    for (let i = 0; i < 100; i++) {
      views[i] = (
        <View key={i} style={styles.row} collapsable={false}>
          <Text>I am row {i}</Text>
        </View>
      );
    }
    return (
      <View
        style={styles.container}
        {...this.panGesture.panHandlers}
        collapsable={false}>
        <ScrollView style={styles.scrollview} testID="scroll_view">
          {views}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollview: {
    flex: 1,
  },
  row: {
    height: 30,
  },
});

module.exports = JSResponderTestApp;
