/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextUpdateTest
 * @flow
 */
'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var ReactNative = require('react-native');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
var TimerMixin = require('react-timer-mixin');
var {
  NativeModules,
  StyleSheet,
  Text,
} = ReactNative;

var TestManager = NativeModules.TestManager || NativeModules.SnapshotTestManager;

var TextUpdateTest = createReactClass({
  displayName: 'TextUpdateTest',
  mixins: [TimerMixin],
  getInitialState: function() {
    return {seeMore: true};
  },
  componentDidMount: function() {
    this.requestAnimationFrame(
      () => this.setState({seeMore: false}, () => {
        TestManager.markTestCompleted();
      })
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

var styles = StyleSheet.create({
  container: {
    margin: 10,
    marginTop: 100,
  },
});

module.exports = TextUpdateTest;
