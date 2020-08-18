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

import type {WithDefault} from '../../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  alignment?: WithDefault<'top' | 'center' | 'bottom-right', 'center'>,
  intervals?: WithDefault<0 | 15 | 30 | 60, 0>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'EnumPropNativeComponentView',
): HostComponent<NativeProps>);
