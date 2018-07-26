/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const createReactClass = require('create-react-class');
const ReactNative = require('react-native');
const RCTNativeAppEventEmitter = require('RCTNativeAppEventEmitter');
const Subscribable = require('Subscribable');
const TimerMixin = require('react-timer-mixin');

const {View} = ReactNative;

const {TestModule} = ReactNative.NativeModules;

const reactViewWidth = 101;
const reactViewHeight = 102;
const newReactViewWidth = 201;
const newReactViewHeight = 202;

const ReactContentSizeUpdateTest = createReactClass({
  displayName: 'ReactContentSizeUpdateTest',
  mixins: [Subscribable.Mixin, TimerMixin],

  UNSAFE_componentWillMount: function() {
    this.addListenerOn(
      RCTNativeAppEventEmitter,
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize,
    );
  },

  getInitialState: function() {
    return {
      height: reactViewHeight,
      width: reactViewWidth,
    };
  },

  updateViewSize: function() {
    this.setState({
      height: newReactViewHeight,
      width: newReactViewWidth,
    });
  },

  componentDidMount: function() {
    this.setTimeout(() => {
      this.updateViewSize();
    }, 1000);
  },

  rootViewDidChangeIntrinsicSize: function(intrinsicSize) {
    if (
      intrinsicSize.height === newReactViewHeight &&
      intrinsicSize.width === newReactViewWidth
    ) {
      TestModule.markTestPassed(true);
    }
  },

  render() {
    return (
      <View style={{height: this.state.height, width: this.state.width}} />
    );
  },
});

ReactContentSizeUpdateTest.displayName = 'ReactContentSizeUpdateTest';

module.exports = ReactContentSizeUpdateTest;
