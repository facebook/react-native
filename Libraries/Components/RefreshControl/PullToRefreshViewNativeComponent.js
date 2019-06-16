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

import type {BubblingEvent, WithDefault} from '../../Types/CodegenTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

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

// TODO: Switch this over to CodegenNativeComponent
// once the native components are renamed in paper and fabric
type PullToRefreshViewType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTRefreshControl',
): any): PullToRefreshViewType);
