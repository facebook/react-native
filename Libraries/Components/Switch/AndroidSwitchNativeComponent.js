/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {
  BubblingEventHandler,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import * as React from 'react';

type SwitchChangeEvent = $ReadOnly<{|
  value: boolean,
  target: Int32,
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

type NativeType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeValue: (
    viewRef: React.ElementRef<NativeType>,
    value: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeValue'],
});

export default (codegenNativeComponent<NativeProps>('AndroidSwitch', {
  interfaceOnly: true,
}): NativeType);
