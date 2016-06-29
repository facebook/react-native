/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RefreshControl
 * @flow
 */
'use strict';

const ColorPropType = require('ColorPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const View = require('View');

const requireNativeComponent = require('requireNativeComponent');

if (Platform.OS === 'android') {
  var RefreshLayoutConsts = require('NativeModules').UIManager.AndroidSwipeRefreshLayout.Constants;
} else {
  var RefreshLayoutConsts = {SIZE: {}};
}

/**
 * This component is used inside a ScrollView or ListView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 *
 * ### Usage example
 *
 * ``` js
 * class RefreshableList extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       refreshing: false,
 *     };
 *   }
 *
 *   _onRefresh() {
 *     this.setState({refreshing: true});
 *     fetchData().then(() => {
 *       this.setState({refreshing: false});
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <ListView
 *         refreshControl={
 *           <RefreshControl
 *             refreshing={this.state.refreshing}
 *             onRefresh={this._onRefresh.bind(this)}
 *           />
 *         }
 *         ...
 *       >
 *       ...
 *       </ListView>
 *     );
 *   }
 *   ...
 * }
 * ```
 *
 * __Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
 * in the `onRefresh` function otherwise the refresh indicator will stop immediatly.
 */
const RefreshControl = React.createClass({
  statics: {
    SIZE: RefreshLayoutConsts.SIZE,
  },

  mixins: [NativeMethodsMixin],

  propTypes: {
    ...View.propTypes,
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
    tintColor: ColorPropType,
    /**
     * Title color.
     * @platform ios
     */
    titleColor: ColorPropType,
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
    colors: React.PropTypes.arrayOf(ColorPropType),
    /**
     * The background color of the refresh indicator.
     * @platform android
     */
    progressBackgroundColor: ColorPropType,
    /**
     * Size of the refresh indicator, see RefreshControl.SIZE.
     * @platform android
     */
    size: React.PropTypes.oneOf(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE),
  },

  _nativeRef: {},

  render() {
    return (
      <NativeRefreshControl
        {...this.props}
        ref={ref => this._nativeRef = ref}
        onRefresh={this._onRefresh}
      />
    );
  },

  _onRefresh() {
    this.props.onRefresh && this.props.onRefresh();

    if (this._nativeRef) {
      this._nativeRef.setNativeProps({refreshing: this.props.refreshing});
    }
  },
});

if (Platform.OS === 'ios') {
  var NativeRefreshControl = requireNativeComponent(
    'RCTRefreshControl',
    RefreshControl
  );
} else if (Platform.OS === 'android') {
  var NativeRefreshControl = requireNativeComponent(
    'AndroidSwipeRefreshLayout',
    RefreshControl
  );
}

module.exports = RefreshControl;
