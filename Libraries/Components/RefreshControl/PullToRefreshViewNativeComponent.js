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
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';

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
  title?: ?WithDefault<string, null>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?(event: BubblingEvent<null>) => mixed,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: WithDefault<boolean, false>,
|}>;

export default codegenNativeComponent<NativeProps>('PullToRefreshView', {
  paperComponentName: 'RCTRefreshControl',
});
