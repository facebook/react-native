/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 */

'use strict';

<<<<<<< HEAD
=======
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import type {ImageSource} from '../../../../../Libraries/Image/ImageSource';
>>>>>>> fb/0.62-stable
import type {
  PointValue,
  ColorValue,
} from '../../../../../Libraries/StyleSheet/StyleSheetTypes';
<<<<<<< HEAD
import type {ImageSource} from '../../../../../Libraries/Image/ImageSource';
=======
>>>>>>> fb/0.62-stable
import type {
  Int32,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
<<<<<<< HEAD
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
=======
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable

type ObjectArrayPropType = $ReadOnly<{|
  array: $ReadOnlyArray<string>,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  objectProp?: $ReadOnly<{|
    stringProp?: WithDefault<string, ''>,
    booleanProp: boolean,
    floatProp: Float,
    intProp: Int32,
    stringEnumProp?: WithDefault<'small' | 'large', 'small'>,
<<<<<<< HEAD
=======
    intEnumProp?: WithDefault<0 | 1, 0>,
>>>>>>> fb/0.62-stable
  |}>,
  objectArrayProp: ObjectArrayPropType,
  objectPrimitiveRequiredProp: $ReadOnly<{|
    image: ImageSource,
    color?: ColorValue,
    point: ?PointValue,
  |}>,
|}>;

<<<<<<< HEAD
export default codegenNativeComponent<NativeProps>(
  'ObjectPropsNativeComponent',
);
=======
export default (codegenNativeComponent<NativeProps>(
  'ObjectPropsNativeComponent',
): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
