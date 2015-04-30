/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View,
  SegmentedControlIOS,
} = React;

var { TestModule } = React.addons;

var SegmentedControlIOSSnapshotTest = React.createClass({
  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
    requestAnimationFrame(() => TestModule.verifySnapshot(this.done));
  },

  done() {
    TestModule.markTestCompleted();
  },

  render() {
    return (
      <View>
        <View style={styles.testRow}>
          <SegmentedControlIOS values={["One", "Two"]} />
        </View>
        <View style={styles.testRow}>
          <SegmentedControlIOS values={["One", "Two"]} selectedSegmentIndex={0} />
        </View>
        <View style={styles.testRow}>
          <SegmentedControlIOS values={["One", "Two", "Three", "Four", "Five"]} />
        </View>
        <View style={styles.testRow}>
          <SegmentedControlIOS disabled={true} values={["One", "Two"]} selectedSegmentIndex={1} />
        </View>
        <View style={styles.testRow}>
          <SegmentedControlIOS tintColor="#ff0000" values={["One", "Two", "Three", "Four"]} selectedSegmentIndex={0} />
        </View>
        <View style={styles.testRow}>
          <SegmentedControlIOS tintColor="#00ff00" values={["One", "Two", "Three"]} selectedSegmentIndex={1} />
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  testRow: {
    marginBottom: 10,
  }
});

module.exports = SegmentedControlIOSSnapshotTest;
