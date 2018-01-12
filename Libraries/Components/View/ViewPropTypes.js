/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewPropTypes
 * @flow
 */
'use strict';

const EdgeInsetsPropType = require('EdgeInsetsPropType');
const PlatformViewPropTypes = require('PlatformViewPropTypes');
const PropTypes = require('prop-types');
const StyleSheetPropType = require('StyleSheetPropType');
const ViewStylePropTypes = require('ViewStylePropTypes');

const {
  AccessibilityComponentTypes,
  AccessibilityTraits,
} = require('ViewAccessibility');

import type {
  AccessibilityComponentType,
  AccessibilityTrait,
} from 'ViewAccessibility';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {TVViewProps} from 'TVViewPropTypes';

const stylePropType = StyleSheetPropType(ViewStylePropTypes);

export type ViewLayout = {
  x: number,
  y: number,
  width: number,
  height: number,
}

export type ViewLayoutEvent = {
  nativeEvent: {
    layout: ViewLayout,
  }
}

// There's no easy way to create a different type if (Platform.isTVOS):
// so we must include TVViewProps
export type ViewProps = {
  accessible?: bool,
  accessibilityLabel?: React$PropType$Primitive<any>,
  accessibilityActions?: Array<string>,
  accessibilityComponentType?: AccessibilityComponentType,
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive',
  importantForAccessibility?: 'auto'| 'yes'| 'no'| 'no-hide-descendants',
  accessibilityTraits?: AccessibilityTrait | Array<AccessibilityTrait>,
  accessibilityViewIsModal?: bool,
  onAccessibilityAction?: Function,
  onAccessibilityTap?: Function,
  onMagicTap?: Function,
  testID?: string,
  nativeID?: string,
  onLayout?: (event: ViewLayoutEvent) => void,
  onResponderGrant?: Function,
  onResponderMove?: Function,
  onResponderReject?: Function,
  onResponderRelease?: Function,
  onResponderTerminate?: Function,
  onResponderTerminationRequest?: Function,
  onStartShouldSetResponder?: Function,
  onStartShouldSetResponderCapture?: Function,
  onMoveShouldSetResponder?: Function,
  onMoveShouldSetResponderCapture?: Function,
  hitSlop?: EdgeInsetsProp,
  pointerEvents?: 'box-none'| 'none'| 'box-only'| 'auto',
  style?: stylePropType,
  removeClippedSubviews?: bool,
  renderToHardwareTextureAndroid?: bool,
  shouldRasterizeIOS?: bool,
  collapsable?: bool,
  needsOffscreenAlphaCompositing?: bool,
} & TVViewProps;

