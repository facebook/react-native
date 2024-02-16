/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {WithDefault} from '../../../../Libraries/Types/CodegenTypes';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  name?: WithDefault<string, ''>,
|}>;

// NOTE: This component is not implemented in paper
// Do not require this file in paper builds
export default (codegenNativeComponent<NativeProps>(
  'UnimplementedNativeView',
): HostComponent<NativeProps>);
