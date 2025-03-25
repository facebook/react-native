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
  CodegenTypes,
  ColorValue,
  DimensionValue,
  EdgeInsetsValue,
  HostComponent,
  ImageSource,
  PointValue,
  ViewProps,
} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  names?: $ReadOnlyArray<string>,
  disableds?: $ReadOnlyArray<boolean>,
  progress?: $ReadOnlyArray<CodegenTypes.Int32>,
  radii?: $ReadOnlyArray<CodegenTypes.Float>,
  colors?: $ReadOnlyArray<ColorValue>,
  srcs?: $ReadOnlyArray<ImageSource>,
  points?: $ReadOnlyArray<PointValue>,
  edgeInsets?: $ReadOnlyArray<EdgeInsetsValue>,
  dimensions?: $ReadOnlyArray<DimensionValue>,
  sizes?: CodegenTypes.WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  object?: $ReadOnlyArray<$ReadOnly<{prop: string}>>,
  arrayOfObjects?: $ReadOnlyArray<
    $ReadOnly<{prop1: CodegenTypes.Float, prop2: CodegenTypes.Int32}>,
  >,
  arrayOfMixed?: $ReadOnlyArray<CodegenTypes.UnsafeMixed>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
): HostComponent<NativeProps>);
