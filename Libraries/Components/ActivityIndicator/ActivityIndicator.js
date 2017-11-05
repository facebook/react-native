/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ActivityIndicator
 * @flow
 */
'use strict';

const ColorPropType = require('ColorPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const ProgressBarAndroid = require('ProgressBarAndroid');
const PropTypes = require('prop-types');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

const GRAY = '#999999';

type IndicatorSize = number | 'small' | 'large';

type DefaultProps = {
  animating: boolean,
  color: any,
  hidesWhenStopped: boolean,
  size: IndicatorSize,
}

/**
 * Displays a circular loading indicator.
 *
 * ### Example
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react'
 * import {
 *   ActivityIndicator,
 *   AppRegistry,
 *   StyleSheet,
 *   Text,
 *   View,
 * } from 'react-native'
 *
 * class App extends Component {
 *   render() {
 *     return (
 *       <View style={[styles.container, styles.horizontal]}>
 *         <ActivityIndicator size="large" color="#0000ff" />
 *         <ActivityIndicator size="small" color="#00ff00" />
 *         <ActivityIndicator size="large" color="#0000ff" />
 *         <ActivityIndicator size="small" color="#00ff00" />
 *       </View>
 *     )
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     justifyContent: 'center'
 *   },
 *   horizontal: {
 *     flexDirection: 'row',
 *     justifyContent: 'space-around',
 *     padding: 10
 *   }
 * })
 *
 * AppRegistry.registerComponent('App', () => App)
 * ```
 */
const ActivityIndicator = createReactClass({
  displayName: 'ActivityIndicator',
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * Whether to show the indicator (true, the default) or hide it (false).
     */
    animating: PropTypes.bool,
    /**
     * The foreground color of the spinner (default is gray).
     */
    color: ColorPropType,
    /**
     * Size of the indicator (default is 'small').
     * Passing a number to the size prop is only supported on Android.
     */
    size: PropTypes.oneOfType([
      PropTypes.oneOf([ 'small', 'large' ]),
      PropTypes.number,
    ]),
    /**
     * Whether the indicator should hide when not animating (true by default).
     *
     * @platform ios
     */
    hidesWhenStopped: PropTypes.bool,
  },

  getDefaultProps(): DefaultProps {
    return {
      animating: true,
      color: Platform.OS === 'ios' ? GRAY : undefined,
      hidesWhenStopped: true,
      size: 'small',
    };
  },

  render() {
    const {onLayout, style, ...props} = this.props;
    let sizeStyle;

    switch (props.size) {
      case 'small':
        sizeStyle = styles.sizeSmall;
        break;
      case 'large':
        sizeStyle = styles.sizeLarge;
        break;
      default:
        sizeStyle = {height: props.size, width: props.size};
        break;
    }

    const nativeProps = {
      ...props,
      style: sizeStyle,
      styleAttr: 'Normal',
      indeterminate: true,
    };

    return (
      <View onLayout={onLayout} style={[styles.container, style]}>
        {Platform.OS === 'ios' ? (
          <RCTActivityIndicator {...nativeProps} />
        ) : (
          <ProgressBarAndroid {...nativeProps} />
        )}
      </View>
    );
  }
});

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

if (Platform.OS === 'ios') {
  var RCTActivityIndicator = requireNativeComponent(
    'RCTActivityIndicatorView',
    ActivityIndicator,
    { nativeOnly: { activityIndicatorViewStyle: true } }
  );
}

module.exports = ActivityIndicator;
