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
const NativeMethodsMixin = require('react/lib/NativeMethodsMixin');
const Platform = require('Platform');
const PropTypes = require('react/lib/ReactPropTypes');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const requireNativeComponent = require('requireNativeComponent');

const GRAY = '#999999';

/**
 * Displays a circular loading indicator.
 */
const ActivityIndicator = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...View.propTypes,
    /**
     * Whether to show the indicator (true, the default) or hide it (false).
     */
    animating: PropTypes.bool,
    /**
     * The foreground color of the spinner (default is gray).
     */
    color: ColorPropType,
    /**
     * Size of the indicator. Small has a height of 20, large has a height of 36.
     * Other sizes can be obtained using a scale transform.
     */
    size: PropTypes.oneOf([
      'small',
      'large',
    ]),
    /**
     * Whether the indicator should hide when not animating (true by default).
     *
     * @platform ios
     */
    hidesWhenStopped: PropTypes.bool,
  },

  getDefaultProps() {
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
    }
    return (
      <View
        onLayout={onLayout}
        style={[styles.container, style]}>
        <RCTActivityIndicator
          {...props}
          style={sizeStyle}
          styleAttr="Normal"
          indeterminate
        />
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
    {nativeOnly: {activityIndicatorViewStyle: true}},
  );
} else if (Platform.OS === 'android') {
  var RCTActivityIndicator = requireNativeComponent(
    'AndroidProgressBar',
    ActivityIndicator,
    // Ignore props that are specific to non inderterminate ProgressBar.
    {nativeOnly: {
      indeterminate: true,
      progress: true,
      styleAttr: true,
    }},
  );
}

module.exports = ActivityIndicator;
