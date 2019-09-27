/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {
  WithDefault,
  BubblingEventHandler,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type SwitchChangeEvent = $ReadOnly<{|
  value: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  enabled?: WithDefault<boolean, true>,
  thumbColor?: ?ColorValue,
  trackColorForFalse?: ?ColorValue,
  trackColorForTrue?: ?ColorValue,
  value?: WithDefault<boolean, false>,
  on?: WithDefault<boolean, false>,
  thumbTintColor?: ?ColorValue,
  trackTintColor?: ?ColorValue,

  // Events
  onChange?: BubblingEventHandler<SwitchChangeEvent>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'AndroidSwitch',
): HostComponent<NativeProps>);
