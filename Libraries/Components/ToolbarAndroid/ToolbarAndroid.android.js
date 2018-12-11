/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const UIManager = require('UIManager');

const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

import type {SyntheticEvent} from 'CoreEventTypes';
import type {ImageSource} from 'ImageSource';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

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

const NativeToolbar = requireNativeComponent('ToolbarAndroid');

type Action = $ReadOnly<{|
  title: string,
  icon?: ?ImageSource,
  show?: 'always' | 'ifRoom' | 'never',
  showWithText?: boolean,
|}>;

type ToolbarAndroidChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

type ToolbarAndroidProps = $ReadOnly<{|
  ...ViewProps,
  /**
   * or text on the right side of the widget. If they don't fit they are placed in an 'overflow'
   * Sets possible actions on the toolbar as part of the action menu. These are displayed as icons
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
  actions?: ?Array<Action>,
  /**
   * Sets the toolbar logo.
   */
  logo?: ?ImageSource,
  /**
   * Sets the navigation icon.
   */
  navIcon?: ?ImageSource,
  /**
   * Callback that is called when an action is selected. The only argument that is passed to the
   * callback is the position of the action in the actions array.
   */
  onActionSelected?: ?(position: number) => void,
  /**
   * Callback called when the icon is selected.
   */
  onIconClicked?: ?() => void,
  /**
   * Sets the overflow icon.
   */
  overflowIcon?: ?ImageSource,
  /**
   * Sets the toolbar subtitle.
   */
  subtitle?: ?string,
  /**
   * Sets the toolbar subtitle color.
   */
  subtitleColor?: ?ColorValue,
  /**
   * Sets the toolbar title.
   */
  title?: ?Stringish,
  /**
   * Sets the toolbar title color.
   */
  titleColor?: ?ColorValue,
  /**
   * Sets the content inset for the toolbar starting edge.
   *
   * The content inset affects the valid area for Toolbar content other than
   * the navigation button and menu. Insets define the minimum margin for
   * these components and can be used to effectively align Toolbar content
   * along well-known gridlines.
   */
  contentInsetStart?: ?number,
  /**
   * Sets the content inset for the toolbar ending edge.
   *
   * The content inset affects the valid area for Toolbar content other than
   * the navigation button and menu. Insets define the minimum margin for
   * these components and can be used to effectively align Toolbar content
   * along well-known gridlines.
   */
  contentInsetEnd?: ?number,
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
  rtl?: ?boolean,
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,
|}>;

type Props = $ReadOnly<{|
  ...ToolbarAndroidProps,
  forwardedRef: ?React.Ref<typeof NativeToolbar>,
|}>;

class ToolbarAndroid extends React.Component<Props> {
  _onSelect = (event: ToolbarAndroidChangeEvent) => {
    const position = event.nativeEvent.position;
    if (position === -1) {
      this.props.onIconClicked && this.props.onIconClicked();
    } else {
      this.props.onActionSelected && this.props.onActionSelected(position);
    }
  };

  render() {
    const {
      onIconClicked,
      onActionSelected,
      forwardedRef,
      ...otherProps
    } = this.props;

    const nativeProps: {...typeof otherProps, nativeActions?: Array<Action>} = {
      ...otherProps,
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
      const nativeActions = [];
      for (let i = 0; i < this.props.actions.length; i++) {
        const action = {
          icon: this.props.actions[i].icon,
          show: this.props.actions[i].show,
        };

        if (action.icon) {
          action.icon = resolveAssetSource(action.icon);
        }
        if (action.show) {
          action.show = UIManager.getViewManagerConfig(
            'ToolbarAndroid',
          ).Constants.ShowAsAction[action.show];
        }

        nativeActions.push({
          ...this.props.actions[i],
          ...action,
        });
      }

      nativeProps.nativeActions = nativeActions;
    }

    return (
      <NativeToolbar
        onSelect={this._onSelect}
        {...nativeProps}
        ref={forwardedRef}
      />
    );
  }
}

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
const ToolbarAndroidToExport = React.forwardRef(
  (
    props: ToolbarAndroidProps,
    forwardedRef: ?React.Ref<typeof NativeToolbar>,
  ) => {
    return <ToolbarAndroid {...props} forwardedRef={forwardedRef} />;
  },
);

module.exports = (ToolbarAndroidToExport: Class<
  NativeComponent<ToolbarAndroidProps>,
>);
