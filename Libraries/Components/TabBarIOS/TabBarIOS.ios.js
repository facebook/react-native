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
var StyleSheet = require('StyleSheet');
var TabBarItemIOS = require('TabBarItemIOS');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var TabBarIOS = React.createClass({
  statics: {
    Item: TabBarItemIOS,
  },

  propTypes: {
    ...View.propTypes,
    style: View.propTypes.style,
    /**
     * Color of the currently selected tab icon
     */
    tintColor: ColorPropType,
    /**
     * Background color of the tab bar
     */
    barTintColor: ColorPropType,
    /**
     * A Boolean value that indicates whether the tab bar is translucent
     */
    translucent: React.PropTypes.bool,
  },

  render: function() {
    return (
      <RCTTabBar
        style={[styles.tabGroup, this.props.style]}
        tintColor={this.props.tintColor}
        barTintColor={this.props.barTintColor}
        translucent={this.props.translucent !== false}>
        {this.props.children}
      </RCTTabBar>
    );
  }
});

var styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  }
});

var RCTTabBar = requireNativeComponent('RCTTabBar', TabBarIOS);

module.exports = TabBarIOS;
