/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {requireNativeComponent} from 'react-native';

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

type ReactPicker = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidDropdownPicker',
): any): ReactPicker);
