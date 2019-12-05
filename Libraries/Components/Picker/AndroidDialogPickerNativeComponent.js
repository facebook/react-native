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

export default (requireNativeComponent<NativeProps>(
  'AndroidDialogPicker',
): NativeType);
