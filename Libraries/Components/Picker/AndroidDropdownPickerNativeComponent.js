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

<<<<<<< HEAD
import {requireNativeComponent} from 'react-native';
import type {NativeOrDynamicColorType} from '../../Color/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

import type {
  DirectEventHandler,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';
import type {ViewProps} from '../../Components/View/ViewPropTypes';

type PickerItem = $ReadOnly<{|
  label: string,
  color?: ?Int32 | ?NativeOrDynamicColorType, // TODO(macOS ISS#2323203)
=======
import * as React from 'react';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import requireNativeComponent from '../../ReactNative/requireNativeComponent';

import type {
  DirectEventHandler,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../../Components/View/ViewPropTypes';

type PickerItem = $ReadOnly<{|
  label: string,
  color?: ?Int32,
>>>>>>> fb/0.62-stable
|}>;

type PickerItemSelectEvent = $ReadOnly<{|
  position: Int32,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  style?: ?TextStyleProp,

  // Props
  color?: ?ColorValue,
  enabled?: WithDefault<boolean, true>,
  items: $ReadOnlyArray<PickerItem>,
  prompt?: WithDefault<string, ''>,
  selected: Int32,

  // Events
  onSelect?: DirectEventHandler<PickerItemSelectEvent>,
|}>;

<<<<<<< HEAD
type ReactPicker = Class<NativeComponent<NativeProps>>;
=======
type NativeType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeSelectedPosition: (
    viewRef: React.ElementRef<NativeType>,
    index: number,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeSelectedPosition'],
});
>>>>>>> fb/0.62-stable

export default (requireNativeComponent<NativeProps>(
  'AndroidDropdownPicker',
<<<<<<< HEAD
): any): ReactPicker);
=======
): NativeType);
>>>>>>> fb/0.62-stable
