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

const React = require('React');
const Touchable = require('Touchable');
const View = require('View');

const ensurePositiveDelayProps = require('ensurePositiveDelayProps');

import type {SyntheticEvent, LayoutEvent, PressEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {TouchableState} from 'Touchable';
import type {
  AccessibilityComponentType,
  AccessibilityRole,
  AccessibilityStates,
  AccessibilityTraits,
} from 'ViewAccessibility';

type TargetEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
  |}>,
>;

type BlurEvent = TargetEvent;
type FocusEvent = TargetEvent;

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

const OVERRIDE_PROPS = [
  'accessibilityComponentType',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityIgnoresInvertColors',
  'accessibilityRole',
  'accessibilityStates',
  'accessibilityTraits',
  'hitSlop',
  'nativeID',
  'onBlur',
  'onFocus',
  'onLayout',
  'testID',
];

export type Props = $ReadOnly<{|
  accessible?: ?boolean,
  accessibilityComponentType?: ?AccessibilityComponentType,
  accessibilityLabel?: ?Stringish,
  accessibilityHint?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityRole?: ?AccessibilityRole,
  accessibilityStates?: ?AccessibilityStates,
  accessibilityTraits?: ?AccessibilityTraits,
  children?: ?React.Node,
  /**
   * Delay in ms, from onPressIn, before onLongPress is called.
   */
  delayLongPress?: ?number,
  /**
   * Delay in ms, from the start of the touch, before onPressIn is called.
   */
  delayPressIn?: ?number,
  /**
   * Delay in ms, from the release of the touch, before onPressOut is called.
   */
  delayPressOut?: ?number,
  /**
   * If true, disable all interactions for this component.
   */
  disabled?: ?boolean,
  /**
   * This defines how far your touch can start away from the button. This is
   * added to `pressRetentionOffset` when moving off of the button.
   * ** NOTE **
   * The touch area never extends past the parent view bounds and the Z-index
   * of sibling views always takes precedence if a touch hits two overlapping
   * views.
   */
  hitSlop?: ?EdgeInsetsProp,
  nativeID?: ?string,
  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "blur" occurs, meaning the element lost focus.
   * Some platforms may not have the concept of blur.
   */
  onBlur?: ?(e: BlurEvent) => void,
  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "focus" occurs. Some platforms may not have
   * the concept of focus.
   */
  onFocus?: ?(e: FocusEvent) => void,
  /**
   * Invoked on mount and layout changes with
   *
   *   `{nativeEvent: {layout: {x, y, width, height}}}`
   */
  onLayout?: ?(event: LayoutEvent) => mixed,
  onLongPress?: ?(event: PressEvent) => mixed,
  /**
   * Called when the touch is released, but not if cancelled (e.g. by a scroll
   * that steals the responder lock).
   */
  onPress?: ?(event: PressEvent) => mixed,
  /**
   * Called as soon as the touchable element is pressed and invoked even before onPress.
   * This can be useful when making network requests.
   */
  onPressIn?: ?(event: PressEvent) => mixed,
  /**
   * Called as soon as the touch is released even before onPress.
   */
  onPressOut?: ?(event: PressEvent) => mixed,
  /**
   * When the scroll view is disabled, this defines how far your touch may
   * move off of the button, before deactivating the button. Once deactivated,
   * try moving it back and you'll see that the button is once again
   * reactivated! Move it back and forth several times while the scroll view
   * is disabled. Ensure you pass in a constant to reduce memory allocations.
   */
  pressRetentionOffset?: ?EdgeInsetsProp,
  rejectResponderTermination?: ?boolean,
  testID?: ?string,
|}>;

function createTouchMixin(
  node: React.ElementRef<typeof TouchableWithoutFeedback>,
): typeof Touchable.Mixin {
  const touchMixin = {...Touchable.Mixin};

  for (const key in touchMixin) {
    if (typeof touchMixin[key] === 'function') {
      touchMixin[key] = touchMixin[key].bind(node);
    }
  }

  return touchMixin;
}

