/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  AccessibilityNodeInfoProp, // TODO(android ISS)
  AccessibilityRole,
  AccessibilityStates,
} from 'ViewAccessibility';

// [TODO(macOS ISS#2323203)
import type {DraggedTypesType} from 'DraggedType';
// ]TODO(macOS ISS#2323203)

export type ViewLayout = Layout;
export type ViewLayoutEvent = LayoutEvent;

type DirectEventProps = $ReadOnly<{|
  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs an accessibility custom action.
   *
   * @platform ios
   */
  onAccessibilityAction?: ?Function,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility tap gesture.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onaccessibilitytap
   */
  onAccessibilityTap?: ?Function,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility double click gesture.
   */
  onDoubleClick?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility key down gesture.
   */
  onKeyDown?: ?Function, // TODO(macOS ISS#2323203)

  onMouseEnter?: Function, // [TODO(macOS ISS#2323203)

  /**
   * Invoked on mount and layout changes with:
   *
   * `{nativeEvent: { layout: {x, y, width, height}}}`
   *
   * This event is fired immediately once the layout has been calculated, but
   * the new layout may not yet be reflected on the screen at the time the
   * event is received, especially if a layout animation is in progress.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onlayout
   */
  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
   * When `accessible` is `true`, the system will invoke this function when the
   * user performs the magic tap gesture.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onmagictap
   */
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

/**
 * For most touch interactions, you'll simply want to wrap your component in
 * `TouchableHighlight` or `TouchableOpacity`. Check out `Touchable.js`,
 * `ScrollResponder.js` and `ResponderEventPlugin.js` for more discussion.
 */
type GestureResponderEventProps = $ReadOnly<{|
  /**
   * Does this view want to "claim" touch responsiveness? This is called for
   * every touch move on the `View` when it is not the responder.
   *
   * `View.props.onMoveShouldSetResponder: (event) => [true | false]`, where
   * `event` is a synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onmoveshouldsetresponder
   */
  onMoveShouldSetResponder?: ?Function,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder
   * on a move, it should have this handler which returns `true`.
   *
   * `View.props.onMoveShouldSetResponderCapture: (event) => [true | false]`,
   * where `event` is a synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onMoveShouldsetrespondercapture
   */
  onMoveShouldSetResponderCapture?: ?Function,

  /**
   * The View is now responding for touch events. This is the time to highlight
   * and show the user what is happening.
   *
   * `View.props.onResponderGrant: (event) => {}`, where `event` is a synthetic
   * touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onrespondergrant
   */
  onResponderGrant?: ?Function,

  /**
   * The user is moving their finger.
   *
   * `View.props.onResponderMove: (event) => {}`, where `event` is a synthetic
   * touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onrespondermove
   */
  onResponderMove?: ?Function,

  /**
   * Another responder is already active and will not release it to that `View`
   * asking to be the responder.
   *
   * `View.props.onResponderReject: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onresponderreject
   */
  onResponderReject?: ?Function,

  /**
   * Fired at the end of the touch.
   *
   * `View.props.onResponderRelease: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onresponderrelease
   */
  onResponderRelease?: ?Function,

  onResponderStart?: ?Function,
  onResponderEnd?: ?Function,

  /**
   * The responder has been taken from the `View`. Might be taken by other
   * views after a call to `onResponderTerminationRequest`, or might be taken
   * by the OS without asking (e.g., happens with control center/ notification
   * center on iOS)
   *
   * `View.props.onResponderTerminate: (event) => {}`, where `event` is a
   * synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onresponderterminate
   */
  onResponderTerminate?: ?Function,

  /**
   * Some other `View` wants to become responder and is asking this `View` to
   * release its responder. Returning `true` allows its release.
   *
   * `View.props.onResponderTerminationRequest: (event) => {}`, where `event`
   * is a synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onresponderterminationrequest
   */
  onResponderTerminationRequest?: ?Function,

  /**
   * Does this view want to become responder on the start of a touch?
   *
   * `View.props.onStartShouldSetResponder: (event) => [true | false]`, where
   * `event` is a synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onstartshouldsetresponder
   */
  onStartShouldSetResponder?: ?Function,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder
   * on a touch start, it should have this handler which returns `true`.
   *
   * `View.props.onStartShouldSetResponderCapture: (event) => [true | false]`,
   * where `event` is a synthetic touch event as described above.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onstartshouldsetrespondercapture
   */
  onStartShouldSetResponderCapture?: ?Function,
|}>;

type AndroidViewProps = $ReadOnly<{|
  nativeBackgroundAndroid?: ?Object,
  nativeForegroundAndroid?: ?Object,

  /**
   * Whether this `View` should render itself (and all of its children) into a
   * single hardware texture on the GPU.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#rendertohardwaretextureandroid
   */
  renderToHardwareTextureAndroid?: ?boolean,

  /**
   * Views that are only used to layout their children or otherwise don't draw
   * anything may be automatically removed from the native hierarchy as an
   * optimization. Set this property to `false` to disable this optimization and
   * ensure that this `View` exists in the native view hierarchy.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#collapsable
   */
  collapsable?: ?boolean,

  /**
   * Whether this `View` needs to rendered offscreen and composited with an
   * alpha in order to preserve 100% correct colors and blending behavior.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#needsoffscreenalphacompositing
   */
  needsOffscreenAlphaCompositing?: ?boolean,

  /**
   * When `true`, indicates that the view is clickable. By default,
   * all the touchable elements are clickable.
   * 
   * @platform android
   */
  clickable?: ?boolean, // TODO(android ISS)
  
  /**
   * When `clickable` is true, the system will try to invoke this function
   * when the user performs a click.
   * 
   * @platform android
   */

  onClick?: ?Function, // TODO(android ISS)
  /**
   * Indicates to accessibility services to treat UI component like a
   * native one. Works for Android only.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilitycomponenttype
   */

  accessibilityComponentType?: ?AccessibilityComponentType,

  /**
   * Indicates to accessibility services whether the user should be notified
   * when this view changes. Works for Android API >= 19 only.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityliveregion
   */
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),

  /**
   * fired when the view focus changes (gain->lose or lose->gain)
   * 
   * @platform android
   */
  onFocusChange?: ?Function, // TODO(android ISS)

  /**
   * Controls how view is important for accessibility which is if it
   * fires accessibility events and if it is reported to accessibility services
   * that query the screen. Works for Android only.
   *
   * @platform android
   *
   * See http://facebook.github.io/react-native/docs/view.html#importantforaccessibility
   */
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),

  accessibilityNodeInfo?: AccessibilityNodeInfoProp, // TODO(android ISS)
