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
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var UIManager = require('UIManager');
var View = require('View');
var ColorPropType = require('ColorPropType');

var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');

var ReactPropTypes = React.PropTypes;

var optionalImageSource = ReactPropTypes.oneOfType([
  Image.propTypes.source,
  // Image.propTypes.source is required but we want it to be optional, so we OR
  // it with a nullable propType.
  ReactPropTypes.oneOf([]),
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
 *       logo={require('./app_logo.png')}
 *       title="AwesomeApp"
 *       actions={[{title: 'Settings', icon: require('./icon_settings.png'), show: 'always'}]}
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
    ...View.propTypes,
    /**
     * Sets possible actions on the toolbar as part of the action menu. These are displayed as icons
     * or text on the right side of the widget. If they don't fit they are placed in an 'overflow'
     * menu.
     *
     * This property takes an array of objects, where each object has the following keys:
     *
     * * `title`: **required**, the title of this action
     * * `icon`: the icon for this action, e.g. `require('./some_icon.png')`
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
     * Callback that is called when an action is selected. The only argument that is passed to the
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
    subtitleColor: ColorPropType,
    /**
     * Sets the toolbar title.
     */
    title: ReactPropTypes.string,
    /**
     * Sets the toolbar title color.
     */
    titleColor: ColorPropType,
    /**
     * Sets the content inset for the toolbar starting edge.
     *
     * The content inset affects the valid area for Toolbar content other than
     * the navigation button and menu. Insets define the minimum margin for
     * these components and can be used to effectively align Toolbar content
     * along well-known gridlines.
     */
    contentInsetStart: ReactPropTypes.number,
    /**
     * Sets the content inset for the toolbar ending edge.
     *
     * The content inset affects the valid area for Toolbar content other than
     * the navigation button and menu. Insets define the minimum margin for
     * these components and can be used to effectively align Toolbar content
     * along well-known gridlines.
     */
    contentInsetEnd: ReactPropTypes.number,
    /**
     * Used to set the toolbar direction to RTL.
     * In addition to this property you need to add
     *
     *   android:supportsRtl="true"
     *
     * to your application AndroidManifest.xml and then call
     * `setLayoutDirection(LayoutDirection.RTL)` in your MainActivity
     * `onCreate` method.
     */
    rtl: ReactPropTypes.bool,
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
      var nativeActions = [];
      for (var i = 0; i < this.props.actions.length; i++) {
        var action = {
          ...this.props.actions[i],
        };
        if (action.icon) {
          action.icon = resolveAssetSource(action.icon);
        }
        if (action.show) {
          action.show = UIManager.ToolbarAndroid.Constants.ShowAsAction[action.show];
        }
        nativeActions.push(action);
      }
      nativeProps.nativeActions = nativeActions;
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

var NativeToolbar = requireNativeComponent('ToolbarAndroid', ToolbarAndroid, {
  nativeOnly: {
    nativeActions: true,
  }
});

module.exports = ToolbarAndroid;
