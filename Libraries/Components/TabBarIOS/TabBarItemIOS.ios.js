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
    /**
     * Little red bubble that sits at the top right of the icon.
     */
    badge: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    /**
     * Items comes with a few predefined system icons. Note that if you are
     * using them, the title and selectedIcon will be overriden with the
     * system ones.
     */
    systemIcon: React.PropTypes.oneOf([
      'bookmarks',
      'contacts',
      'downloads',
      'favorites',
      'featured',
      'history',
      'more',
      'most-recent',
      'most-viewed',
      'recents',
      'search',
      'top-rated',
    ]),
    /**
     * A custom icon for the tab. It is ignored when a system icon is defined.
     */
    icon: Image.propTypes.source,
    /**
     * A custom icon when the tab is selected. It is ignored when a system
     * icon is defined. If left empty, the icon will be tinted in blue.
     */
    selectedIcon: Image.propTypes.source,
    /**
     * Callback when this tab is being selected, you should change the state of your
     * component to set selected={true}.
     */
    onPress: React.PropTypes.func,
    /**
     * It specifies whether the children are visible or not. If you see a
     * blank content, you probably forgot to add a selected one.
     */
    selected: React.PropTypes.bool,
    style: View.propTypes.style,
    /**
     * Text that appears under the icon. It is ignored when a system icon
     * is defined.
     */
    title: React.PropTypes.string,
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

    var icon = this.props.systemIcon || (
      this.props.icon && this.props.icon.uri
    );

    var badge = typeof this.props.badge === 'number' ?
      '' + this.props.badge :
      this.props.badge;

    return (
      <RCTTabBarItem
        icon={icon}
        selectedIcon={this.props.selectedIcon && this.props.selectedIcon.uri}
        onPress={this.props.onPress}
        selected={this.props.selected}
        badgeValue={badge}
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
