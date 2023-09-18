/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import invariant from 'invariant';
import NativeAccessibilityManager from 'react-native/Libraries/Components/AccessibilityInfo/NativeAccessibilityManager';
import {DeviceEventEmitter, NativeModules, View} from 'react-native';
import * as React from 'react';

const {TestModule} = NativeModules;

class AccessibilityManagerTest extends React.Component<{...}> {
  componentDidMount(): void {
    invariant(
      NativeAccessibilityManager,
      "NativeAccessibilityManager doesn't exist",
    );

    NativeAccessibilityManager.setAccessibilityContentSizeMultipliers({
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
    DeviceEventEmitter.addListener('didUpdateDimensions', update => {
      TestModule.markTestPassed(update.window.fontScale === 4.0);
    });
  }

  render(): React.Node {
    return <View />;
  }
}

AccessibilityManagerTest.displayName = 'AccessibilityManagerTest';

module.exports = AccessibilityManagerTest;
