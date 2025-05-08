/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  ColorValue,
  HostComponent,
  ImageSource,
  PointValue,
  ViewProps,
} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  thumbImage?: ImageSource,
  color?: ColorValue,
  thumbTintColor?: ColorValue,
  point?: PointValue,
}>;

export default (codegenNativeComponent<NativeProps>(
  'MultiNativePropNativeComponentView',
): HostComponent<NativeProps>);
