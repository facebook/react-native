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

const requireNativeComponent = require('requireNativeComponent');

import type {SyntheticEvent} from 'CoreEventTypes';
import type {ImageSource} from 'ImageSource';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

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

type NativeProps = $ReadOnly<{|
  onSelect: (event: ToolbarAndroidChangeEvent) => mixed,
  nativeActions?: Array<Action>,
|}>;

type ColorValue = null | string;

type ToolbarAndroidProps = $ReadOnly<{|
  ...ViewProps,
  ...NativeProps,
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

type NativeToolbarAndroidProps = Class<NativeComponent<ToolbarAndroidProps>>;

module.exports = ((requireNativeComponent(
  'ToolbarAndroid',
): any): NativeToolbarAndroidProps);
