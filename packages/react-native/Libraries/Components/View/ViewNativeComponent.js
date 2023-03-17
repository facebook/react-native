/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  HostComponent,
  PartialViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import Platform from '../../Utilities/Platform';
import {type ViewProps as Props} from './ViewPropTypes';
import * as React from 'react';

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig =
  Platform.OS === 'android'
    ? {
        uiViewClassName: 'RCTView',
        validAttributes: {
          // ReactClippingViewManager @ReactProps
          removeClippedSubviews: true,

          // ReactViewManager @ReactProps
          accessible: true,
          hasTVPreferredFocus: true,
          nextFocusDown: true,
          nextFocusForward: true,
          nextFocusLeft: true,
          nextFocusRight: true,
          nextFocusUp: true,

          borderRadius: true,
          borderTopLeftRadius: true,
          borderTopRightRadius: true,
          borderBottomRightRadius: true,
          borderBottomLeftRadius: true,
          borderTopStartRadius: true,
          borderTopEndRadius: true,
          borderBottomStartRadius: true,
          borderBottomEndRadius: true,
          borderEndEndRadius: true,
          borderEndStartRadius: true,
          borderStartEndRadius: true,
          borderStartStartRadius: true,
          borderStyle: true,
          hitSlop: true,
          pointerEvents: true,
          nativeBackgroundAndroid: true,
          nativeForegroundAndroid: true,
          needsOffscreenAlphaCompositing: true,

          borderWidth: true,
          borderLeftWidth: true,
          borderRightWidth: true,
          borderTopWidth: true,
          borderBottomWidth: true,
          borderStartWidth: true,
          borderEndWidth: true,

          borderColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderLeftColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderRightColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderTopColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderBottomColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderStartColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderEndColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderBlockColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderBlockEndColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderBlockStartColor: {
            process: require('../../StyleSheet/processColor').default,
          },

          focusable: true,
          overflow: true,
          backfaceVisibility: true,
        },
      }
    : {
        uiViewClassName: 'RCTView',
      };

const ViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('RCTView', () => __INTERNAL_VIEW_CONFIG);

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
