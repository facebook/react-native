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

import type {ColorValue} from 'StyleSheetTypes';
import type {ImageSource} from 'ImageSource';
import type {NativeComponent} from 'ReactNative';
import type {SyntheticEvent} from 'CoreEventTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {ViewStyleProp} from 'StyleSheet';

type Event = SyntheticEvent<
  $ReadOnly<{|
    value: number,
    fromUser?: boolean,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  disabled?: ?boolean,
  enabled?: ?boolean,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: ?number,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: ?number,
  onChange?: ?(event: Event) => void,
  onSlidingComplete?: ?(event: Event) => void,
  onValueChange?: ?(event: Event) => void,
  step?: ?number,
  testID?: ?string,
  thumbImage?: ?ImageSource,
  thumbTintColor?: ?ColorValue,
  trackImage?: ?ImageSource,
  value?: ?number,
|}>;

type RCTSliderType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent('RCTSlider'): any): RCTSliderType);
