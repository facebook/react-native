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

import type {
  BubblingEventHandler,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
<<<<<<< HEAD
import {type NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';
=======
import type {HostComponent} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
<<<<<<< HEAD
  accessibilityHint?: WithDefault<string, ''>,
=======
  title?: WithDefault<string, ''>,
>>>>>>> fb/0.62-stable

  // Events
  onChange?: ?BubblingEventHandler<$ReadOnly<{|value: boolean|}>>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'InterfaceOnlyNativeComponentView',
  {
    interfaceOnly: true,
    paperComponentName: 'RCTInterfaceOnlyComponent',
  },
<<<<<<< HEAD
): NativeComponentType<NativeProps>);
=======
): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
