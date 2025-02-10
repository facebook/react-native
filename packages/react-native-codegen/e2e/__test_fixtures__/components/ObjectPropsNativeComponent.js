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
import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {ColorValue} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {PointValue} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import type {
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type ObjectArrayPropType = $ReadOnly<{
  array: $ReadOnlyArray<string>,
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  objectProp?: $ReadOnly<{
    stringProp?: WithDefault<string, ''>,
    booleanProp: boolean,
    floatProp: Float,
    intProp: Int32,
    stringEnumProp?: WithDefault<'small' | 'large', 'small'>,
    intEnumProp?: WithDefault<0 | 1, 0>,
  }>,
  objectArrayProp: ObjectArrayPropType,
  objectPrimitiveRequiredProp: $ReadOnly<{
    image: ImageSource,
    color?: ColorValue,
    point: ?PointValue,
  }>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'ObjectPropsNativeComponent',
): HostComponent<NativeProps>);
