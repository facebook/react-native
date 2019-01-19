/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';
import type {ViewStyleProp} from 'StyleSheet';
import type {ColorValue} from 'StyleSheetTypes';

const requireNativeComponent = require('requireNativeComponent');

type NativeProps = $ReadOnly<{|
    ...ViewProps,
    style?: ?ViewStyleProp,
    value?: ?number,
    step?: ?number,
    minimumValue?: ?number,
    maximumValue?: ?number,
    minimumTrackTintColor?: ?ColorValue,
    maximumTrackTintColor?: ?ColorValue,
    disabled?: ?boolean,
    onValueChange?: ?(value: number) => void,
    onSlidingComplete?: ?(value: number) => void,
    testID?: ?string,
|}>;

type RCTSliderType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent('RCTSlider'): any): RCTSliderType;
