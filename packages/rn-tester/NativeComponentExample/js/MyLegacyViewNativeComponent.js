/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import {requireNativeComponent, UIManager} from 'react-native';
import ReactNative from '../../../react-native/Libraries/Renderer/shims/ReactNative';

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

export function callNativeMethodToChangeBackgroundColor(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
  color: string,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  UIManager.dispatchViewManagerCommand(
    ReactNative.findNodeHandle(viewRef),
    UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Commands
      .changeBackgroundColor,
    [color],
  );
}

export default (requireNativeComponent(
  'RNTMyLegacyNativeView',
): HostComponent<NativeProps>);
