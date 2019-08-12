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
  Int32,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  progress1?: WithDefault<Int32, 0>,
  progress2?: WithDefault<Int32, -1>,
  progress3?: WithDefault<Int32, 10>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'IntegerPropNativeComponentView',
): NativeComponentType<NativeProps>);
