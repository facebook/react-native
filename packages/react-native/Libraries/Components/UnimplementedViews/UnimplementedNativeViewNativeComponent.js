/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {WithDefault} from '../../Types/CodegenTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  name?: WithDefault<string, ''>,
|}>;

// NOTE: This component is not implemented in paper
// Do not require this file in paper builds
export default (codegenNativeComponent<NativeProps>(
  'UnimplementedNativeView',
): HostComponent<NativeProps>);
