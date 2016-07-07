/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ActivityIndicatorIOS
 */
'use strict';

var ActivityIndicator = require('ActivityIndicator');
var NativeMethodsMixin = require('react/lib/NativeMethodsMixin');
var PropTypes = require('react/lib/ReactPropTypes');
var React = require('React');
var View = require('View');

/**
 * Deprecated, use ActivityIndicator instead.
 */
var ActivityIndicatorIOS = React.createClass({
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

  componentDidMount: function() {
    console.warn('ActivityIndicatorIOS is deprecated. Use ActivityIndicator instead.');
  },

  render: function() {
    return <ActivityIndicator {...this.props} />;
  }
});

module.exports = ActivityIndicatorIOS;