|}>;

type IOSViewProps = $ReadOnly<{|
  /**
   * Provides an array of custom actions available for accessibility.
   *
   * @platform ios
   */
  accessibilityActions?: ?$ReadOnlyArray<string>,

  /**
   * Prevents view from being inverted if set to true and color inversion is turned on.
   *
   * @platform ios
   */
  accessibilityIgnoresInvertColors?: ?boolean,

  /**
   * Provides additional traits to screen reader. By default no traits are
   * provided unless specified otherwise in element.
   *
   * You can provide one trait or an array of many traits.
   *
   * @platform ios
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilitytraits
   */
  accessibilityTraits?: ?(
    | AccessibilityTrait
    | $ReadOnlyArray<AccessibilityTrait>
  ),

  /**
   * A value indicating whether VoiceOver should ignore the elements
   * within views that are siblings of the receiver.
   * Default is `false`.
   *
   * @platform ios
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityviewismodal
   */
  accessibilityViewIsModal?: ?boolean,

  /**
   * A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   *
   * @platform ios
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityElementsHidden
   */
  accessibilityElementsHidden?: ?boolean,

  /**
   * Whether this `View` should be rendered as a bitmap before compositing.
   *
   * @platform ios
   */
  onAccessibilityAction?: ?Function,

  onDoubleClick?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility tap gesture.
   *
   * See http://facebook.github.io/react-native/docs/view.html#onaccessibilitytap
   */
  onAccessibilityTap?: ?Function,

  /**
   * When `accessible` is `true`, the system will invoke this function when the
   * user performs the magic tap gesture.
   *
   * See http://facebook.github.io/react-native/docs/view.html#shouldrasterizeios
   */
  shouldRasterizeIOS?: ?boolean,
|}>;

