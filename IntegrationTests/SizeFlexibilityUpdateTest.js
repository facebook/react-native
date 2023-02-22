/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

const RCTNativeAppEventEmitter = require('react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter');
const React = require('react');
const ReactNative = require('react-native');
const {View} = ReactNative;

const {TestModule} = ReactNative.NativeModules;
import {type EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

const reactViewWidth = 111;
const reactViewHeight = 222;

let finalState = false;

type Props = $ReadOnly<{|
  width: boolean,
  height: boolean,
  both: boolean,
  none: boolean,
|}>;

class SizeFlexibilityUpdateTest extends React.Component<Props> {
  _subscription: ?EventSubscription = null;

  UNSAFE_componentWillMount() {
    this._subscription = RCTNativeAppEventEmitter.addListener(
      'rootViewDidChangeIntrinsicSize',
      this.rootViewDidChangeIntrinsicSize,
    );
  }

  componentWillUnmount() {
    if (this._subscription != null) {
      this._subscription.remove();
    }
  }

  markPassed: () => void = () => {
    TestModule.markTestPassed(true);
    finalState = true;
  };

  rootViewDidChangeIntrinsicSize: (intrinsicSize: {
    height: number,
    width: number,
    ...
  }) => void = (intrinsicSize: {width: number, height: number, ...}) => {
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
  };

  render(): React.Node {
    return <View style={{height: reactViewHeight, width: reactViewWidth}} />;
  }
}

module.exports = SizeFlexibilityUpdateTest;
