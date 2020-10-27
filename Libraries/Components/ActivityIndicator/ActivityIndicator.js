/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generate-docs
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../View/View');
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheet';

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

const ActivityIndicator = (props: Props, forwardedRef?: any) => {
  const {onLayout, style, size, ...restProps} = props;
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
      sizeStyle = {height: props.size, width: props.size};
      break;
  }

  const nativeProps = {
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
        // $FlowFixMe Flow doesn't know when this is the android component
        <PlatformActivityIndicator {...nativeProps} {...androidProps} />
      ) : (
        /* $FlowFixMe(>=0.106.0 site=react_native_android_fb) This comment
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

const ActivityIndicatorWithRef: React.AbstractComponent<
  Props,
  HostComponent<mixed>,
> = React.forwardRef(ActivityIndicator);
ActivityIndicatorWithRef.displayName = 'ActivityIndicator';

/* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.89 was deployed. To see the error, delete this comment
 * and run Flow. */
ActivityIndicatorWithRef.defaultProps = {
  animating: true,
  color: Platform.OS === 'ios' ? GRAY : null,
  hidesWhenStopped: true,
  size: 'small',
};

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
