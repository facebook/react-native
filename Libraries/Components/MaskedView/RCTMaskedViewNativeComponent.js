/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../View/ViewPropTypes';
import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
<<<<<<< HEAD
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';
=======
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable

type NativeProps = $ReadOnly<{|
  ...ViewProps,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'RCTMaskedView',
<<<<<<< HEAD
): NativeComponentType<NativeProps>);
=======
): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
