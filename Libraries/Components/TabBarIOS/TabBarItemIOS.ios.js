/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TabBarItemIOS
 * @flow
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
    icon: Image.propTypes.source.isRequired,
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

  componentWillReceiveProps: function(nextProps: { selected: boolean }) {
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
      <RCTTabBarItem
        icon={this.props.icon.uri}
        selectedIcon={this.props.selectedIcon && this.props.selectedIcon.uri}
        onPress={this.props.onPress}
        selected={this.props.selected}
        badgeValue={this.props.badgeValue}
        title={this.props.title}
        style={[styles.tab, this.props.style]}>
        {tabContents}
      </RCTTabBarItem>
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

var RCTTabBarItem = createReactIOSNativeComponentClass({
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
