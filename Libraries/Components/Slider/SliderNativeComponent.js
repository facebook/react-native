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

import type {
  Float,
  BubblingEvent,
  DirectEvent,
  WithDefault,
  CodegenNativeComponent,
} from '../../Types/CodegenTypes';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ImageSource} from '../../Image/ImageSource';
import type {ViewProps} from '../View/ViewPropTypes';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

type Event = $ReadOnly<{|
  value: Float,
  fromUser?: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: ?WithDefault<boolean, false>,
  enabled?: ?WithDefault<boolean, false>,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: ?WithDefault<Float, 1>,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: ?WithDefault<Float, 0>,
  step?: ?WithDefault<Float, 0>,
  testID?: ?WithDefault<string, ''>,
  thumbImage?: ?ImageSource,
  thumbTintColor?: ?ColorValue,
  trackImage?: ?ImageSource,
  value: ?WithDefault<Float, 0>,

  // Events
  onChange?: ?(event: BubblingEvent<Event>) => void,
  onValueChange?: ?(event: BubblingEvent<Event>) => void,
  onSlidingComplete?: ?(event: DirectEvent<Event>) => void,
|}>;

type Options = {
  interfaceOnly: true,
  isDeprecatedPaperComponentNameRCT: true,
};

type SliderType = CodegenNativeComponent<'Slider', NativeProps, Options>;

module.exports = ((requireNativeComponent('RCTSlider'): any): SliderType);
