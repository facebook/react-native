/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 * @format
 */

'use strict';

<<<<<<< HEAD
const {NativeComponent} = require('../../Renderer/shims/ReactNative');

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeOrDynamicColorType} from '../../Color/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

type SwitchChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    value: boolean,
  |}>,
>;
=======
import * as React from 'react';

import type {
  WithDefault,
  BubblingEventHandler,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type SwitchChangeEvent = $ReadOnly<{|
  value: boolean,
|}>;
>>>>>>> fb/0.62-stable

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
<<<<<<< HEAD
  disabled?: ?boolean,
  enabled?: ?boolean,
  thumbColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForFalse?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForTrue?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  value?: ?boolean,
  on?: ?boolean,
  thumbTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)

  // Events
  onChange?: ?(event: SwitchChangeEvent) => mixed,
|}>;

type SwitchNativeComponentType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidSwitch',
): any): SwitchNativeComponentType);
=======
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
>>>>>>> fb/0.62-stable
