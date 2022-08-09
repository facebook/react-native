/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {PointValue} from '../../../../../Libraries/StyleSheet/StyleSheetTypes';
import type {ColorValue} from '../../../../../Libraries/StyleSheet/StyleSheet';
import type {ImageSource} from '../../../../../Libraries/Image/ImageSource';
import type {
  Int32,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';

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
  // TODO(T104760003) Fix EdgeInsetsValue in codegen
  // edgeInsets?: $ReadOnlyArray<EdgeInsetsValue>,
  sizes?: WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  object?: $ReadOnlyArray<$ReadOnly<{|prop: string|}>>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
): HostComponent<NativeProps>);
