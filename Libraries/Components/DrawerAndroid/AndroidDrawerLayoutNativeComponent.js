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

import type {NativeComponent} from 'ReactNative';
import type {SyntheticEvent} from 'CoreEventTypes';
import type {ViewStyleProp} from 'StyleSheet';
import type React from 'React';

type ColorValue = null | string;

type DrawerStates = 'Idle' | 'Dragging' | 'Settling';

type DrawerStateEvent = SyntheticEvent<
  $ReadOnly<{|
    drawerState: number,
  |}>,
>;

type DrawerSlideEvent = SyntheticEvent<
  $ReadOnly<{|
    offset: number,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default), drags do not dismiss the keyboard.
   *   - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: ?('none' | 'on-drag'),

  /**
   * Specifies the background color of the drawer. The default value is white.
   * If you want to set the opacity of the drawer, use rgba. Example:
   *
   * ```
   * return (
   *   <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
   *   </DrawerLayoutAndroid>
   * );
   * ```
   */
  drawerBackgroundColor: ColorValue,

  /**
   * Specifies the side of the screen from which the drawer will slide in.
   */
  drawerPosition: ?number,

  /**
   * Specifies the width of the drawer, more precisely the width of the view that be pulled in
   * from the edge of the window.
   */
  drawerWidth?: ?number,

  /**
   * Specifies the lock mode of the drawer. The drawer can be locked in 3 states:
   * - unlocked (default), meaning that the drawer will respond (open/close) to touch gestures.
   * - locked-closed, meaning that the drawer will stay closed and not respond to gestures.
   * - locked-open, meaning that the drawer will stay opened and not respond to gestures.
   * The drawer may still be opened and closed programmatically (`openDrawer`/`closeDrawer`).
   */
  drawerLockMode?: ?('unlocked' | 'locked-closed' | 'locked-open'),

  /**
   * Function called whenever there is an interaction with the navigation view.
   */
  onDrawerSlide?: ?(event: DrawerSlideEvent) => mixed,

  /**
   * Function called when the drawer state has changed. The drawer can be in 3 states:
   * - Idle, meaning there is no interaction with the navigation view happening at the time
   * - Dragging, meaning there is currently an interaction with the navigation view
   * - Settling, meaning that there was an interaction with the navigation view, and the
   * navigation view is now finishing its closing or opening animation
   */
  onDrawerStateChanged?: ?(state: DrawerStateEvent) => mixed,

  /**
   * Function called whenever the navigation view has been opened.
   */
  onDrawerOpen?: ?() => mixed,

  /**
   * Function called whenever the navigation view has been closed.
   */
  onDrawerClose?: ?() => mixed,

  /**
   * The navigation view that will be rendered to the side of the screen and can be pulled in.
   */
  renderNavigationView: () => React.Element<any>,

  /**
   * Make the drawer take the entire screen and draw the background of the
   * status bar to allow it to open over the status bar. It will only have an
   * effect on API 21+.
   */
  statusBarBackgroundColor?: ?ColorValue,

  children?: React.Node,
  style?: ?ViewStyleProp,
|}>;

type AndroidDrawerLayoutNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidDrawerLayout',
): any): AndroidDrawerLayoutNativeType);
