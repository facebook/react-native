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

const requireNativeComponent = require('requireNativeComponent');

import type {SyntheticEvent} from 'CoreEventTypes';
import type {TextStyleProp} from 'StyleSheet';
import type {NativeComponent} from 'ReactNative';

type PickerAndroidChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

type Item = $ReadOnly<{|
  label: string,
  value: ?(number | string),
  color?: ?number,
|}>;

type NativeProps = $ReadOnly<{|
  enabled?: ?boolean,
  items: $ReadOnlyArray<Item>,
  mode?: ?('dialog' | 'dropdown'),
  onSelect?: (event: PickerAndroidChangeEvent) => void,
  selected: number,
  prompt?: ?string,
  testID?: string,
  style?: ?TextStyleProp,
  accessibilityLabel?: ?string,
|}>;

type DropdownPickerNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidDropdownPicker',
): any): DropdownPickerNativeType);
