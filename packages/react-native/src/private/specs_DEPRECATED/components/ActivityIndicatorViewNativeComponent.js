/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {ColorValue} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {WithDefault} from '../../../../Libraries/Types/CodegenTypes';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  /**
   * Whether the indicator should hide when not animating (true by default).
   *
   * See https://reactnative.dev/docs/activityindicator#hideswhenstopped-ios
   */
  hidesWhenStopped?: WithDefault<boolean, true>,

  /**
   * Whether to show the indicator (true, the default) or hide it (false).
   *
   * See https://reactnative.dev/docs/activityindicator#animating
   */
  animating?: WithDefault<boolean, true>,

  /**
   * The foreground color of the spinner (default is gray).
   *
   * See https://reactnative.dev/docs/activityindicator#color
   */
  color?: ?ColorValue,

  /**
   * Size of the indicator (default is 'small').
   * Passing a number to the size prop is only supported on Android.
   *
   * See https://reactnative.dev/docs/activityindicator#size
   */
  size?: WithDefault<'small' | 'large', 'small'>,
}>;

export default (codegenNativeComponent<NativeProps>('ActivityIndicatorView', {
  paperComponentName: 'RCTActivityIndicatorView',
}): HostComponent<NativeProps>);
