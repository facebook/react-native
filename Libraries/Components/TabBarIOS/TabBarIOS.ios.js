/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TabBarIOS
 * @flow
 */
'use strict';

var ColorPropType = require('ColorPropType');
var React = require('React');
const PropTypes = require('prop-types');
var StyleSheet = require('StyleSheet');
var TabBarItemIOS = require('TabBarItemIOS');
const ViewPropTypes = require('ViewPropTypes');

var requireNativeComponent = require('requireNativeComponent');

class TabBarIOS extends React.Component {
  props: {
    style?: $FlowFixMe,
    unselectedTintColor?: $FlowFixMe,
    tintColor?: $FlowFixMe,
    unselectedItemTintColor?: $FlowFixMe,
    barTintColor?: $FlowFixMe,
    translucent?: boolean,
    itemPositioning?: 'fill' | 'center' | 'auto',
  };

  static Item = TabBarItemIOS;

  // $FlowFixMe(>=0.41.0)
  static propTypes = {
    ...ViewPropTypes,
    style: ViewPropTypes.style,
    /**
     * Color of text on unselected tabs
     */
    unselectedTintColor: ColorPropType,
    /**
     * Color of the currently selected tab icon
     */
    tintColor: ColorPropType,
    /**
     * Color of unselected tab icons. Available since iOS 10.
     */
    unselectedItemTintColor: ColorPropType,
    /**
     * Background color of the tab bar
     */
    barTintColor: ColorPropType,
    /**
     * A Boolean value that indicates whether the tab bar is translucent
     */
    translucent: PropTypes.bool,
    /**
     * Specifies tab bar item positioning. Available values are:
     * - fill - distributes items across the entire width of the tab bar
     * - center - centers item in the available tab bar space
     * - auto (default) - distributes items dynamically according to the
     * user interface idiom. In a horizontally compact environment (e.g. iPhone 5)
     * this value defaults to `fill`, in a horizontally regular one (e.g. iPad)
     * it defaults to center.
     */
    itemPositioning: PropTypes.oneOf(['fill', 'center', 'auto']),
  };

  render() {
    return (
      <RCTTabBar
        style={[styles.tabGroup, this.props.style]}
        unselectedTintColor={this.props.unselectedTintColor}
        unselectedItemTintColor={this.props.unselectedItemTintColor}
        tintColor={this.props.tintColor}
        barTintColor={this.props.barTintColor}
        itemPositioning={this.props.itemPositioning}
        translucent={this.props.translucent !== false}>
        {
          // $FlowFixMe found when converting React.createClass to ES6
          this.props.children}
      </RCTTabBar>
    );
  }
}

var styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  }
});

var RCTTabBar = requireNativeComponent('RCTTabBar', TabBarIOS);

module.exports = TabBarIOS;
