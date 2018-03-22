/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSResponderTestApp
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');
var Text = require('Text');
var PanResponder = require('PanResponder');
var ScrollView = require('ScrollView');

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
    var views = [];
    for (var i = 0; i < 100; i++) {
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

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollview: {
    flex: 1,
  },
  row: {
    height: 30,
  }
});

module.exports = JSResponderTestApp;
