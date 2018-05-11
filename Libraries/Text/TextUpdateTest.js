/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const createReactClass = require('create-react-class');
const ReactNative = require('react-native');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const TimerMixin = require('react-timer-mixin');
const {NativeModules, StyleSheet, Text} = ReactNative;

const TestManager =
  NativeModules.TestManager || NativeModules.SnapshotTestManager;

const TextUpdateTest = createReactClass({
  displayName: 'TextUpdateTest',
  mixins: [TimerMixin],
  getInitialState: function() {
    return {seeMore: true};
  },
  componentDidMount: function() {
    this.requestAnimationFrame(() =>
      this.setState({seeMore: false}, () => {
        TestManager.markTestCompleted();
      }),
    );
  },
  render: function() {
    return (
      <Text
        style={styles.container}
        onPress={() => this.setState({seeMore: !this.state.seeMore})}>
        <Text>Tap to see more (bugs)...</Text>
        {this.state.seeMore && 'raw text'}
      </Text>
    );
  },
});

const styles = StyleSheet.create({
  container: {
    margin: 10,
    marginTop: 100,
  },
});

module.exports = TextUpdateTest;
