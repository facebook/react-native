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
const createReactClass = require('create-react-class');
const ReactNative = require('react-native');
const RCTNativeAppEventEmitter = require('RCTNativeAppEventEmitter');
const {View} = ReactNative;

const {TestModule} = ReactNative.NativeModules;
import type EmitterSubscription from 'EmitterSubscription';

const reactViewWidth = 111;
const reactViewHeight = 222;

let finalState = false;

const SizeFlexibilityUpdateTest = createReactClass({
  displayName: 'SizeFlexibilityUpdateTest',
  _subscription: (null: ?EmitterSubscription),

  UNSAFE_componentWillMount: function() {
    this._subscription = RCTNativeAppEventEmitter.addListener(
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize,
    );
  },

  componentWillUnmount: function() {
    if (this._subscription != null) {
      this._subscription.remove();
    }
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
      if (
        intrinsicSize.width === reactViewWidth &&
        intrinsicSize.height === reactViewHeight
      ) {
        this.markPassed();
        return;
      }
    }
    if (this.props.height) {
      if (
        intrinsicSize.width !== reactViewWidth &&
        intrinsicSize.height === reactViewHeight
      ) {
        this.markPassed();
        return;
      }
    }
    if (this.props.width) {
      if (
        intrinsicSize.width === reactViewWidth &&
        intrinsicSize.height !== reactViewHeight
      ) {
        this.markPassed();
        return;
      }
    }
    if (this.props.none) {
      if (
        intrinsicSize.width !== reactViewWidth &&
        intrinsicSize.height !== reactViewHeight
      ) {
        this.markPassed();
        return;
      }
    }
  },

  render() {
    return <View style={{height: reactViewHeight, width: reactViewWidth}} />;
  },
});

SizeFlexibilityUpdateTest.displayName = 'SizeFlexibilityUpdateTest';

module.exports = SizeFlexibilityUpdateTest;
