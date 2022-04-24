/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import invariant from 'invariant';
import {Commands} from '../View/ViewNativeComponent';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {PressEvent} from '../../Types/CoreEventTypes';
import {Platform, View, processColor} from 'react-native';
import * as React from 'react';
import {useMemo} from 'react';

type NativeBackgroundProp = $ReadOnly<{|
  type: 'RippleAndroid',
  color: ?number,
  borderless: boolean,
  rippleRadius: ?number,
|}>;

export type RippleConfig = {|
  color?: ColorValue,
  borderless?: boolean,
  radius?: number,
  foreground?: boolean,
|};

/**
 * Provides the event handlers and props for configuring the ripple effect on
 * supported versions of Android.
 */
export default function useAndroidRippleForView(
  rippleConfig: ?RippleConfig,
  viewRef: {|current: null | React.ElementRef<typeof View>|},
): ?$ReadOnly<{|
  onPressIn: (event: PressEvent) => void,
  onPressMove: (event: PressEvent) => void,
  onPressOut: (event: PressEvent) => void,
  viewProps:
    | $ReadOnly<{|nativeBackgroundAndroid: NativeBackgroundProp|}>
    | $ReadOnly<{|nativeForegroundAndroid: NativeBackgroundProp|}>,
|}> {
  const {color, borderless, radius, foreground} = rippleConfig ?? {};

  return useMemo(() => {
    if (
      Platform.OS === 'android' &&
      Platform.Version >= 21 &&
      (color != null || borderless != null || radius != null)
    ) {
      const processedColor = processColor(color);
      invariant(
        processedColor == null || typeof processedColor === 'number',
        'Unexpected color given for Ripple color',
      );

      const nativeRippleValue = {
        type: 'RippleAndroid',
        color: processedColor,
        borderless: borderless === true,
        rippleRadius: radius,
      };

      return {
        viewProps:
          foreground === true
            ? {nativeForegroundAndroid: nativeRippleValue}
            : {nativeBackgroundAndroid: nativeRippleValue},
        onPressIn(event: PressEvent): void {
          const view = viewRef.current;
          if (view != null) {
            Commands.hotspotUpdate(
              view,
              event.nativeEvent.locationX ?? 0,
              event.nativeEvent.locationY ?? 0,
            );
            Commands.setPressed(view, true);
          }
        },
        onPressMove(event: PressEvent): void {
          const view = viewRef.current;
          if (view != null) {
            Commands.hotspotUpdate(
              view,
              event.nativeEvent.locationX ?? 0,
              event.nativeEvent.locationY ?? 0,
            );
          }
        },
        onPressOut(event: PressEvent): void {
          const view = viewRef.current;
          if (view != null) {
            Commands.setPressed(view, false);
          }
        },
      };
    }
    return null;
  }, [borderless, color, foreground, radius, viewRef]);
}
