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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

export type NativeProps = $ReadOnly<{|
  ...ViewProps,

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

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => mixed,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

type PullToRefreshView = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTRefreshControl',
): any): PullToRefreshView);
