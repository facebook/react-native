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

import * as React from 'react';
import {useMemo, useState, useRef, useImperativeHandle} from 'react';
import useAndroidRippleForView, {
  type RippleConfig,
} from './useAndroidRippleForView';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from '../View/ViewAccessibility';
import usePressability from '../../Pressability/usePressability';
import {normalizeRect, type RectOrSize} from '../../StyleSheet/Rect';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {LayoutEvent, PressEvent} from '../../Types/CoreEventTypes';
import View from '../View/View';

type ViewStyleProp = $ElementType<React.ElementConfig<typeof View>, 'style'>;

export type StateCallbackType = $ReadOnly<{|
  pressed: boolean,
|}>;

type Props = $ReadOnly<{|
  /**
   * Accessibility.
   */
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  accessibilityElementsHidden?: ?boolean,
  accessibilityHint?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityLabel?: ?Stringish,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  accessibilityRole?: ?AccessibilityRole,
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,
  accessibilityViewIsModal?: ?boolean,
  accessible?: ?boolean,
  focusable?: ?boolean,
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,

  /**
   * Either children or a render prop that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children: React.Node | ((state: StateCallbackType) => React.Node),

  /**
   * Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
   */
  delayLongPress?: ?number,

  /**
   * Whether the press behavior is disabled.
   */
  disabled?: ?boolean,

  /**
   * Additional distance outside of this view in which a press is detected.
   */
  hitSlop?: ?RectOrSize,

  /**
   * Additional distance outside of this view in which a touch is considered a
   * press before `onPressOut` is triggered.
   */
  pressRectOffset?: ?RectOrSize,

  /**
   * Called when this view's layout changes.
   */
  onLayout?: ?(event: LayoutEvent) => void,

  /**
   * Called when a long-tap gesture is detected.
   */
  onLongPress?: ?(event: PressEvent) => void,

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: ?(event: PressEvent) => void,

  /**
   * Called when a touch is engaged before `onPress`.
   */
  onPressIn?: ?(event: PressEvent) => void,

  /**
   * Called when a touch is released before `onPress`.
   */
  onPressOut?: ?(event: PressEvent) => void,

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?: ViewStyleProp | ((state: StateCallbackType) => ViewStyleProp),

  /**
   * Identifier used to find this view in tests.
   */
  testID?: ?string,

  /**
   * If true, doesn't play system sound on touch.
   */
  android_disableSound?: ?boolean,

  /**
   * Enables the Android ripple effect and configures its color.
   */
  android_ripple?: ?RippleConfig,

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: ?boolean,
|}>;

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
function Pressable(props: Props, forwardedRef): React.Node {
  const {
    accessible,
    android_disableSound,
    android_ripple,
    children,
    delayLongPress,
    disabled,
    focusable,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    pressRectOffset,
    style,
    testOnly_pressed,
    ...restProps
  } = props;

  const viewRef = useRef<React.ElementRef<typeof View> | null>(null);
  useImperativeHandle(forwardedRef, () => viewRef.current);

  const android_rippleConfig = useAndroidRippleForView(android_ripple, viewRef);

  const [pressed, setPressed] = usePressState(testOnly_pressed === true);

  const hitSlop = normalizeRect(props.hitSlop);

  const config = useMemo(
    () => ({
      disabled,
      hitSlop,
      pressRectOffset,
      android_disableSound,
      delayLongPress,
      onLongPress,
      onPress,
      onPressIn(event: PressEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        setPressed(true);
        if (onPressIn != null) {
          onPressIn(event);
        }
      },
      onPressMove: android_rippleConfig?.onPressMove,
      onPressOut(event: PressEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        setPressed(false);
        if (onPressOut != null) {
          onPressOut(event);
        }
      },
    }),
    [
      android_disableSound,
      android_rippleConfig,
      delayLongPress,
      disabled,
      hitSlop,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      pressRectOffset,
      setPressed,
    ],
  );
  const eventHandlers = usePressability(config);

  return (
    <View
      {...restProps}
      {...eventHandlers}
      {...android_rippleConfig?.viewProps}
      accessible={accessible !== false}
      focusable={focusable !== false}
      hitSlop={hitSlop}
      ref={viewRef}
      style={typeof style === 'function' ? style({pressed}) : style}>
      {typeof children === 'function' ? children({pressed}) : children}
    </View>
  );
}

function usePressState(forcePressed: boolean): [boolean, (boolean) => void] {
  const [pressed, setPressed] = useState(false);
  return [pressed || forcePressed, setPressed];
}

const MemoedPressable = React.memo(React.forwardRef(Pressable));
MemoedPressable.displayName = 'Pressable';

export default (MemoedPressable: React.AbstractComponent<
  Props,
  React.ElementRef<typeof View>,
>);
