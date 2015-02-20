/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ActivityIndicatorIOS
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModulesDeprecated = require('NativeModulesDeprecated');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var keyMirror = require('keyMirror');
var keyOf = require('keyOf');
var merge = require('merge');

var SpinnerSize = keyMirror({
  large: null,
  small: null,
});

var GRAY = '#999999';

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
     * The size of the spinner, must be one of:
     * - ActivityIndicatorIOS.size.large
     * - ActivityIndicatorIOS.size.small (default)
     */
    size: PropTypes.oneOf([SpinnerSize.large, SpinnerSize.small]),
  },

  getDefaultProps: function() {
    return {
      animating: true,
      size: SpinnerSize.small,
      color: GRAY,
    };
  },

  statics: {
    size: SpinnerSize,
  },

  render: function() {
    var style = styles.sizeSmall;
    var NativeConstants = NativeModulesDeprecated.RKUIManager.UIActivityIndicatorView.Constants;
    var activityIndicatorViewStyle = NativeConstants.StyleWhite;
    if (this.props.size == SpinnerSize.large) {
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
