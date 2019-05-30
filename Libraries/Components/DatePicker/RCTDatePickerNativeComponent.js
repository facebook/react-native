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
  initialDate?: ?Date,
  locale?: ?string,
  maximumDate?: ?number,
  minimumDate?: ?number,
  minuteInterval?: ?(1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30),
  mode?: ?('date' | 'time' | 'datetime'),
  onChange?: ?(event: Event) => void,
  timeZoneOffsetInMinutes?: ?number,
|}>;
type RCTDatePickerNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTDatePicker',
): any): RCTDatePickerNativeType);
