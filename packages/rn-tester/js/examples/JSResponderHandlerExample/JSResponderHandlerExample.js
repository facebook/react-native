/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {Text, View, StyleSheet} = require('react-native');

import {PanResponder, ScrollView} from 'react-native';

exports.displayName = 'JSResponderHandlerExample';
exports.framework = 'React';
exports.title = '<JSResponderHandler>';
exports.description = 'Simple example to test JSResponderHandler.';

const _gesture = PanResponder.create({
  onMoveShouldSetPanResponder: (e, gestureState) => {
    return Math.abs(gestureState.moveX) > 150;
  },
});

exports.examples = [
  {
    title: 'JSResponderHandlerExample',
    description: ('This example tests the native JSResponderHandler: when the user ' +
      'scrolls on the right side of the ScrollView (white area located on the' +
      ' right side of the gray area), the touch event is managed by native ' +
      'which blocks the scroll event.': string),

    render: function(): React.Node {
      const views = [];
      for (let i = 0; i < 100; i++) {
        views[i] = (
          <View key={i} style={styles.row} collapsable={false}>
            <View style={styles.touchable_area} collapsable={false}>
              <Text>I am row {i}</Text>
            </View>
          </View>
        );
      }
      return (
        <View
          style={styles.container}
          {..._gesture.panHandlers}
          collapsable={false}>
          <ScrollView style={styles.scrollview} testID="scroll_view">
            {views}
          </ScrollView>
        </View>
      );
    },
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollview: {
    flex: 1,
  },
  row: {
    height: 25,
  },
  touchable_area: {
    width: 150,
    backgroundColor: 'lightgray',
  },
});
