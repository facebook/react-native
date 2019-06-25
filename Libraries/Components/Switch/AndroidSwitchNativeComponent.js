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
  thumbColor?: ?string,
  trackColorForFalse?: ?string,
  trackColorForTrue?: ?string,
  value?: ?boolean,
  on?: ?boolean,
  thumbTintColor?: ?string,
  trackTintColor?: ?string,

  // Events
  onChange?: ?(event: SwitchChangeEvent) => mixed,
|}>;

type SwitchNativeComponentType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidSwitch',
): any): SwitchNativeComponentType);
