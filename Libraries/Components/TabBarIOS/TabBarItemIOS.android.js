/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TabBarItemIOS
 */

'use strict';

var Dimensions = require('Dimensions');
var React = require('React');
var View = require('View');
var StyleSheet = require('StyleSheet');

var DummyTab = React.createClass({
  render: function() {
    if (!this.props.selected) {
      return <View />;
    }
    return (
      <View style={[this.props.style, styles.tab]}>
        {this.props.children}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  tab: {
    // TODO(5405356): Implement overflow: visible so position: absolute isn't useless
    // position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    borderColor: 'red',
    borderWidth: 1,
  }
});

module.exports = DummyTab;
