/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// TODO(macOS ISS#2323203)

'use strict';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type Event = SyntheticEvent<
  $ReadOnly<{|
    timestamp: number,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  date?: ?number,
  maximumDate?: ?number,
  minimumDate?: ?number,
  mode?: ?('single' | 'range'),
  onDateChange?: ?(event: Event) => void,
  pickerStyle?: ?['textfield-stepper', 'clock-calendar', 'textfield'],
  timeZoneOffsetInMinutes?: ?number,
|}>;
type RCTDatePickerNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTDatePicker',
): any): RCTDatePickerNativeType);
