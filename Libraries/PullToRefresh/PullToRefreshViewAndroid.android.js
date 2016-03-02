/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PullToRefreshViewAndroid
 */
'use strict';

var ColorPropType = require('ColorPropType');
var React = require('React');
var RefreshLayoutConsts = require('UIManager').AndroidSwipeRefreshLayout.Constants;
var View = require('View');

var onlyChild = require('onlyChild');
var requireNativeComponent = require('requireNativeComponent');

var NATIVE_REF = 'native_swiperefreshlayout';

/**
 * Deprecated. Use `RefreshControl` instead.
 *
 * React view that supports a single scrollable child view (e.g. `ScrollView`). When this child
 * view is at `scrollY: 0`, swiping down triggers an `onRefresh` event.
 *
 * The style `{flex: 1}` might be required to ensure the expected behavior of the child component
 * (e.g. when the child is expected to scroll with `ScrollView` or `ListView`).
 */
var PullToRefreshViewAndroid = React.createClass({
  statics: {
    SIZE: RefreshLayoutConsts.SIZE,
  },

  propTypes: {
    ...View.propTypes,
    /**
     * Whether the pull to refresh functionality is enabled
     */
    enabled: React.PropTypes.bool,
    /**
     * The colors (at least one) that will be used to draw the refresh indicator
     */
    colors: React.PropTypes.arrayOf(ColorPropType),
    /**
     * The background color of the refresh indicator
     */
    progressBackgroundColor: ColorPropType,
    /**
     * Whether the view should be indicating an active refresh
     */
    refreshing: React.PropTypes.bool,
    /**
     * Size of the refresh indicator, see PullToRefreshViewAndroid.SIZE
     */
    size: React.PropTypes.oneOf(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE),
  },

  componentDidMount: function() {
    console.warn('`PullToRefreshViewAndroid` is deprecated. Use `RefreshControl` instead.');
  },

  getInnerViewNode: function() {
    return this.refs[NATIVE_REF];
  },

  setNativeProps: function(props) {
    return this.refs[NATIVE_REF].setNativeProps(props);
  },

  render: function() {
    return (
      <NativePullToRefresh
        colors={this.props.colors}
        enabled={this.props.enabled}
        onRefresh={this._onRefresh}
        progressBackgroundColor={this.props.progressBackgroundColor}
        ref={NATIVE_REF}
        refreshing={this.props.refreshing}
        size={this.props.size}
        style={this.props.style}>
        {onlyChild(this.props.children)}
      </NativePullToRefresh>
    );
  },

  _onRefresh: function() {
    this.props.onRefresh && this.props.onRefresh();
    this.refs[NATIVE_REF].setNativeProps({refreshing: !!this.props.refreshing});
  }
});

var NativePullToRefresh = requireNativeComponent(
  'AndroidSwipeRefreshLayout',
  PullToRefreshViewAndroid
);

module.exports = PullToRefreshViewAndroid;
