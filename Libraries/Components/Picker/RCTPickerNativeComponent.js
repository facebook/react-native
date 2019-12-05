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

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import * as React from 'react';

type PickerIOSChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    newValue: number | string,
    newIndex: number,
  |}>,
>;

type RCTPickerIOSItemType = $ReadOnly<{|
  label: ?Label,
  value: ?(number | string),
  textColor: ?number,
|}>;

type Label = Stringish | number;

type NativeProps = $ReadOnly<{|
  items: $ReadOnlyArray<RCTPickerIOSItemType>,
  onChange: (event: PickerIOSChangeEvent) => void,
  selectedIndex: number,
  style?: ?TextStyleProp,
  testID?: ?string,
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

const RCTPickerNativeComponent: ComponentType = requireNativeComponent<NativeProps>(
  'RCTPicker',
);

export default RCTPickerNativeComponent;
