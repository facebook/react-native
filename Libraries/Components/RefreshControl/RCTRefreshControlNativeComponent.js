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

const Platform = require('Platform');
const requireNativeComponent = require('requireNativeComponent');

import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

let RefreshLayoutConsts;
if (Platform.OS === 'android') {
  const AndroidSwipeRefreshLayout = require('UIManager').getViewManagerConfig(
    'AndroidSwipeRefreshLayout',
  );
  RefreshLayoutConsts = AndroidSwipeRefreshLayout
    ? AndroidSwipeRefreshLayout.Constants
    : {SIZE: {}};
} else {
  RefreshLayoutConsts = {SIZE: {}};
}

type IOSProps = $ReadOnly<{|
  /**
   * The color of the refresh indicator.
   */
  tintColor?: ?ColorValue,
  /**
   * Title color.
   */
  titleColor?: ?ColorValue,
  /**
   * The title displayed under the refresh indicator.
   */
  title?: ?string,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: ?boolean,
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ?$ReadOnlyArray<ColorValue>,
  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ?ColorValue,
  /**
   * Size of the refresh indicator, see RefreshControl.SIZE.
   */
  size?: ?(
    | typeof RefreshLayoutConsts.SIZE.DEFAULT
    | typeof RefreshLayoutConsts.SIZE.LARGE
  ),
  /**
   * Progress view top offset
   */
  progressViewOffset?: ?number,
|}>;

export type NativeProps = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => mixed,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

type RCTRefreshControlNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTRefreshControl',
): any): RCTRefreshControlNativeType);
