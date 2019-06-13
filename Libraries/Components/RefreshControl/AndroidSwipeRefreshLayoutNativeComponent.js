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

import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

const AndroidSwipeRefreshLayout = require('UIManager').getViewManagerConfig(
  'AndroidSwipeRefreshLayout',
);
const RefreshLayoutConsts = AndroidSwipeRefreshLayout
  ? AndroidSwipeRefreshLayout.Constants
  : {SIZE: {}};

type NativeProps = $ReadOnly<{|
  ...ViewProps,

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

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => mixed,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

type AndroidSwipeRefreshLayoutNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidSwipeRefreshLayout',
): any): AndroidSwipeRefreshLayoutNativeType);
