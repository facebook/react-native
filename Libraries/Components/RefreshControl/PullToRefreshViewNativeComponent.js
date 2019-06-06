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

import type {
  BubblingEvent,
  WithDefault,
  CodegenNativeComponent,
} from '../../Types/CodegenTypes';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type NativeProps = $ReadOnly<{|
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
  title?: ?WithDefault<string, ''>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?(event: BubblingEvent<null>) => mixed,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: WithDefault<boolean, false>,
|}>;

type PullToRefreshViewType = CodegenNativeComponent<
  'PullToRefreshView',
  NativeProps,
>;

// TODO: Switch this over to require('./PullToRefreshNativeViewConfig')
// once the native components are renamed in paper and fabric
module.exports = ((requireNativeComponent(
  'RCTRefreshControl',
): any): PullToRefreshViewType);