/**
 * Do not use unless you have a very good reason. All elements that
 * respond to press should have a visual feedback when touched.
 *
 * TouchableWithoutFeedback supports only one child.
 * If you wish to have several child components, wrap them in a View.
 */
class TouchableWithoutFeedback extends React.Component<Props, TouchableState> {
  /**
   * Part 1: Removing Touchable.Mixin:
   *
   * 1. Mixin methods should be flow typed. That's why we create a
   *    copy of Touchable.Mixin and attach it to this._touchMixin.
   *    Otherwise, we'd have to manually declare each method on the component
   *    class and assign it a flow type.
   * 2. Mixin methods can call component methods, and access the component's
   *    props and state. So, we need to bind all mixin methods to the
   *    component instance.
   * 3. Continued...
   */
  _touchMixin: typeof Touchable.Mixin = createTouchMixin(this);

  _isMounted: boolean;

  constructor(props: Props) {
    super(props);

    /**
     * Part 2: Removing Touchable.Mixin
     *
     * 3. Mixin methods access other mixin methods via dynamic dispatch using
     *    this. Since mixin methods are bound to the component instance, we need
     *    to copy all mixin methods to the component instance.
     */
    const touchMixin = Touchable.Mixin;
    for (const key in touchMixin) {
      if (
        typeof touchMixin[key] === 'function' &&
        (key.startsWith('_') || key.startsWith('touchable'))
      ) {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key].bind(this);
      }
    }

    /**
     * Part 3: Removing Touchable.Mixin
     *
     * 4. Mixins can initialize properties and use properties on the component
     *    instance.
     */
    Object.keys(touchMixin)
      .filter(key => typeof touchMixin[key] !== 'function')
      .forEach(key => {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key];
      });

    this.state = this._touchMixin.touchableGetInitialState();
  }

  componentDidMount() {
    ensurePositiveDelayProps(this.props);

    this._touchMixin.componentDidMount();
  }

  componentDidUpdate(prevProps: Props, prevState: TouchableState) {
    ensurePositiveDelayProps(this.props);
  }

  componentWillUnmount() {
    this._touchMixin.componentWillUnmount();
  }

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandlePress(e: PressEvent) {
    this.props.onPress && this.props.onPress(e);
  }

  touchableHandleActivePressIn(e: PressEvent) {
    this.props.onPressIn && this.props.onPressIn(e);
  }

  touchableHandleActivePressOut(e: PressEvent) {
    this.props.onPressOut && this.props.onPressOut(e);
  }

  touchableHandleLongPress(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  }

  touchableGetPressRectOffset(): EdgeInsetsProp {
    // $FlowFixMe Invalid prop usage
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  }

  touchableGetHitSlop(): ?EdgeInsetsProp {
    return this.props.hitSlop;
  }

  touchableGetHighlightDelayMS(): number {
    return this.props.delayPressIn || 0;
  }

  touchableGetLongPressDelayMS(): number {
    return this.props.delayLongPress === 0
      ? 0
      : this.props.delayLongPress || 500;
  }

  touchableGetPressOutDelayMS(): number {
    return this.props.delayPressOut || 0;
  }

  render(): React.Element<any> {
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

    const overrides = {};
    for (const prop of OVERRIDE_PROPS) {
      if (this.props[prop] !== undefined) {
        overrides[prop] = this.props[prop];
      }
    }

    return (React: any).cloneElement(child, {
      ...overrides,
      accessible: this.props.accessible !== false,
      onStartShouldSetResponder: this._touchMixin
        .touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this._touchMixin
        .touchableHandleResponderTerminationRequest,
      onResponderGrant: this._touchMixin.touchableHandleResponderGrant,
      onResponderMove: this._touchMixin.touchableHandleResponderMove,
      onResponderRelease: this._touchMixin.touchableHandleResponderRelease,
      onResponderTerminate: this._touchMixin.touchableHandleResponderTerminate,
      children,
    });
  }
}

module.exports = TouchableWithoutFeedback;
