/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {CodegenTypes, HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {ColorValue} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  DimensionValue,
  EdgeInsetsValue,
  PointValue,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

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
