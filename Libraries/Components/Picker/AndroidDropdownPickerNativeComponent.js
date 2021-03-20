/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';

import type {
  DirectEventHandler,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ProcessedColorValue} from '../../StyleSheet/processColor';
import type {ViewProps} from '../../Components/View/ViewPropTypes';

type PickerItem = $ReadOnly<{|
  label: string,
  color?: ?ProcessedColorValue,
|}>;

type PickerItemSelectEvent = $ReadOnly<{|
  position: Int32,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  style?: ?TextStyleProp,

  // Props
  color?: ?ColorValue,
  backgroundColor?: ?ColorValue,
  enabled?: WithDefault<boolean, true>,
  items: $ReadOnlyArray<PickerItem>,
  prompt?: WithDefault<string, ''>,
  selected: Int32,

  // Events
  onSelect?: DirectEventHandler<PickerItemSelectEvent>,
|}>;

interface NativeCommands {
  +setNativeSelectedPosition: (
    viewRef: React.ElementRef<typeof AndroidDropdownPickerNativeComponent>,
    index: number,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeSelectedPosition'],
});

const AndroidDropdownPickerNativeComponent: HostComponent<NativeProps> = NativeComponentRegistry.get<NativeProps>(
  'AndroidDropdownPicker',
  () => ({
    uiViewClassName: 'AndroidDropdownPicker',
    bubblingEventTypes: {},
    directEventTypes: {},
    validAttributes: {
      color: {process: require('../../StyleSheet/processColor')},
      backgroundColor: {process: require('../../StyleSheet/processColor')},
      enabled: true,
      items: true,
      prompt: true,
      selected: true,
      onSelect: true,
    },
  }),
);

export default AndroidDropdownPickerNativeComponent;
