/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {EdgeInsetsOrSizeProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {
  BlurEvent,
  FocusEvent,
  LayoutChangeEvent,
  LayoutRectangle,
  MouseEvent,
  PointerEvent,
  GestureResponderEvent,
} from '../../Types/CoreEventTypes';
import type {
  AccessibilityActionEvent,
  AccessibilityProps,
} from './ViewAccessibility';
import type {Node} from 'react';

export type ViewLayout = LayoutRectangle;
export type ViewLayoutEvent = LayoutChangeEvent;

type DirectEventProps = $ReadOnly<{
  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs an accessibility custom action.
   *
   */
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility tap gesture.
   *
   * See https://reactnative.dev/docs/view#onaccessibilitytap
   */
  onAccessibilityTap?: ?() => mixed,

  /**
   * Invoked on mount and layout changes with:
   *
   * `{nativeEvent: { layout: {x, y, width, height}}}`
   *
   * This event is fired immediately once the layout has been calculated, but
   * the new layout may not yet be reflected on the screen at the time the
   * event is received, especially if a layout animation is in progress.
   *
   * See https://reactnative.dev/docs/view#onlayout
   */
  onLayout?: ?(event: LayoutChangeEvent) => mixed,

  /**
   * When `accessible` is `true`, the system will invoke this function when the
   * user performs the magic tap gesture.
   *
   * See https://reactnative.dev/docs/view#onmagictap
   */
  onMagicTap?: ?() => mixed,

  /**
   * When `accessible` is `true`, the system will invoke this function when the
   * user performs the escape gesture.
   *
   * See https://reactnative.dev/docs/view#onaccessibilityescape
   */
  onAccessibilityEscape?: ?() => mixed,
}>;

type MouseEventProps = $ReadOnly<{
  onMouseEnter?: ?(event: MouseEvent) => void,
  onMouseLeave?: ?(event: MouseEvent) => void,
}>;

// Experimental/Work in Progress Pointer Event Callbacks (not yet ready for use)
type PointerEventProps = $ReadOnly<{
  onClick?: ?(event: PointerEvent) => void,
  onClickCapture?: ?(event: PointerEvent) => void,
  onPointerEnter?: ?(event: PointerEvent) => void,
  onPointerEnterCapture?: ?(event: PointerEvent) => void,
  onPointerLeave?: ?(event: PointerEvent) => void,
  onPointerLeaveCapture?: ?(event: PointerEvent) => void,
  onPointerMove?: ?(event: PointerEvent) => void,
  onPointerMoveCapture?: ?(event: PointerEvent) => void,
  onPointerCancel?: ?(e: PointerEvent) => void,
  onPointerCancelCapture?: ?(e: PointerEvent) => void,
  onPointerDown?: ?(e: PointerEvent) => void,
  onPointerDownCapture?: ?(e: PointerEvent) => void,
  onPointerUp?: ?(e: PointerEvent) => void,
  onPointerUpCapture?: ?(e: PointerEvent) => void,
  onPointerOver?: ?(e: PointerEvent) => void,
  onPointerOverCapture?: ?(e: PointerEvent) => void,
  onPointerOut?: ?(e: PointerEvent) => void,
  onPointerOutCapture?: ?(e: PointerEvent) => void,
  onGotPointerCapture?: ?(e: PointerEvent) => void,
  onGotPointerCaptureCapture?: ?(e: PointerEvent) => void,
  onLostPointerCapture?: ?(e: PointerEvent) => void,
  onLostPointerCaptureCapture?: ?(e: PointerEvent) => void,
}>;

type FocusEventProps = $ReadOnly<{
  onBlur?: ?(event: BlurEvent) => void,
  onBlurCapture?: ?(event: BlurEvent) => void,
  onFocus?: ?(event: FocusEvent) => void,
  onFocusCapture?: ?(event: FocusEvent) => void,
}>;

type TouchEventProps = $ReadOnly<{
  onTouchCancel?: ?(e: GestureResponderEvent) => void,
  onTouchCancelCapture?: ?(e: GestureResponderEvent) => void,
  onTouchEnd?: ?(e: GestureResponderEvent) => void,
  onTouchEndCapture?: ?(e: GestureResponderEvent) => void,
  onTouchMove?: ?(e: GestureResponderEvent) => void,
  onTouchMoveCapture?: ?(e: GestureResponderEvent) => void,
  onTouchStart?: ?(e: GestureResponderEvent) => void,
  onTouchStartCapture?: ?(e: GestureResponderEvent) => void,
}>;

/**
 * For most touch interactions, you'll simply want to wrap your component in
 * `TouchableHighlight` or `TouchableOpacity`. Check out `Touchable.js`,
 * `ScrollResponder.js` and `ResponderEventPlugin.js` for more discussion.
 */
export type GestureResponderHandlers = $ReadOnly<{
  /**
   * Does this view want to "claim" touch responsiveness? This is called for
   * every touch move on the `View` when it is not the responder.
   *
   * `View.props.onMoveShouldSetResponder: (event) => [true | false]`, where
   * `event` is a synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onmoveshouldsetresponder
   */
  onMoveShouldSetResponder?: ?(e: GestureResponderEvent) => boolean,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder
   * on a move, it should have this handler which returns `true`.
   *
   * `View.props.onMoveShouldSetResponderCapture: (event) => [true | false]`,
   * where `event` is a synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onMoveShouldsetrespondercapture
   */
  onMoveShouldSetResponderCapture?: ?(e: GestureResponderEvent) => boolean,

  /**
   * The View is now responding for touch events. This is the time to highlight
   * and show the user what is happening.
   *
   * `View.props.onResponderGrant: (event) => {}`, where `event` is a synthetic
   * touch event as described above.
   *
   * Return true from this callback to prevent any other native components from
   * becoming responder until this responder terminates (Android-only).
   *
   * See https://reactnative.dev/docs/view#onrespondergrant
   */
  onResponderGrant?: ?(e: GestureResponderEvent) => void | boolean,

  /**
   * The user is moving their finger.
   *
   * `View.props.onResponderMove: (event) => {}`, where `event` is a synthetic
   * touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onrespondermove
   */
  onResponderMove?: ?(e: GestureResponderEvent) => void,

  /**
   * Another responder is already active and will not release it to that `View`
   * asking to be the responder.
   *
   * `View.props.onResponderReject: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onresponderreject
   */
  onResponderReject?: ?(e: GestureResponderEvent) => void,

  /**
   * Fired at the end of the touch.
   *
   * `View.props.onResponderRelease: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onresponderrelease
   */
  onResponderRelease?: ?(e: GestureResponderEvent) => void,

  onResponderStart?: ?(e: GestureResponderEvent) => void,
  onResponderEnd?: ?(e: GestureResponderEvent) => void,

  /**
   * The responder has been taken from the `View`. Might be taken by other
   * views after a call to `onResponderTerminationRequest`, or might be taken
   * by the OS without asking (e.g., happens with control center/ notification
   * center on iOS)
   *
   * `View.props.onResponderTerminate: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onresponderterminate
   */
  onResponderTerminate?: ?(e: GestureResponderEvent) => void,

  /**
   * Some other `View` wants to become responder and is asking this `View` to
   * release its responder. Returning `true` allows its release.
   *
   * `View.props.onResponderTerminationRequest: (event) => {}`, where `event`
   * is a synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onresponderterminationrequest
   */
  onResponderTerminationRequest?: ?(e: GestureResponderEvent) => boolean,

  /**
   * Does this view want to become responder on the start of a touch?
   *
   * `View.props.onStartShouldSetResponder: (event) => [true | false]`, where
   * `event` is a synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onstartshouldsetresponder
   */
  onStartShouldSetResponder?: ?(e: GestureResponderEvent) => boolean,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder
   * on a touch start, it should have this handler which returns `true`.
   *
   * `View.props.onStartShouldSetResponderCapture: (event) => [true | false]`,
   * where `event` is a synthetic touch event as described above.
   *
   * See https://reactnative.dev/docs/view#onstartshouldsetrespondercapture
   */
  onStartShouldSetResponderCapture?: ?(e: GestureResponderEvent) => boolean,
}>;

type AndroidDrawableThemeAttr = $ReadOnly<{
  type: 'ThemeAttrAndroid',
  attribute: string,
}>;

type AndroidDrawableRipple = $ReadOnly<{
  type: 'RippleAndroid',
  color?: ?number,
  borderless?: ?boolean,
  rippleRadius?: ?number,
}>;

type AndroidDrawable = AndroidDrawableThemeAttr | AndroidDrawableRipple;

export type ViewPropsAndroid = $ReadOnly<{
  nativeBackgroundAndroid?: ?AndroidDrawable,
  nativeForegroundAndroid?: ?AndroidDrawable,

  /**
   * Whether this `View` should render itself (and all of its children) into a
   * single hardware texture on the GPU.
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/view#rendertohardwaretextureandroid
   */
  renderToHardwareTextureAndroid?: ?boolean,

  /**
   * Whether to force the Android TV focus engine to move focus to this view.
   *
   * @platform android
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * TV next focus down (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusDown?: ?number,

  /**
   * TV next focus forward (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusForward?: ?number,

  /**
   * TV next focus left (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusLeft?: ?number,

  /**
   * TV next focus right (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusRight?: ?number,

  /**
   * TV next focus up (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusUp?: ?number,

  /**
   * Whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   *
   * @platform android
   */
  focusable?: ?boolean,

  /**
   * Indicates whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
   * for more details.
   *
   * Supports the following values:
   * -  0 (View is focusable)
   * - -1 (View is not focusable)
   *
   * @platform android
   */
  tabIndex?: 0 | -1,

  /**
   * The action to perform when this `View` is clicked on by a non-touch click, eg. enter key on a hardware keyboard.
   *
   * @platform android
   */
  onClick?: ?(event: GestureResponderEvent) => mixed,
}>;

export type ViewPropsIOS = $ReadOnly<{
  /**
   * Whether this `View` should be rendered as a bitmap before compositing.
   *
   * @platform ios
   *
   * See https://reactnative.dev/docs/view#shouldrasterizeios
   */
  shouldRasterizeIOS?: ?boolean,
}>;

type ViewBaseProps = $ReadOnly<{
  children?: Node,
  style?: ?ViewStyleProp,

  /**
   * Views that are only used to layout their children or otherwise don't draw
   * anything may be automatically removed from the native hierarchy as an
   * optimization. Set this property to `false` to disable this optimization and
   * ensure that this `View` exists in the native view hierarchy.
   *
   * See https://reactnative.dev/docs/view#collapsable
   */
  collapsable?: ?boolean,

  /**
   * Setting to false prevents direct children of the view from being removed
   * from the native view hierarchy, similar to the effect of setting
   * `collapsable={false}` on each child.
   */
  collapsableChildren?: ?boolean,

  /**
   * Used to locate this view from native classes. Has precedence over `nativeID` prop.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   *
   * See https://reactnative.dev/docs/view#id
   */
  id?: string,

  /**
   * Used to locate this view in end-to-end tests.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   *
   * See https://reactnative.dev/docs/view#testid
   */
  testID?: ?string,

  /**
   * Used to locate this view from native classes.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   *
   * See https://reactnative.dev/docs/view#nativeid
   */
  nativeID?: ?string,

  /**
   * Whether this `View` needs to rendered offscreen and composited with an
   * alpha in order to preserve 100% correct colors and blending behavior.
   *
   * See https://reactnative.dev/docs/view#needsoffscreenalphacompositing
   */
  needsOffscreenAlphaCompositing?: ?boolean,

  /**
   * This defines how far a touch event can start away from the view.
   * Typical interface guidelines recommend touch targets that are at least
   * 30 - 40 points/density-independent pixels.
   *
   * > The touch area never extends past the parent view bounds and the Z-index
   * > of sibling views always takes precedence if a touch hits two overlapping
   * > views.
   *
   * See https://reactnative.dev/docs/view#hitslop
   */
  hitSlop?: ?EdgeInsetsOrSizeProp,

  /**
   * Controls whether the `View` can be the target of touch events.
   *
   * See https://reactnative.dev/docs/view#pointerevents
   */
  pointerEvents?: ?('auto' | 'box-none' | 'box-only' | 'none'),

  /**
   * This is a special performance property exposed by `RCTView` and is useful
   * for scrolling content when there are many subviews, most of which are
   * offscreen. For this property to be effective, it must be applied to a
   * view that contains many subviews that extend outside its bound. The
   * subviews must also have `overflow: hidden`, as should the containing view
   * (or one of its superviews).
   *
   * See https://reactnative.dev/docs/view#removeclippedsubviews
   */
  removeClippedSubviews?: ?boolean,
}>;

export type ViewProps = $ReadOnly<{
  ...DirectEventProps,
  ...GestureResponderHandlers,
  ...MouseEventProps,
  ...PointerEventProps,
  ...FocusEventProps,
  ...TouchEventProps,
  ...ViewPropsAndroid,
  ...ViewPropsIOS,
  ...AccessibilityProps,
  ...ViewBaseProps,
}>;