export type ViewProps = $ReadOnly<{|
  ...DirectEventProps,
  ...GestureResponderEventProps,
  ...TouchEventProps,
  ...AndroidViewProps,
  ...IOSViewProps,

  // There's no easy way to create a different type if (Platform.isTV):
  // so we must include TVViewProps
  ...TVViewProps,

  children?: React.Node,
  style?: ?ViewStyleProp,

  /**
   * When `true`, indicates that the view is an accessibility element.
   * By default, all the touchable elements are accessible.
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessible
   */
  accessible?: ?boolean,

  /**
   * Overrides the text that's read by the screen reader when the user interacts
   * with the element. By default, the label is constructed by traversing all
   * the children and accumulating all the `Text` nodes separated by space.
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilitylabel
   */
  accessibilityLabel?: ?Stringish,

  /**
   * An accessibility hint helps users understand what will happen when they perform
   * an action on the accessibility element when that result is not obvious from the
   * accessibility label.
   *
   *
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityHint
   */
  accessibilityHint?: ?Stringish,

  /**
   * Indicates to accessibility services to treat UI component like a specific role.
   */
  accessibilityRole?: ?AccessibilityRole,

  /**
   * Indicates to accessibility services that UI Component is in a specific State.
   */
  accessibilityStates?: ?AccessibilityStates,

  /**
   * Used to locate this view in end-to-end tests.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   *
   * See http://facebook.github.io/react-native/docs/view.html#testid
   */
  testID?: ?string,

  /**
   * Used to locate this view from native classes.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   *
   * See http://facebook.github.io/react-native/docs/view.html#nativeid
   */
  nativeID?: ?string,

  tabIndex?: ?number, // TODO(win ISS#2323203)

  /**
   * This defines how far a touch event can start away from the view.
   * Typical interface guidelines recommend touch targets that are at least
   * 30 - 40 points/density-independent pixels.
   *
   * > The touch area never extends past the parent view bounds and the Z-index
   * > of sibling views always takes precedence if a touch hits two overlapping
   * > views.
   *
   * See http://facebook.github.io/react-native/docs/view.html#hitslop
   */
  hitSlop?: ?EdgeInsetsProp,

  /**
   * Controls whether the `View` can be the target of touch events.
   *
   * See http://facebook.github.io/react-native/docs/view.html#pointerevents
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
   * See http://facebook.github.io/react-native/docs/view.html#removeclippedsubviews
   */
  removeClippedSubviews?: ?boolean,

  onKeyDown?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when a pointing device is moved over the view
   *
   * @platform macos
   */
  onMouseEnter?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when a pointing device is moved out the view
   *
   * @platform macos
   */
  onMouseLeave?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when a dragged element enters a valid drop target
   *
   * @platform macos
   */
  onDragEnter?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when a dragged element leaves a valid drop target
   *
   * @platform macos
   */
  onDragLeave?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when an element is dropped on a valid drop target
   *
   * @platform macos
   */
  onDrop?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Specifies the Tooltip for the view
   * @platform macos
   */
  tooltip?: ?string, // TODO(macOS ISS#2323203)

  /**
   * Specifies whether the view participates in the key view loop as user tabs
   * through different controls.
   */
  acceptsKeyboardFocus?: ?boolean, // TODO(macOS ISS#2323203)

  /**
   * Specifies whether focus ring should be drawn when the view has the first responder status.
   */
  enableFocusRing?: ?boolean, // TODO(macOS ISS#2323203)

  /**
   * Fired when an element is focused
   *
   * @platform macos
   * @platform ios
   */
  onFocus?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Fired when an element loses focus
   *
   * @platform macos
   * @platform ios
   */
  onBlur?: ?Function, // TODO(macOS ISS#2323203)

  /**
   * Enables Dran'n'Drop Support for certain types of dragged types
   *
   * Possible values for `draggedTypes` are:
   *
   * - `'fileUrl'`
   *
   * @platform macos
   */
  draggedTypes?: ?DraggedTypesType, // TODO(macOS ISS#2323203)
|}>;
