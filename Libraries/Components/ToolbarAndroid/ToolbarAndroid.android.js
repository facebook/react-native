/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ToolbarAndroid
 */

'use strict';

var Image = require('Image');
var NativeMethodsMixin = require('NativeMethodsMixin');
var RCTUIManager = require('NativeModules').UIManager;
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var ReactPropTypes = require('ReactPropTypes');

var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');

var optionalImageSource = ReactPropTypes.oneOfType([
  Image.propTypes.source,
  // Image.propTypes.source is required but we want it to be optional, so we OR
  // it with a nullable propType.
  ReactPropTypes.oneOf([])
]);

/**
 * React component that wraps the Android-only [`Toolbar` widget][0]. A Toolbar can display a logo,
 * navigation icon (e.g. hamburger menu), a title & subtitle and a list of actions. The title and
 * subtitle are expanded so the logo and navigation icons are displayed on the left, title and
 * subtitle in the middle and the actions on the right.
 *
 * If the toolbar has an only child, it will be displayed between the title and actions.
 *
 * Although the Toolbar supports remote images for the logo, navigation and action icons, this
 * should only be used in DEV mode where `require('./some_icon.png')` translates into a packager
 * URL. In release mode you should always use a drawable resource for these icons. Using
 * `require('./some_icon.png')` will do this automatically for you, so as long as you don't
 * explicitly use e.g. `{uri: 'http://...'}`, you will be good.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   return (
 *     <ToolbarAndroid
 *       logo={require('image!app_logo')}
 *       title="AwesomeApp"
 *       actions={[{title: 'Settings', icon: require('image!icon_settings'), show: 'always'}]}
 *       onActionSelected={this.onActionSelected} />
 *   )
 * },
 * onActionSelected: function(position) {
 *   if (position === 0) { // index of 'Settings'
 *     showSettings();
 *   }
 * }
 * ```
 *
 * [0]: https://developer.android.com/reference/android/support/v7/widget/Toolbar.html
 */
var ToolbarAndroid = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * Sets possible actions on the toolbar as part of the action menu. These are displayed as icons
     * or text on the right side of the widget. If they don't fit they are placed in an 'overflow'
     * menu.
     *
     * This property takes an array of objects, where each object has the following keys:
     *
     * * `title`: **required**, the title of this action
     * * `icon`: the icon for this action, e.g. `require('image!some_icon')`
     * * `show`: when to show this action as an icon or hide it in the overflow menu: `always`,
     * `ifRoom` or `never`
     * * `showWithText`: boolean, whether to show text alongside the icon or not
     */
    actions: ReactPropTypes.arrayOf(ReactPropTypes.shape({
      title: ReactPropTypes.string.isRequired,
      icon: optionalImageSource,
      show: ReactPropTypes.oneOf(['always', 'ifRoom', 'never']),
      showWithText: ReactPropTypes.bool
    })),
    /**
     * Sets the toolbar logo.
     */
    logo: optionalImageSource,
    /**
     * Sets the navigation icon.
     */
    navIcon: optionalImageSource,
    /**
     * Callback that is called when an action is selected. The only argument that is passeed to the
     * callback is the position of the action in the actions array.
     */
    onActionSelected: ReactPropTypes.func,
    /**
     * Callback called when the icon is selected.
     */
    onIconClicked: ReactPropTypes.func,
    /**
     * Sets the overflow icon.
     */
    overflowIcon: optionalImageSource,
    /**
     * Sets the toolbar subtitle.
     */
    subtitle: ReactPropTypes.string,
    /**
     * Sets the toolbar subtitle color.
     */
    subtitleColor: ReactPropTypes.string,
    /**
     * Sets the toolbar title.
     */
    title: ReactPropTypes.string,
    /**
     * Sets the toolbar title color.
     */
    titleColor: ReactPropTypes.string,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: ReactPropTypes.string,
  },

  render: function() {
    var nativeProps = {
      ...this.props,
    };
    if (this.props.logo) {
      nativeProps.logo = resolveAssetSource(this.props.logo);
    }
    if (this.props.navIcon) {
      nativeProps.navIcon = resolveAssetSource(this.props.navIcon);
    }
    if (this.props.overflowIcon) {
      nativeProps.overflowIcon = resolveAssetSource(this.props.overflowIcon);
    }
    if (this.props.actions) {
      nativeProps.actions = [];
      for (var i = 0; i < this.props.actions.length; i++) {
        var action = {
          ...this.props.actions[i],
        };
        if (action.icon) {
          action.icon = resolveAssetSource(action.icon);
        }
        if (action.show) {
          action.show = RCTUIManager.ToolbarAndroid.Constants.ShowAsAction[action.show];
        }
        nativeProps.actions.push(action);
      }
    }

    return <NativeToolbar onSelect={this._onSelect} {...nativeProps} />;
  },

  _onSelect: function(event) {
    var position = event.nativeEvent.position;
    if (position === -1) {
      this.props.onIconClicked && this.props.onIconClicked();
    } else {
      this.props.onActionSelected && this.props.onActionSelected(position);
    }
  },
});

var toolbarAttributes = {
  ...ReactNativeViewAttributes.UIView,
  actions: true,
  logo: true,
  navIcon: true,
  overflowIcon: true,
  subtitle: true,
  subtitleColor: true,
  title: true,
  titleColor: true,
};

var NativeToolbar = requireNativeComponent('ToolbarAndroid', null);

module.exports = ToolbarAndroid;
