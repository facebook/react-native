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

const DeprecatedEdgeInsetsPropType = require('DeprecatedEdgeInsetsPropType');
const React = require('React');
const PropTypes = require('prop-types');
const Touchable = require('Touchable');
const View = require('View');

const createReactClass = require('create-react-class');
const ensurePositiveDelayProps = require('ensurePositiveDelayProps');

const {
  DeprecatedAccessibilityComponentTypes,
  DeprecatedAccessibilityRoles,
  DeprecatedAccessibilityStates,
  DeprecatedAccessibilityTraits,
} = require('DeprecatedViewAccessibility');

import type {PressEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {
  AccessibilityComponentType,
  AccessibilityRole,
  AccessibilityStates,
  AccessibilityTraits,
} from 'ViewAccessibility';

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

export type Props = $ReadOnly<{|
  accessible?: ?boolean,
  accessibilityComponentType?: ?AccessibilityComponentType,
  accessibilityLabel?:
    | null
    | React$PropType$Primitive<any>
    | string
    | Array<any>
    | any,
  accessibilityHint?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityRole?: ?AccessibilityRole,
  accessibilityStates?: ?AccessibilityStates,
  accessibilityTraits?: ?AccessibilityTraits,
  children?: ?React.Node,
  delayLongPress?: ?number,
  delayPressIn?: ?number,
  delayPressOut?: ?number,
  disabled?: ?boolean,
  hitSlop?: ?EdgeInsetsProp,
  nativeID?: ?string,
  onBlur?: ?Function,
  onFocus?: ?Function,
  onLayout?: ?Function,
  onLongPress?: ?Function,
  onPress?: ?Function,
  onPressIn?: ?Function,
  onPressOut?: ?Function,
  pressRetentionOffset?: ?EdgeInsetsProp,
  rejectResponderTermination?: ?boolean,
  testID?: ?string,
|}>;

/**
 * Do not use unless you have a very good reason. All elements that
 * respond to press should have a visual feedback when touched.
 *
 * TouchableWithoutFeedback supports only one child.
 * If you wish to have several child components, wrap them in a View.
 */
const TouchableWithoutFeedback = ((createReactClass({
  displayName: 'TouchableWithoutFeedback',
  mixins: [Touchable.Mixin],

  propTypes: {
    accessible: PropTypes.bool,
    accessibilityLabel: PropTypes.node,
    accessibilityHint: PropTypes.string,
    accessibilityComponentType: PropTypes.oneOf(
      DeprecatedAccessibilityComponentTypes,
    ),
    accessibilityRole: PropTypes.oneOf(DeprecatedAccessibilityRoles),
    accessibilityStates: PropTypes.arrayOf(
      PropTypes.oneOf(DeprecatedAccessibilityStates),
    ),
    accessibilityTraits: PropTypes.oneOfType([
      PropTypes.oneOf(DeprecatedAccessibilityTraits),
      PropTypes.arrayOf(PropTypes.oneOf(DeprecatedAccessibilityTraits)),
    ]),
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "focus" occurs. Some platforms may not have
     * the concept of focus.
     */
    onFocus: PropTypes.func,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "blur" occurs, meaning the element lost focus.
     * Some platforms may not have the concept of blur.
     */
    onBlur: PropTypes.func,
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * Called when the touch is released, but not if cancelled (e.g. by a scroll
     * that steals the responder lock).
     */
    onPress: PropTypes.func,
    /**
     * Called as soon as the touchable element is pressed and invoked even before onPress.
     * This can be useful when making network requests.
     */
    onPressIn: PropTypes.func,
    /**
     * Called as soon as the touch is released even before onPress.
     */
    onPressOut: PropTypes.func,
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: PropTypes.func,

    onLongPress: PropTypes.func,

    nativeID: PropTypes.string,
    testID: PropTypes.string,

    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn: PropTypes.number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut: PropTypes.number,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress: PropTypes.number,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: DeprecatedEdgeInsetsPropType,
    /**
     * This defines how far your touch can start away from the button. This is
     * added to `pressRetentionOffset` when moving off of the button.
     * ** NOTE **
     * The touch area never extends past the parent view bounds and the Z-index
     * of sibling views always takes precedence if a touch hits two overlapping
     * views.
     */
    hitSlop: DeprecatedEdgeInsetsPropType,
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  componentDidMount: function() {
    ensurePositiveDelayProps(this.props);
  },

  UNSAFE_componentWillReceiveProps: function(nextProps: Object) {
    ensurePositiveDelayProps(nextProps);
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandlePress: function(e: PressEvent) {
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleActivePressIn: function(e: PressEvent) {
    this.props.onPressIn && this.props.onPressIn(e);
  },

  touchableHandleActivePressOut: function(e: PressEvent) {
    this.props.onPressOut && this.props.onPressOut(e);
  },

  touchableHandleLongPress: function(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  },

  touchableGetPressRectOffset: function(): typeof PRESS_RETENTION_OFFSET {
    // $FlowFixMe Invalid prop usage
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  },

  touchableGetHitSlop: function(): ?Object {
    return this.props.hitSlop;
  },

  touchableGetHighlightDelayMS: function(): number {
    return this.props.delayPressIn || 0;
  },

  touchableGetLongPressDelayMS: function(): number {
    return this.props.delayLongPress === 0
      ? 0
      : this.props.delayLongPress || 500;
  },

  touchableGetPressOutDelayMS: function(): number {
    return this.props.delayPressOut || 0;
  },

  render: function(): React.Element<any> {
    // Note(avik): remove dynamic typecast once Flow has been upgraded
    // $FlowFixMe(>=0.41.0)
    const child = React.Children.only(this.props.children);
    let children = child.props.children;
    if (Touchable.TOUCH_TARGET_DEBUG && child.type === View) {
      children = React.Children.toArray(children);
      children.push(
        Touchable.renderDebugView({color: 'red', hitSlop: this.props.hitSlop}),
      );
    }
    return (React: any).cloneElement(child, {
      accessible: this.props.accessible !== false,
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityHint: this.props.accessibilityHint,
      accessibilityComponentType: this.props.accessibilityComponentType,
      accessibilityRole: this.props.accessibilityRole,
      accessibilityStates: this.props.accessibilityStates,
      accessibilityTraits: this.props.accessibilityTraits,
      nativeID: this.props.nativeID,
      testID: this.props.testID,
      onLayout: this.props.onLayout,
      hitSlop: this.props.hitSlop,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this
        .touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
      children,
    });
  },
}): any): React.ComponentType<Props>);

module.exports = TouchableWithoutFeedback;
