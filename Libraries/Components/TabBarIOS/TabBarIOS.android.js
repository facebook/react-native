/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TabBarIOS
 */

'use strict';

var React = require('React');
var View = require('View');
var StyleSheet = require('StyleSheet');

var DummyTabBarIOS = React.createClass({
  render: function() {
    return (
      <View style={[this.props.style, styles.tabGroup]}>
        {this.props.children}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  }
});

module.exports = DummyTabBarIOS;
