/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {
  Float,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  blurRadius: Float,
  blurRadius2?: WithDefault<Float, 0.001>,
  blurRadius3?: WithDefault<Float, 2.1>,
  blurRadius4?: WithDefault<Float, 0>,
  blurRadius5?: WithDefault<Float, 1>,
  blurRadius6?: WithDefault<Float, -0.0>,
  blurRadiusNullable?: WithDefault<Float, null>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'FloatPropsNativeComponentView',
): HostComponent<NativeProps>);
