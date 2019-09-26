/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {View} = ReactNative;
const RCTDeviceEventEmitter = require('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter');
const {TestModule, AccessibilityManager} = ReactNative.NativeModules;

class AccessibilityManagerTest extends React.Component<{}> {
  componentDidMount() {
    AccessibilityManager.setAccessibilityContentSizeMultipliers({
      extraSmall: 1.0,
      small: 2.0,
      medium: 3.0,
      large: 4.0,
      extraLarge: 5.0,
      extraExtraLarge: 6.0,
      extraExtraExtraLarge: 7.0,
      accessibilityMedium: 8.0,
      accessibilityLarge: 9.0,
      accessibilityExtraLarge: 10.0,
      accessibilityExtraExtraLarge: 11.0,
      accessibilityExtraExtraExtraLarge: 12.0,
    });
    RCTDeviceEventEmitter.addListener('didUpdateDimensions', update => {
      TestModule.markTestPassed(update.window.fontScale === 4.0);
    });
  }

  render(): React.Node {
    return <View />;
  }
}

AccessibilityManagerTest.displayName = 'AccessibilityManagerTest';

module.exports = AccessibilityManagerTest;
