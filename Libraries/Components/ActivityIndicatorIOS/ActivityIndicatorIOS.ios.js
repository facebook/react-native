/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ActivityIndicatorIOS
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var keyMirror = require('keyMirror');
var merge = require('merge');

var SpinnerSize = keyMirror({
  large: null,
  small: null,
});

var GRAY = '#999999';

type DefaultProps = {
  animating: boolean;
  size: 'small' | 'large';
  color: string;
};

var ActivityIndicatorIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * Whether to show the indicator (true, the default) or hide it (false).
     */
    animating: PropTypes.bool,
    /**
     * The foreground color of the spinner (default is gray).
     */
    color: PropTypes.string,

    /**
     * Size of the indicator. Small has a height of 20, large has a height of 36.
     */
    size: PropTypes.oneOf([
      'small',
      'large',
    ]),
  },

  getDefaultProps: function(): DefaultProps {
    return {
      animating: true,
      size: SpinnerSize.small,
      color: GRAY,
    };
  },

  render: function() {
    var style = styles.sizeSmall;
    var NativeConstants = NativeModules.UIManager.UIActivityIndicatorView.Constants;
    var activityIndicatorViewStyle = NativeConstants.StyleWhite;
    if (this.props.size === 'large') {
      style = styles.sizeLarge;
      activityIndicatorViewStyle = NativeConstants.StyleWhiteLarge;
    }
    return (
      <View
        style={[styles.container, style, this.props.style]}>
        <UIActivityIndicatorView
          activityIndicatorViewStyle={activityIndicatorViewStyle}
          animating={this.props.animating}
          color={this.props.color}
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    height: 20,
  },
  sizeLarge: {
    height: 36,
  }
});

var UIActivityIndicatorView = createReactIOSNativeComponentClass({
  validAttributes: merge(
    ReactIOSViewAttributes.UIView, {
    activityIndicatorViewStyle: true, // UIActivityIndicatorViewStyle=UIActivityIndicatorViewStyleWhite
    animating: true,
    color: true,
  }),
  uiViewClassName: 'UIActivityIndicatorView',
});

module.exports = ActivityIndicatorIOS;
