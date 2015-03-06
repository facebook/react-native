/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TabBarIOS
 */
'use strict';

var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

var TabBarIOS = React.createClass({
  render: function() {
    return (
      <RKTabBar style={[styles.tabGroup, this.props.style]}>
        {this.props.children}
      </RKTabBar>
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
var RKTabBar = createReactIOSNativeComponentClass(config);

module.exports = TabBarIOS;
