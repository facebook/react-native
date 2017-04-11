/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableWithoutFeedback
 * @flow
 */
'use strict';

const EdgeInsetsPropType = require('EdgeInsetsPropType');
const React = require('React');
const TimerMixin = require('react-timer-mixin');
const Touchable = require('Touchable');

const ensurePositiveDelayProps = require('ensurePositiveDelayProps');
const warning = require('fbjs/lib/warning');

const {
  AccessibilityComponentTypes,
  AccessibilityTraits,
} = require('ViewAccessibility');

type Event = Object;

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

/**
 * Do not use unless you have a very good reason. All the elements that
 * respond to press should have a visual feedback when touched.
 *
 * TouchableWithoutFeedback supports only one child.
 * If you wish to have several child components, wrap them in a View.
 */
// $FlowFixMe(>=0.41.0)
const TouchableWithoutFeedback = React.createClass({
  mixins: [TimerMixin, Touchable.Mixin],

  propTypes: {
    accessible: React.PropTypes.bool,
    accessibilityComponentType: React.PropTypes.oneOf(
      AccessibilityComponentTypes
    ),
    accessibilityTraits: React.PropTypes.oneOfType([
      React.PropTypes.oneOf(AccessibilityTraits),
      React.PropTypes.arrayOf(React.PropTypes.oneOf(AccessibilityTraits)),
    ]),
    /**
     * If true, disable all interactions for this component.
     */
    disabled: React.PropTypes.bool,
    /**
     * Called when the touch is released, but not if cancelled (e.g. by a scroll
     * that steals the responder lock).
     */
    onPress: React.PropTypes.func,
    onPressIn: React.PropTypes.func,
    onPressOut: React.PropTypes.func,
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: React.PropTypes.func,

    onLongPress: React.PropTypes.func,

    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn: React.PropTypes.number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut: React.PropTypes.number,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress: React.PropTypes.number,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: EdgeInsetsPropType,
    /**
     * This defines how far your touch can start away from the button. This is
     * added to `pressRetentionOffset` when moving off of the button.
     * ** NOTE **
     * The touch area never extends past the parent view bounds and the Z-index
     * of sibling views always takes precedence if a touch hits two overlapping
     * views.
     */
    hitSlop: EdgeInsetsPropType,
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  componentDidMount: function() {
    ensurePositiveDelayProps(this.props);
  },

  componentWillReceiveProps: function(nextProps: Object) {
    ensurePositiveDelayProps(nextProps);
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandlePress: function(e: Event) {
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleActivePressIn: function(e: Event) {
    this.props.onPressIn && this.props.onPressIn(e);
  },

  touchableHandleActivePressOut: function(e: Event) {
    this.props.onPressOut && this.props.onPressOut(e);
  },

  touchableHandleLongPress: function(e: Event) {
    this.props.onLongPress && this.props.onLongPress(e);
  },

  touchableGetPressRectOffset: function(): typeof PRESS_RETENTION_OFFSET {
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  },

  touchableGetHitSlop: function(): ?Object {
    return this.props.hitSlop;
  },

  touchableGetHighlightDelayMS: function(): number {
    return this.props.delayPressIn || 0;
  },

  touchableGetLongPressDelayMS: function(): number {
    return this.props.delayLongPress === 0 ? 0 :
      this.props.delayLongPress || 500;
  },

  touchableGetPressOutDelayMS: function(): number {
    return this.props.delayPressOut || 0;
  },

  render: function(): React.Element<any> {
    // Note(avik): remove dynamic typecast once Flow has been upgraded
    // $FlowFixMe(>=0.41.0)
    const child = React.Children.only(this.props.children);
    let children = child.props.children;
    warning(
      !child.type || child.type.displayName !== 'Text',
      'TouchableWithoutFeedback does not work well with Text children. Wrap children in a View instead. See ' +
        ((child._owner && child._owner.getName && child._owner.getName()) || '<unknown>')
    );
    if (Touchable.TOUCH_TARGET_DEBUG && child.type && child.type.displayName === 'View') {
      children = React.Children.toArray(children);
      children.push(Touchable.renderDebugView({color: 'red', hitSlop: this.props.hitSlop}));
    }
    const style = (Touchable.TOUCH_TARGET_DEBUG && child.type && child.type.displayName === 'Text') ?
      [child.props.style, {color: 'red'}] :
      child.props.style;
    return (React: any).cloneElement(child, {
      accessible: this.props.accessible !== false,
      // $FlowFixMe(>=0.41.0)
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityComponentType: this.props.accessibilityComponentType,
      accessibilityTraits: this.props.accessibilityTraits,
      // $FlowFixMe(>=0.41.0)
      nativeID: this.props.nativeID,
      // $FlowFixMe(>=0.41.0)
      testID: this.props.testID,
      onLayout: this.props.onLayout,
      hitSlop: this.props.hitSlop,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this.touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
      style,
      children,
    });
  }
});

module.exports = TouchableWithoutFeedback;
