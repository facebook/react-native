/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// [macOS]

'use strict';

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

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
type RCTDatePickerNativeType = HostComponent<NativeProps>;

module.exports = ((requireNativeComponent(
  'RCTDatePicker',
): any): RCTDatePickerNativeType);
