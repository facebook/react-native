/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import {requireNativeComponent} from 'react-native';

type ColorChangedEvent = {
  nativeEvent: {
    backgroundColor: {
      hue: number,
      saturation: number,
      brightness: number,
      alpha: number,
    },
  },
};

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  opacity?: number,
  color?: string,
  onColorChanged?: (event: ColorChangedEvent) => void,
|}>;

export type MyLegacyViewType = HostComponent<NativeProps>;

export default (requireNativeComponent(
  'RNTMyLegacyNativeView',
): HostComponent<NativeProps>);
