/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ProgressViewIOSExample
 */
'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var ReactNative = require('react-native');
var {
  ProgressViewIOS,
  StyleSheet,
  View,
} = ReactNative;
var TimerMixin = require('react-timer-mixin');

var ProgressViewExample = createReactClass({
  displayName: 'ProgressViewExample',
  mixins: [TimerMixin],

  getInitialState() {
    return {
      progress: 0,
    };
  },

  componentDidMount() {
    this.updateProgress();
  },

  updateProgress() {
    var progress = this.state.progress + 0.01;
    this.setState({ progress });
    this.requestAnimationFrame(() => this.updateProgress());
  },

  getProgress(offset) {
    var progress = this.state.progress + offset;
    return Math.sin(progress % Math.PI) % 1;
  },

  render() {
    return (
      <View style={styles.container}>
        <ProgressViewIOS style={styles.progressView} progress={this.getProgress(0)}/>
        <ProgressViewIOS style={styles.progressView} progressTintColor="purple" progress={this.getProgress(0.2)}/>
        <ProgressViewIOS style={styles.progressView} progressTintColor="red" progress={this.getProgress(0.4)}/>
        <ProgressViewIOS style={styles.progressView} progressTintColor="orange" progress={this.getProgress(0.6)}/>
        <ProgressViewIOS style={styles.progressView} progressTintColor="yellow" progress={this.getProgress(0.8)}/>
      </View>
    );
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = 'ProgressViewIOS';
exports.description = 'ProgressViewIOS';
exports.examples = [{
  title: 'ProgressViewIOS',
  render() {
    return (
      <ProgressViewExample/>
    );
  }
}];

var styles = StyleSheet.create({
  container: {
    marginTop: -20,
    backgroundColor: 'transparent',
  },
  progressView: {
    marginTop: 20,
  }
});
