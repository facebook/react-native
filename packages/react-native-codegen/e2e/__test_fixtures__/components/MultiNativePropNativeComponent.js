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
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  thumbImage?: ImageSource,
  color?: ColorValue,
  thumbTintColor?: ColorValue,
  point?: PointValue,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'MultiNativePropNativeComponentView',
): NativeComponentType<NativeProps>);
