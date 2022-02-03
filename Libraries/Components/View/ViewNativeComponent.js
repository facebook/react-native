/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import {type HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import Platform from '../../Utilities/Platform';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import ReactNativeViewViewConfigAndroid from './ReactNativeViewViewConfigAndroid';
import {type ViewProps as Props} from './ViewPropTypes';
import * as React from 'react';

const ViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('RCTView', () =>
    Platform.OS === 'android'
      ? ReactNativeViewViewConfigAndroid
      : {uiViewClassName: 'RCTView'},
  );

interface NativeCommands {
  +hotspotUpdate: (
    viewRef: React.ElementRef<HostComponent<mixed>>,
    x: number,
    y: number,
  ) => void;
  +setPressed: (
    viewRef: React.ElementRef<HostComponent<mixed>>,
    pressed: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate', 'setPressed'],
});

export default ViewNativeComponent;

export type ViewNativeComponentType = HostComponent<Props>;
