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

import type {
  PointValue,
  ColorValue,
} from '../../../../../Libraries/StyleSheet/StyleSheetTypes';
import type {ImageSource} from '../../../../../Libraries/Image/ImageSource';
import type {
  Int32,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';

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
  sizes?: WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  object?: $ReadOnlyArray<$ReadOnly<{|prop: string|}>>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
): NativeComponentType<NativeProps>);
