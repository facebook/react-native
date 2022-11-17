/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generate-docs
 */

'use strict';
import type {ViewProps} from '../View/ViewPropTypes';
import type {ActivityIndicator as ActivityIndicatorType} from './ActivityIndicator.flow';

import StyleSheet, {type ColorValue} from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import View from '../View/View';
import * as React from 'react';

const PlatformActivityIndicator =
  Platform.OS === 'android'
    ? require('../ProgressBarAndroid/ProgressBarAndroid')
    : require('./ActivityIndicatorViewNativeComponent').default;

const GRAY = '#999999';

type IndicatorSize = number | 'small' | 'large';

type IOSProps = $ReadOnly<{|
  /**
    Whether the indicator should hide when not animating.

    @platform ios
  */
  hidesWhenStopped?: ?boolean,
|}>;
type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,

  /**
   	Whether to show the indicator (`true`) or hide it (`false`).
   */
  animating?: ?boolean,

  /**
    The foreground color of the spinner.

    @default {@platform android} `null` (system accent default color)
    @default {@platform ios} '#999999'
  */
  color?: ?ColorValue,

  /**
    Size of the indicator.

    @type enum(`'small'`, `'large'`)
    @type {@platform android} number
  */
  size?: ?IndicatorSize,
|}>;

const ActivityIndicator = (
  {
    animating = true,
    color = Platform.OS === 'ios' ? GRAY : null,
    hidesWhenStopped = true,
    onLayout,
    size = 'small',
    style,
    ...restProps
  }: Props,
  forwardedRef?: any,
) => {
  let sizeStyle;
  let sizeProp;

  switch (size) {
    case 'small':
      sizeStyle = styles.sizeSmall;
      sizeProp = 'small';
      break;
    case 'large':
      sizeStyle = styles.sizeLarge;
      sizeProp = 'large';
      break;
    default:
      sizeStyle = {height: size, width: size};
      break;
  }

  const nativeProps = {
    animating,
    color,
    hidesWhenStopped,
    ...restProps,
    ref: forwardedRef,
    style: sizeStyle,
    size: sizeProp,
  };

  const androidProps = {
    styleAttr: 'Normal',
    indeterminate: true,
  };

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.compose(styles.container, style)}>
      {Platform.OS === 'android' ? (
        // $FlowFixMe[prop-missing] Flow doesn't know when this is the android component
        <PlatformActivityIndicator {...nativeProps} {...androidProps} />
      ) : (
        /* $FlowFixMe[prop-missing] (>=0.106.0 site=react_native_android_fb) This comment
         * suppresses an error found when Flow v0.106 was deployed. To see the
         * error, delete this comment and run Flow. */
        <PlatformActivityIndicator {...nativeProps} />
      )}
    </View>
  );
};

/**
  Displays a circular loading indicator.

  ```SnackPlayer name=ActivityIndicator%20Function%20Component%20Example
  import React from "react";
  import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

  const App = () => (
    <View style={[styles.container, styles.horizontal]}>
      <ActivityIndicator />
      <ActivityIndicator size="large" />
      <ActivityIndicator size="small" color="#0000ff" />
      <ActivityIndicator size="large" color="#00ff00" />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center"
    },
    horizontal: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 10
    }
  });
  export default App;
  ```

  ```SnackPlayer name=ActivityIndicator%20Class%20Component%20Example
  import React, { Component } from "react";
  import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

  class App extends Component {
    render() {
      return (
        <View style={[styles.container, styles.horizontal]}>
          <ActivityIndicator />
          <ActivityIndicator size="large" />
          <ActivityIndicator size="small" color="#0000ff" />
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      );
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center"
    },
    horizontal: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 10
    }
  });
  export default App;
  ```
*/

const ActivityIndicatorWithRef: ActivityIndicatorType =
  React.forwardRef(ActivityIndicator);
ActivityIndicatorWithRef.displayName = 'ActivityIndicator';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    width: 20,
    height: 20,
  },
  sizeLarge: {
    width: 36,
    height: 36,
  },
});

module.exports = ActivityIndicatorWithRef;
