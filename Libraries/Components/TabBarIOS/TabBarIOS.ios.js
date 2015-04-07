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

var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var TabBarItemIOS = require('TabBarItemIOS');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

var TabBarIOS = React.createClass({
  statics: {
    Item: TabBarItemIOS,
  },

  propTypes: {
    style: View.propTypes.style,
  },

  render: function() {
    return (
      <RCTTabBar style={[styles.tabGroup, this.props.style]}>
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

var config = {
  validAttributes: ReactIOSViewAttributes.UIView,
  uiViewClassName: 'RCTTabBar',
};
var RCTTabBar = createReactIOSNativeComponentClass(config);

module.exports = TabBarIOS;
