/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';

import processColor from '../../StyleSheet/processColor';
import Platform from '../../Utilities/Platform';
import View from '../View/View';
import {Commands} from '../View/ViewNativeComponent';
import invariant from 'invariant';
import * as React from 'react';
import {useMemo} from 'react';

type NativeBackgroundProp = $ReadOnly<{
  type: 'RippleAndroid',
  color: ?number,
  borderless: boolean,
  rippleRadius: ?number,
}>;

export type PressableAndroidRippleConfig = {
  color?: ColorValue,
  borderless?: boolean,
  radius?: number,
  foreground?: boolean,
};

/**
 * Provides the event handlers and props for configuring the ripple effect on
 * supported versions of Android.
 */
export default function useAndroidRippleForView(
  rippleConfig: ?PressableAndroidRippleConfig,
  viewRef: {current: null | React.ElementRef<typeof View>},
): ?$ReadOnly<{
  onPressIn: (event: GestureResponderEvent) => void,
  onPressMove: (event: GestureResponderEvent) => void,
  onPressOut: (event: GestureResponderEvent) => void,
  viewProps:
    | $ReadOnly<{nativeBackgroundAndroid: NativeBackgroundProp}>
    | $ReadOnly<{nativeForegroundAndroid: NativeBackgroundProp}>,
}> {
  const {color, borderless, radius, foreground} = rippleConfig ?? {};

  return useMemo(() => {
    if (
      Platform.OS === 'android' &&
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
            ? // $FlowFixMe[incompatible-return]
              {nativeForegroundAndroid: nativeRippleValue}
            : // $FlowFixMe[incompatible-return]
              {nativeBackgroundAndroid: nativeRippleValue},
        onPressIn(event: GestureResponderEvent): void {
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
        onPressMove(event: GestureResponderEvent): void {
          const view = viewRef.current;
          if (view != null) {
            Commands.hotspotUpdate(
              view,
              event.nativeEvent.locationX ?? 0,
              event.nativeEvent.locationY ?? 0,
            );
          }
        },
        onPressOut(event: GestureResponderEvent): void {
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
