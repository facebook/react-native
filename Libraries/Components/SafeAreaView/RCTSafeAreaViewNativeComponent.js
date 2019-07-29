/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from '../View/ViewPropTypes';
import type {WithDefault} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  emulateUnlessSupported?: WithDefault<boolean, false>,
|}>;

export default codegenNativeComponent<NativeProps>('RCTSafeAreaView');
