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
<<<<<<< HEAD
import type {Float, WithDefault} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';
=======
import type {Double, WithDefault} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  //Props
  styleAttr?: string,
  typeAttr?: string,
  indeterminate: boolean,
<<<<<<< HEAD
  progress?: WithDefault<Float, 0>,
=======
  progress?: WithDefault<Double, 0>,
>>>>>>> fb/0.62-stable
  animating?: WithDefault<boolean, true>,
  color?: ?ColorValue,
  testID?: WithDefault<string, ''>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'AndroidProgressBar',
<<<<<<< HEAD
): NativeComponentType<NativeProps>);
=======
): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
