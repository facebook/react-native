/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TabBarItemIOS
 * @noflow
 */
'use strict';

var Image = require('Image');
var React = require('React');
var StaticContainer = require('StaticContainer.react');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var TabBarItemIOS = React.createClass({
  propTypes: {
    ...View.propTypes,
    /**
     * Little red bubble that sits at the top right of the icon.
     */
    badge: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    /**
     * Items comes with a few predefined system icons. Note that if you are
     * using them, the title and selectedIcon will be overridden with the
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
     * If set to true it renders the image as original,
     * it defaults to being displayed as a template
     */
    renderAsOriginal: React.PropTypes.bool,
    /**
     * It specifies whether the children are visible or not. If you see a
     * blank content, you probably forgot to add a selected one.
     */
    selected: React.PropTypes.bool,
    /**
     * React style object.
     */
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

  componentWillReceiveProps: function(nextProps: { selected?: boolean }) {
    if (this.state.hasBeenSelected || nextProps.selected) {
      this.setState({hasBeenSelected: true});
    }
  },

  render: function() {
    var {style, children, ...props} = this.props;

    // if the tab has already been shown once, always continue to show it so we
    // preserve state between tab transitions
    if (this.state.hasBeenSelected) {
      var tabContents =
        <StaticContainer shouldUpdate={this.props.selected}>
          {children}
        </StaticContainer>;
    } else {
      var tabContents = <View />;
    }

    return (
      <RCTTabBarItem
        {...props}
        style={[styles.tab, style]}>
        {tabContents}
      </RCTTabBarItem>
    );
  }
});

var styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }
});

var RCTTabBarItem = requireNativeComponent('RCTTabBarItem', TabBarItemIOS);

module.exports = TabBarItemIOS;
