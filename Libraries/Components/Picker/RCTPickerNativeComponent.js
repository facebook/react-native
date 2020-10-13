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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');
const ReactNativeViewConfigRegistry = require('../../Renderer/shims/ReactNativeViewConfigRegistry');

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {ProcessedColorValue} from '../../StyleSheet/processColor';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import RCTPickerViewConfig from './RCTPickerViewConfig';
import * as React from 'react';

type PickerIOSChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    newValue: number | string,
    newIndex: number,
  |}>,
>;

type RCTPickerIOSItemType = $ReadOnly<{|
  label: ?Label,
  value: ?string,
  textColor: ?ProcessedColorValue,
|}>;

type Label = Stringish | number;

type NativeProps = $ReadOnly<{|
  items: $ReadOnlyArray<RCTPickerIOSItemType>,
  onChange: (event: PickerIOSChangeEvent) => void,
  selectedIndex: number,
  style?: ?TextStyleProp,
  testID?: ?string,
  accessibilityLabel?: ?string,
|}>;

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeSelectedIndex: (
    viewRef: React.ElementRef<ComponentType>,
    index: number,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeSelectedIndex'],
});

let RCTPickerNativeComponent;
if (global.RN$Bridgeless) {
  ReactNativeViewConfigRegistry.register('RCTPicker', () => {
    return RCTPickerViewConfig;
  });
  RCTPickerNativeComponent = 'RCTPicker';
} else {
  RCTPickerNativeComponent = requireNativeComponent<NativeProps>('RCTPicker');
}

// flowlint-next-line unclear-type:off
export default ((RCTPickerNativeComponent: any): HostComponent<NativeProps>);
