/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @providesModule ReactContentSizeUpdateTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var RCTNativeAppEventEmitter = require('RCTNativeAppEventEmitter');
var Subscribable = require('Subscribable');
var TimerMixin = require('react-timer-mixin');

var { View } = ReactNative;

var { TestModule } = ReactNative.NativeModules;

var reactViewWidth = 101;
var reactViewHeight = 102;
var newReactViewWidth = 201;
var newReactViewHeight = 202;

var ReactContentSizeUpdateTest = React.createClass({
  mixins: [Subscribable.Mixin,
           TimerMixin],

  componentWillMount: function() {
    this.addListenerOn(
      RCTNativeAppEventEmitter,
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize
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
    this.setTimeout(
      () => { this.updateViewSize(); },
      1000
    );
  },

  rootViewDidChangeIntrinsicSize: function(intrinsicSize) {
    if (intrinsicSize.height === newReactViewHeight && intrinsicSize.width === newReactViewWidth) {
      TestModule.markTestPassed(true);
    }
  },

  render() {
    return (
      <View style={{'height':this.state.height, 'width':this.state.width}}/>
    );
  }
});

ReactContentSizeUpdateTest.displayName = 'ReactContentSizeUpdateTest';

module.exports = ReactContentSizeUpdateTest;
