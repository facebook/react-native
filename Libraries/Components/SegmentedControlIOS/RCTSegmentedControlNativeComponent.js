/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

<<<<<<< HEAD
import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';
=======
'use strict';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable
import type {ViewProps} from '../View/ViewPropTypes';
import type {
  BubblingEventHandler,
  WithDefault,
  Int32,
} from '../../Types/CodegenTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';

export type OnChangeEvent = $ReadOnly<{|
  value: Int32,
  selectedSegmentIndex: Int32,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  values?: $ReadOnlyArray<string>,
  selectedIndex?: WithDefault<Int32, 0>,
  enabled?: WithDefault<boolean, true>,
  tintColor?: ?ColorValue,
  momentary?: WithDefault<boolean, false>,

  // Events
  onChange?: ?BubblingEventHandler<OnChangeEvent>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'RCTSegmentedControl',
<<<<<<< HEAD
): NativeComponentType<NativeProps>);
=======
): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
