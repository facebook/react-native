/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {Double, WithDefault} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  //Props
  styleAttr?: string,
  typeAttr?: string,
  indeterminate: boolean,
  progress?: WithDefault<Double, 0>,
  animating?: WithDefault<boolean, true>,
  color?: ?ColorValue,
  testID?: WithDefault<string, ''>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'AndroidProgressBar',
): HostComponent<NativeProps>);
