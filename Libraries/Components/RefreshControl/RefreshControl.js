/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RefreshControl
 */
'use strict';

const React = require('React');
const Platform = require('Platform');

const requireNativeComponent = require('requireNativeComponent');

if (Platform.OS === 'ios') {
  var RefreshLayoutConsts = {SIZE: {}};
} else if (Platform.OS === 'android') {
  var RefreshLayoutConsts = require('NativeModules').UIManager.AndroidSwipeRefreshLayout.Constants;
}

/**
 * This component is used inside a ScrollView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 */
const RefreshControl = React.createClass({
  statics: {
    SIZE: RefreshLayoutConsts.SIZE,
  },

  propTypes: {
    /**
     * Called when the view starts refreshing.
     */
    onRefresh: React.PropTypes.func,
    /**
     * Whether the view should be indicating an active refresh.
     */
    refreshing: React.PropTypes.bool,
    /**
     * The color of the refresh indicator.
     * @platform ios
     */
    tintColor: React.PropTypes.string,
    /**
     * The title displayed under the refresh indicator.
     * @platform ios
     */
    title: React.PropTypes.string,
    /**
     * Whether the pull to refresh functionality is enabled.
     * @platform android
     */
    enabled: React.PropTypes.bool,
    /**
     * The colors (at least one) that will be used to draw the refresh indicator.
     * @platform android
     */
    colors: React.PropTypes.arrayOf(React.PropTypes.string),
    /**
     * The background color of the refresh indicator.
     * @platform android
     */
    progressBackgroundColor: React.PropTypes.string,
    /**
     * Size of the refresh indicator, see PullToRefreshView.SIZE.
     * @platform android
     */
    size: React.PropTypes.oneOf(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE),
  },

  render() {
    if (Platform.OS === 'ios') {
      return this._renderIOS();
    } else if (Platform.OS === 'android') {
      return this._renderAndroid();
    }
  },

  _renderIOS() {
    return (
      <NativeRefreshControl
        tintColor={this.props.tintColor}
        title={this.props.title}
        refreshing={this.props.refreshing}
        onRefresh={this.props.onRefresh}/>
    );
  },

  _renderAndroid() {
    // On Android the ScrollView is wrapped so this component doesn't render
    // anything and only acts as a way to configure the wrapper view.
    // ScrollView will wrap itself in a AndroidSwipeRefreshLayout using props
    // from this.
    return null;
  },
});

if (Platform.OS === 'ios') {
  var NativeRefreshControl = requireNativeComponent(
    'RCTRefreshControl',
    RefreshControl
  );
}

module.exports = RefreshControl;
