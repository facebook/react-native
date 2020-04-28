/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

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

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
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
