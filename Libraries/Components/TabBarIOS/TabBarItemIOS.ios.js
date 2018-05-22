/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const ColorPropType = require('ColorPropType');
const Image = require('Image');
const React = require('React');
const PropTypes = require('prop-types');
const StaticContainer = require('StaticContainer.react');
const StyleSheet = require('StyleSheet');
const View = require('View');

const ViewPropTypes = require('ViewPropTypes');

const requireNativeComponent = require('requireNativeComponent');

class TabBarItemIOS extends React.Component {
  static propTypes = {
    ...ViewPropTypes,
    /**
     * Little red bubble that sits at the top right of the icon.
     */
    badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /**
     * Background color for the badge. Available since iOS 10.
     */
    badgeColor: ColorPropType,
    /**
     * Items comes with a few predefined system icons. Note that if you are
     * using them, the title and selectedIcon will be overridden with the
     * system ones.
     */
    systemIcon: PropTypes.oneOf([
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
    onPress: PropTypes.func,
    /**
     * If set to true it renders the image as original,
     * it defaults to being displayed as a template
     */
    renderAsOriginal: PropTypes.bool,
    /**
     * It specifies whether the children are visible or not. If you see a
     * blank content, you probably forgot to add a selected one.
     */
    selected: PropTypes.bool,
    /**
     * React style object.
     */
    style: ViewPropTypes.style,
    /**
     * Text that appears under the icon. It is ignored when a system icon
     * is defined.
     */
    title: PropTypes.string,
    /**
     *(Apple TV only)* When set to true, this view will be focusable
     * and navigable using the Apple TV remote.
     *
     * @platform ios
     */
    isTVSelectable: PropTypes.bool,
  };

  state = {
    hasBeenSelected: false,
  };

  UNSAFE_componentWillMount() {
    if (this.props.selected) {
      this.setState({hasBeenSelected: true});
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: {selected?: boolean}) {
    if (this.state.hasBeenSelected || nextProps.selected) {
      this.setState({hasBeenSelected: true});
    }
  }

  render() {
    const {style, children, ...props} = this.props;

    // if the tab has already been shown once, always continue to show it so we
    // preserve state between tab transitions
    if (this.state.hasBeenSelected) {
      var tabContents = (
        <StaticContainer shouldUpdate={this.props.selected}>
          {children}
        </StaticContainer>
      );
    } else {
      var tabContents = <View />;
    }

    return (
      <RCTTabBarItem {...props} style={[styles.tab, style]}>
        {tabContents}
      </RCTTabBarItem>
    );
  }
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

const RCTTabBarItem = requireNativeComponent('RCTTabBarItem', TabBarItemIOS);

module.exports = TabBarItemIOS;
