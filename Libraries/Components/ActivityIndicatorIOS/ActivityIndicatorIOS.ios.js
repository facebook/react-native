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
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var GRAY = '#999999';

type DefaultProps = {
  animating: boolean;
  color: string;
  hidesWhenStopped: boolean;
  size: 'small' | 'large';
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
     * Whether the indicator should hide when not animating (true by default).
     */
    hidesWhenStopped: PropTypes.bool,
    /**
     * Size of the indicator. Small has a height of 20, large has a height of 36.
     */
    size: PropTypes.oneOf([
      'small',
      'large',
    ]),
    /**
     * Invoked on mount and layout changes with
     *
     *   {nativeEvent: { layout: {x, y, width, height}}}.
     */
    onLayout: PropTypes.func,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      animating: true,
      color: GRAY,
      hidesWhenStopped: true,
      size: 'small',
    };
  },

  render: function() {
    var {onLayout, style, ...props} = this.props;
    var sizeStyle = (this.props.size === 'large') ? styles.sizeLarge : styles.sizeSmall;
    return (
      <View
        onLayout={onLayout}
        style={[styles.container, style]}>
        <RCTActivityIndicatorView {...props} style={sizeStyle} />
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
    width: 20,
    height: 20,
  },
  sizeLarge: {
    width: 36,
    height: 36,
  }
});

var RCTActivityIndicatorView = requireNativeComponent(
  'RCTActivityIndicatorView',
  ActivityIndicatorIOS,
  {nativeOnly: {activityIndicatorViewStyle: true}},
);

module.exports = ActivityIndicatorIOS;
