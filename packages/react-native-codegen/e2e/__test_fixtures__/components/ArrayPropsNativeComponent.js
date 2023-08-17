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
  DimensionValue,
  EdgeInsetsValue,
  PointValue,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import type {ColorValue} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {
  Int32,
  Float,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  names?: $ReadOnlyArray<string>,
  disableds?: $ReadOnlyArray<boolean>,
  progress?: $ReadOnlyArray<Int32>,
  radii?: $ReadOnlyArray<Float>,
  colors?: $ReadOnlyArray<ColorValue>,
  srcs?: $ReadOnlyArray<ImageSource>,
  points?: $ReadOnlyArray<PointValue>,
  edgeInsets?: $ReadOnlyArray<EdgeInsetsValue>,
  dimensions?: $ReadOnlyArray<DimensionValue>,
  sizes?: WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  object?: $ReadOnlyArray<$ReadOnly<{|prop: string|}>>,
  arrayOfObjects?: $ReadOnlyArray<$ReadOnly<{|prop1: Float, prop2: Int32|}>>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
): HostComponent<NativeProps>);
