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
  WithDefault,
  Float,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  blurRadius: Float,
  blurRadius2?: WithDefault<Float, 0.001>,
  blurRadius3?: WithDefault<Float, 2.1>,
  blurRadius4?: WithDefault<Float, 0>,
  blurRadius5?: WithDefault<Float, 1>,
  blurRadius6?: WithDefault<Float, -0.0>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'FloatPropsNativeComponentView',
): NativeComponentType<NativeProps>);