module.exports = {
  ...PlatformViewPropTypes,

  /**
   * When `true`, indicates that the view is an accessibility element. 
   * By default, all the touchable elements are accessible.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#accessible
   */
  accessible: PropTypes.bool,

  /**
   * Overrides the text that's read by the screen reader when the user interacts
   * with the element. By default, the label is constructed by traversing all
   * the children and accumulating all the `Text` nodes separated by space.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#accessibilitylabel
   */
  accessibilityLabel: PropTypes.node,

  /**
   * Provides an array of custom actions available for accessibility.
   *
   * @platform ios
   */
  accessibilityActions: PropTypes.arrayOf(PropTypes.string),

  /**
   * Indicates to accessibility services to treat UI component like a
   * native one. Works for Android only.
   *
   * @platform android
   * 
   * See http://facebook.github.io/react-native/docs/view.html#accessibilitycomponenttype
   */
  accessibilityComponentType: PropTypes.oneOf(AccessibilityComponentTypes),

  /**
   * Indicates to accessibility services whether the user should be notified
   * when this view changes. Works for Android API >= 19 only.
   *
   * @platform android
   * 
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityliveregion
   */
  accessibilityLiveRegion: PropTypes.oneOf([
    'none',
    'polite',
    'assertive',
  ]),

  /**
   * Controls how view is important for accessibility which is if it
   * fires accessibility events and if it is reported to accessibility services
   * that query the screen. Works for Android only.
   *
   * @platform android
   * 
   * See http://facebook.github.io/react-native/docs/view.html#importantforaccessibility
   */
  importantForAccessibility: PropTypes.oneOf([
    'auto',
    'yes',
    'no',
    'no-hide-descendants',
  ]),

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
  accessibilityTraits: PropTypes.oneOfType([
    PropTypes.oneOf(AccessibilityTraits),
    PropTypes.arrayOf(PropTypes.oneOf(AccessibilityTraits)),
  ]),

  /**
   * A value indicating whether VoiceOver should ignore the elements
   * within views that are siblings of the receiver.
   * Default is `false`.
   *
   * @platform ios
   * 
   * See http://facebook.github.io/react-native/docs/view.html#accessibilityviewismodal
   */
  accessibilityViewIsModal: PropTypes.bool,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs an accessibility custom action.
   *
   * @platform ios
   */
  onAccessibilityAction: PropTypes.func,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs accessibility tap gesture.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onaccessibilitytap
   */
  onAccessibilityTap: PropTypes.func,

  /**
   * When `accessible` is `true`, the system will invoke this function when the
   * user performs the magic tap gesture.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onmagictap
   */
  onMagicTap: PropTypes.func,

  /**
   * Used to locate this view in end-to-end tests.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   * 
   * See http://facebook.github.io/react-native/docs/view.html#testid
   */
  testID: PropTypes.string,

  /**
   * Used to locate this view from native classes.
   *
   * > This disables the 'layout-only view removal' optimization for this view!
   * 
   * See http://facebook.github.io/react-native/docs/view.html#nativeid
   */
  nativeID: PropTypes.string,

  /**
   * For most touch interactions, you'll simply want to wrap your component in
   * `TouchableHighlight` or `TouchableOpacity`. Check out `Touchable.js`,
   * `ScrollResponder.js` and `ResponderEventPlugin.js` for more discussion.
   */

  /**
   * The View is now responding for touch events. This is the time to highlight 
   * and show the user what is happening.
   *
   * `View.props.onResponderGrant: (event) => {}`, where `event` is a synthetic
   * touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onrespondergrant
   */
  onResponderGrant: PropTypes.func,

  /**
   * The user is moving their finger.
   *
   * `View.props.onResponderMove: (event) => {}`, where `event` is a synthetic 
   * touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onrespondermove
   */
  onResponderMove: PropTypes.func,

  /**
   * Another responder is already active and will not release it to that `View` 
   * asking to be the responder.
   *
   * `View.props.onResponderReject: (event) => {}`, where `event` is a 
   * synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onresponderreject
   */
  onResponderReject: PropTypes.func,

  /**
   * Fired at the end of the touch.
   *
   * `View.props.onResponderRelease: (event) => {}`, where `event` is a 
   * synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onresponderrelease
   */
  onResponderRelease: PropTypes.func,

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
  onResponderTerminate: PropTypes.func,

  /**
   * Some other `View` wants to become responder and is asking this `View` to 
   * release its responder. Returning `true` allows its release.
   *
   * `View.props.onResponderTerminationRequest: (event) => {}`, where `event` 
   * is a synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onresponderterminationrequest
   */
  onResponderTerminationRequest: PropTypes.func,

  /**
   * Does this view want to become responder on the start of a touch?
   *
   * `View.props.onStartShouldSetResponder: (event) => [true | false]`, where 
   * `event` is a synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onstartshouldsetresponder
   */
  onStartShouldSetResponder: PropTypes.func,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder 
   * on a touch start, it should have this handler which returns `true`.
   *
   * `View.props.onStartShouldSetResponderCapture: (event) => [true | false]`, 
   * where `event` is a synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onstartshouldsetrespondercapture
   */
  onStartShouldSetResponderCapture: PropTypes.func,

  /**
   * Does this view want to "claim" touch responsiveness? This is called for 
   * every touch move on the `View` when it is not the responder.
   *
   * `View.props.onMoveShouldSetResponder: (event) => [true | false]`, where 
   * `event` is a synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onmoveshouldsetresponder
   */
  onMoveShouldSetResponder: PropTypes.func,

  /**
   * If a parent `View` wants to prevent a child `View` from becoming responder
   * on a move, it should have this handler which returns `true`.
   * 
   * `View.props.onMoveShouldSetResponderCapture: (event) => [true | false]`,
   * where `event` is a synthetic touch event as described above.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#onMoveShouldsetrespondercapture
   */
  onMoveShouldSetResponderCapture: PropTypes.func,

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
  hitSlop: EdgeInsetsPropType,

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
  onLayout: PropTypes.func,

  /**
   * Controls whether the `View` can be the target of touch events.
   * 
   * See http://facebook.github.io/react-native/docs/view.html#pointerevents
   */
  pointerEvents: PropTypes.oneOf([
    'box-none',
    'none',
    'box-only',
    'auto',
  ]),

  /**
   * See http://facebook.github.io/react-native/docs/style.html
   */
  style: stylePropType,

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
  removeClippedSubviews: PropTypes.bool,

  /**
   * Whether this `View` should render itself (and all of its children) into a
   * single hardware texture on the GPU.
   *
   * @platform android
   * 
   * See http://facebook.github.io/react-native/docs/view.html#rendertohardwaretextureandroid
   */
  renderToHardwareTextureAndroid: PropTypes.bool,

  /**
   * Whether this `View` should be rendered as a bitmap before compositing.
   *
   * @platform ios
   * 
   * See http://facebook.github.io/react-native/docs/view.html#shouldrasterizeios
   */
  shouldRasterizeIOS: PropTypes.bool,

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
  collapsable: PropTypes.bool,

  /**
   * Whether this `View` needs to rendered offscreen and composited with an 
   * alpha in order to preserve 100% correct colors and blending behavior. 
   *
   * @platform android
   * 
   * See http://facebook.github.io/react-native/docs/view.html#needsoffscreenalphacompositing
   */
  needsOffscreenAlphaCompositing: PropTypes.bool,
};
