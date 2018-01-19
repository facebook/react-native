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

import type {StyleObj} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

class TabBarIOS extends React.Component<ViewProps & {
  style?: StyleObj,
  unselectedTintColor?: string,
  tintColor?: string,
  unselectedItemTintColor?: string,
  barTintColor?: string,
  barStyle?: 'default' | 'black',
  translucent?: boolean,
  itemPositioning?: 'fill' | 'center' | 'auto',
  children: React.Node,
}> {
  static Item = TabBarItemIOS;

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
     * The style of the tab bar. Supported values are 'default', 'black'.
     * Use 'black' instead of setting `barTintColor` to black. This produces
     * a tab bar with the native iOS style with higher translucency.
     */
    barStyle: PropTypes.oneOf(['default', 'black']),
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
        barStyle={this.props.barStyle}
        itemPositioning={this.props.itemPositioning}
        translucent={this.props.translucent !== false}>
        {this.props.children}
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
