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

import ReactNative from '../../../react-native/Libraries/Renderer/shims/ReactNative';
import * as React from 'react';
import {UIManager, requireNativeComponent} from 'react-native';

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
    UIManager.getViewManagerConfig(
      'RNTMyLegacyNativeView',
    ).Commands.changeBackgroundColor.toString(),
    [color],
  );
}

export function callNativeMethodToAddOverlays(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
  overlayColors: $ReadOnlyArray<string>,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  UIManager.dispatchViewManagerCommand(
    ReactNative.findNodeHandle(viewRef),
    UIManager.getViewManagerConfig(
      'RNTMyLegacyNativeView',
    ).Commands.addOverlays.toString(),
    [overlayColors],
  );
}

export function callNativeMethodToRemoveOverlays(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  UIManager.dispatchViewManagerCommand(
    ReactNative.findNodeHandle(viewRef),
    UIManager.getViewManagerConfig(
      'RNTMyLegacyNativeView',
    ).Commands.removeOverlays.toString(),
    [],
  );
}

export default (requireNativeComponent(
  'RNTMyLegacyNativeView',
): HostComponent<NativeProps>);
