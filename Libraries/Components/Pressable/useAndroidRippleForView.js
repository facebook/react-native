/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import invariant from 'invariant';
import {Commands} from '../View/ViewNativeComponent';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
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
  color?: ?ColorValue,
  borderless?: ?boolean,
  radius?: ?number,
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
  viewProps: $ReadOnly<{|
    nativeBackgroundAndroid: NativeBackgroundProp,
  |}>,
|}> {
  const {color, borderless, radius} = rippleConfig ?? {};
  const normalizedBorderless = borderless === true;

  return useMemo(() => {
    if (
      Platform.OS === 'android' &&
      Platform.Version >= 21 &&
      (color != null || normalizedBorderless || radius != null)
    ) {
      const processedColor = processColor(color);
      invariant(
        processedColor == null || typeof processedColor === 'number',
        'Unexpected color given for Ripple color',
      );

      return {
        viewProps: {
          // Consider supporting `nativeForegroundAndroid`
          nativeBackgroundAndroid: {
            type: 'RippleAndroid',
            color: processedColor,
            borderless: normalizedBorderless,
            rippleRadius: radius,
          },
        },
        onPressIn(event: PressEvent): void {
          const view = viewRef.current;
          if (view != null) {
            Commands.setPressed(view, true);
            Commands.hotspotUpdate(
              view,
              event.nativeEvent.locationX ?? 0,
              event.nativeEvent.locationY ?? 0,
            );
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
  }, [color, normalizedBorderless, radius, viewRef]);
}
