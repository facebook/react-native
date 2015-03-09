/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TabBarItemIOS
 */
'use strict';

var Image = require('Image');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var Dimensions = require('Dimensions');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var merge = require('merge');

var TabBarItemIOS = React.createClass({
  propTypes: {
    icon: Image.sourcePropType.isRequired,
    onPress: React.PropTypes.func.isRequired,
    selected: React.PropTypes.bool.isRequired,
    badgeValue: React.PropTypes.string,
    title: React.PropTypes.string,
    style: View.propTypes.style,
  },

  getInitialState: function() {
    return {
      hasBeenSelected: false,
    };
  },

  componentWillMount: function() {
    if (this.props.selected) {
      this.setState({hasBeenSelected: true});
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (this.state.hasBeenSelected || nextProps.selected) {
      this.setState({hasBeenSelected: true});
    }
  },

  render: function() {
    var tabContents = null;
    // if the tab has already been shown once, always continue to show it so we
    // preserve state between tab transitions
    if (this.state.hasBeenSelected) {
      tabContents =
        <StaticContainer shouldUpdate={this.props.selected}>
          {this.props.children}
        </StaticContainer>;
    } else {
      tabContents = <View />;
    }

    return (
      <RKTabBarItem
        icon={this.props.icon.uri}
        selectedIcon={this.props.selectedIcon && this.props.selectedIcon.uri}
        onPress={this.props.onPress}
        selected={this.props.selected}
        badgeValue={this.props.badgeValue}
        title={this.props.title}
        style={[styles.tab, this.props.style]}>
        {tabContents}
      </RKTabBarItem>
    );
  }
});

var styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  }
});

var RKTabBarItem = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView, {
    title: true,
    icon: true,
    selectedIcon: true,
    selected: true,
    badgeValue: true,
  }),
  uiViewClassName: 'RCTTabBarItem',
});

module.exports = TabBarItemIOS;
