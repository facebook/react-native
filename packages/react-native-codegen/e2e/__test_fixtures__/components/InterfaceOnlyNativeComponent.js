/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  BubblingEventHandler,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  title?: WithDefault<string, ''>,

  // Events
  onChange?: ?BubblingEventHandler<$ReadOnly<{|value: boolean|}>>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'InterfaceOnlyNativeComponentView',
  {
    interfaceOnly: true,
    paperComponentName: 'RCTInterfaceOnlyComponent',
  },
): HostComponent<NativeProps>);
