/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var ReactNative = require('react-native');
var RCTNativeAppEventEmitter = require('RCTNativeAppEventEmitter');
var Subscribable = require('Subscribable');
var { View } = ReactNative;

var { TestModule } = ReactNative.NativeModules;

var reactViewWidth = 111;
var reactViewHeight = 222;

var finalState = false;

var SizeFlexibilityUpdateTest = createReactClass({
  displayName: 'SizeFlexibilityUpdateTest',
  mixins: [Subscribable.Mixin],

  UNSAFE_componentWillMount: function() {
    this.addListenerOn(
      RCTNativeAppEventEmitter,
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize
    );
  },

  markPassed: function() {
    TestModule.markTestPassed(true);
    finalState = true;
  },

  rootViewDidChangeIntrinsicSize: function(intrinsicSize) {

    if (finalState) {
      // If a test reaches its final state, it is not expected to do anything more
      TestModule.markTestPassed(false);
      return;
    }

    if (this.props.both) {
      if (intrinsicSize.width === reactViewWidth && intrinsicSize.height === reactViewHeight) {
        this.markPassed();
        return;
      }
    }
    if (this.props.height) {
      if (intrinsicSize.width !== reactViewWidth && intrinsicSize.height === reactViewHeight) {
        this.markPassed();
        return;
      }
    }
    if (this.props.width) {
      if (intrinsicSize.width === reactViewWidth && intrinsicSize.height !== reactViewHeight) {
        this.markPassed();
        return;
      }
    }
    if (this.props.none) {
      if (intrinsicSize.width !== reactViewWidth && intrinsicSize.height !== reactViewHeight) {
        this.markPassed();
        return;
      }
    }
  },

  render() {
    return (
      <View style={{'height':reactViewHeight, 'width':reactViewWidth}}/>
    );
  }
});

SizeFlexibilityUpdateTest.displayName = 'SizeFlexibilityUpdateTest';

module.exports = SizeFlexibilityUpdateTest;
