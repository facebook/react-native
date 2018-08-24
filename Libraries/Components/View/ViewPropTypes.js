/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {Layout, LayoutEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type React from 'React';
import type {ViewStyleProp} from 'StyleSheet';
import type {TVViewProps} from 'TVViewPropTypes';
import type {
  AccessibilityComponentType,
  AccessibilityTrait,
  AccessibilityRole,
  AccessibilityStates,
} from 'ViewAccessibility';

export type ViewLayout = Layout;
export type ViewLayoutEvent = LayoutEvent;

type DirectEventProps = $ReadOnly<{|
  onAccessibilityAction?: ?Function,
  onAccessibilityTap?: ?Function,
  onLayout?: ?(event: LayoutEvent) => void,
  onMagicTap?: ?Function,
|}>;

type TouchEventProps = $ReadOnly<{|
  onTouchCancel?: ?Function,
  onTouchCancelCapture?: ?Function,
  onTouchEnd?: ?Function,
  onTouchEndCapture?: ?Function,
  onTouchMove?: ?Function,
  onTouchMoveCapture?: ?Function,
  onTouchStart?: ?Function,
  onTouchStartCapture?: ?Function,
|}>;

type GestureResponderEventProps = $ReadOnly<{|
  onMoveShouldSetResponder?: ?Function,
  onMoveShouldSetResponderCapture?: ?Function,
  onResponderGrant?: ?Function,
  onResponderMove?: ?Function,
  onResponderReject?: ?Function,
  onResponderRelease?: ?Function,
  onResponderStart?: ?Function,
  onResponderTerminate?: ?Function,
  onResponderTerminationRequest?: ?Function,
  onStartShouldSetResponder?: ?Function,
  onStartShouldSetResponderCapture?: ?Function,
|}>;

type AndroidViewProps = $ReadOnly<{|
  nativeBackgroundAndroid?: ?Object,
  nativeForegroundAndroid?: ?Object,

  /* Deprecated transform prop. Use the transform style prop instead */
  rotation?: empty,
  /* Deprecated transform prop. Use the transform style prop instead */
  scaleX?: empty,
  /* Deprecated transform prop. Use the transform style prop instead */
  scaleY?: empty,
  /* Deprecated transform prop. Use the transform style prop instead */
  translateX?: empty,
  /* Deprecated transform prop. Use the transform style prop instead */
  translateY?: empty,
|}>;

export type ViewProps = $ReadOnly<{|
  ...DirectEventProps,
  ...GestureResponderEventProps,
  ...TouchEventProps,
  ...AndroidViewProps,

  // There's no easy way to create a different type if (Platform.isTV):
  // so we must include TVViewProps
  ...TVViewProps,

  accessible?: ?boolean,
  accessibilityLabel?: ?(
    | null
    | React$PropType$Primitive<any>
    | Stringish
    | $ReadOnlyArray<any>
    | any
  ),
  accessibilityHint?: ?Stringish,
  accessibilityActions?: ?$ReadOnlyArray<string>,
  accessibilityComponentType?: ?AccessibilityComponentType,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityTraits?: ?(
    | AccessibilityTrait
    | $ReadOnlyArray<AccessibilityTrait>
  ),
  accessibilityRole?: ?AccessibilityRole,
  accessibilityStates?: ?AccessibilityStates,
  accessibilityViewIsModal?: ?boolean,
  accessibilityElementsHidden?: ?boolean,
  children?: ?React.Node,
  testID?: ?string,
  nativeID?: ?string,
  hitSlop?: ?EdgeInsetsProp,
  pointerEvents?: ?('auto' | 'box-none' | 'box-only' | 'none'),
  style?: ?ViewStyleProp,
  removeClippedSubviews?: ?boolean,
  renderToHardwareTextureAndroid?: ?boolean,
  shouldRasterizeIOS?: ?boolean,
  collapsable?: ?boolean,
  needsOffscreenAlphaCompositing?: ?boolean,
|}>;
