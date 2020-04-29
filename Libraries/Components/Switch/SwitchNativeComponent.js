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

import type {BubblingEventHandler, WithDefault} from '../../Types/CodegenTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';
<<<<<<< HEAD
import type {NativeOrDynamicColorType} from '../../Color/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';

type SwitchChangeEvent = $ReadOnly<{|
  value: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  value?: WithDefault<boolean, false>,
  tintColor?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  onTintColor?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  thumbTintColor?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)

  // Deprecated props
  thumbColor?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForFalse?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForTrue?: ?(ColorValue | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)

  // Events
  onChange?: ?BubblingEventHandler<SwitchChangeEvent>,
|}>;

export default (codegenNativeComponent<NativeProps>('Switch', {
  paperComponentName: 'RCTSwitch',
}): NativeComponentType<NativeProps>);
=======
import * as React from 'react';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';

type SwitchChangeEvent = $ReadOnly<{|
  value: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  value?: WithDefault<boolean, false>,
  tintColor?: ?ColorValue,
  onTintColor?: ?ColorValue,
  thumbTintColor?: ?ColorValue,

  // Deprecated props
  thumbColor?: ?ColorValue,
  trackColorForFalse?: ?ColorValue,
  trackColorForTrue?: ?ColorValue,

  // Events
  onChange?: ?BubblingEventHandler<SwitchChangeEvent>,
|}>;

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +setValue: (viewRef: React.ElementRef<ComponentType>, value: boolean) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setValue'],
});

export default (codegenNativeComponent<NativeProps>('Switch', {
  paperComponentName: 'RCTSwitch',
  excludedPlatform: 'android',
}): ComponentType);
>>>>>>> fb/0.62-stable
