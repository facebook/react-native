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

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';

import type {
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: WithDefault<boolean, false>,
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
   *
   * This type isn't currently accurate. It really is specific numbers
   * hard coded in the Android platform.
   *
   * Also, 1 isn't actually a safe default. We are able to set this here
   * because native code isn't currently consuming the generated artifact.
   * This will end up being
   * size?: WithDefault<'default' | 'large', 'default'>,
   */
  size?: WithDefault<Int32, 1>,
  /**
   * Progress view top offset
   */
  progressViewOffset?: WithDefault<Float, 0>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?DirectEventHandler<null>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

export default codegenNativeComponent<NativeProps>('AndroidSwipeRefreshLayout');
