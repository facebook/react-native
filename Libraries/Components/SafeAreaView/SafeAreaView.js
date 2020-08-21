/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from '../../Utilities/Platform';
import * as React from 'react';
import View from '../View/View';

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type Props = $ReadOnly<{|
  ...ViewProps,
  /**
    @default true
   */
  emulateUnlessSupported?: boolean,
|}>;

let exported: React.AbstractComponent<
  Props,
  React.ElementRef<HostComponent<mixed>>,
>;

/**
  The purpose of `SafeAreaView` is to render content within the safe area
  boundaries of a device. It is currently only applicable to iOS devices with
  iOS version 11 or later.

  `SafeAreaView` renders nested content and automatically applies padding to
  reflect the portion of the view that is not covered by navigation bars, tab
  bars, toolbars, and other ancestor views. Moreover, and most importantly, Safe
  Area's paddings reflect the physical limitation of the screen, such as rounded
  corners or camera notches (i.e. the sensor housing area on iPhone X).

  To use, wrap your top level view with a `SafeAreaView` with a `flex: 1` style
  applied to it. You may also want to use a background color that matches your
  application's design.

  ```SnackPlayer name=SafeAreaView
  import React from 'react';
  import { StyleSheet, Text, SafeAreaView } from 'react-native';

  const App = () => {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Page content</Text>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  export default App;
  ```
 */
if (Platform.OS === 'android') {
  exported = React.forwardRef<Props, React.ElementRef<HostComponent<mixed>>>(
    function SafeAreaView(props, forwardedRef) {
      const {emulateUnlessSupported, ...localProps} = props;
      return <View {...localProps} ref={forwardedRef} />;
    },
  );
} else {
  const RCTSafeAreaViewNativeComponent = require('./RCTSafeAreaViewNativeComponent')
    .default;

  exported = React.forwardRef<Props, React.ElementRef<HostComponent<mixed>>>(
    function SafeAreaView(props, forwardedRef) {
      return (
        <RCTSafeAreaViewNativeComponent
          emulateUnlessSupported={true}
          {...props}
          ref={forwardedRef}
        />
      );
    },
  );
}

module.exports = exported;
