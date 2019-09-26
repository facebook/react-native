/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const RCTNativeAppEventEmitter = require('react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter');

const {View} = ReactNative;

const {TestModule} = ReactNative.NativeModules;
import type EmitterSubscription from 'react-native/Libraries/vendor/emitter/EmitterSubscription';

const reactViewWidth = 101;
const reactViewHeight = 102;
const newReactViewWidth = 201;
const newReactViewHeight = 202;

type Props = {||};

type State = {|
  height: number,
  width: number,
|};

class ReactContentSizeUpdateTest extends React.Component<Props, State> {
  _timeoutID: ?TimeoutID = null;
  _subscription: ?EmitterSubscription = null;

  state = {
    height: reactViewHeight,
    width: reactViewWidth,
  };

  UNSAFE_componentWillMount() {
    this._subscription = RCTNativeAppEventEmitter.addListener(
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize,
    );
  }

  componentDidMount() {
    this._timeoutID = setTimeout(() => {
      this.updateViewSize();
    }, 1000);
  }

  componentWillUnmount() {
    if (this._timeoutID != null) {
      clearTimeout(this._timeoutID);
    }

    if (this._subscription != null) {
      this._subscription.remove();
    }
  }

  updateViewSize() {
    this.setState({
      height: newReactViewHeight,
      width: newReactViewWidth,
    });
  }

  rootViewDidChangeIntrinsicSize = (intrinsicSize: State) => {
    if (
      intrinsicSize.height === newReactViewHeight &&
      intrinsicSize.width === newReactViewWidth
    ) {
      TestModule.markTestPassed(true);
    }
  };

  render() {
    return (
      <View style={{height: this.state.height, width: this.state.width}} />
    );
  }
}

module.exports = ReactContentSizeUpdateTest;
