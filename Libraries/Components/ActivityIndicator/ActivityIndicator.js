/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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

import type {ViewProps} from 'ViewPropTypes';

let RCTActivityIndicator;

const GRAY = '#999999';

type IndicatorSize = number | 'small' | 'large';

type Props = $ReadOnly<{|
  ...ViewProps,

  animating?: ?boolean,
  color?: ?string,
  hidesWhenStopped?: ?boolean,
  size?: ?IndicatorSize,
|}>;

type DefaultProps = {
  animating: boolean,
  color: ?string,
  hidesWhenStopped: boolean,
  size: IndicatorSize,
};

/**
 * Displays a circular loading indicator.
 *
 * See http://facebook.github.io/react-native/docs/activityindicator.html
 */
const ActivityIndicator = ((createReactClass({
  displayName: 'ActivityIndicator',
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * Whether to show the indicator (true, the default) or hide it (false).
     *
     * See http://facebook.github.io/react-native/docs/activityindicator.html#animating
     */
    animating: PropTypes.bool,
    /**
     * The foreground color of the spinner (default is gray).
     *
     * See http://facebook.github.io/react-native/docs/activityindicator.html#color
     */
    color: ColorPropType,
    /**
     * Size of the indicator (default is 'small').
     * Passing a number to the size prop is only supported on Android.
     *
     * See http://facebook.github.io/react-native/docs/activityindicator.html#size
     */
    size: PropTypes.oneOfType([
      PropTypes.oneOf(['small', 'large']),
      PropTypes.number,
    ]),
    /**
     * Whether the indicator should hide when not animating (true by default).
     *
     * @platform ios
     *
     * See http://facebook.github.io/react-native/docs/activityindicator.html#hideswhenstopped
     */
    hidesWhenStopped: PropTypes.bool,
  },

  getDefaultProps(): DefaultProps {
    return {
      animating: true,
      color: Platform.OS === 'ios' ? GRAY : null,
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
  },
}): any): React.ComponentType<Props>);

if (Platform.OS === 'ios') {
  RCTActivityIndicator = requireNativeComponent(
    'RCTActivityIndicatorView',
    ActivityIndicator,
    {nativeOnly: {activityIndicatorViewStyle: true}},
  );
}

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

module.exports = ActivityIndicator;
