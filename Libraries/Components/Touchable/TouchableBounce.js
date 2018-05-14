/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const Animated = require('Animated');
const EdgeInsetsPropType = require('EdgeInsetsPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const createReactClass = require('create-react-class');
const PropTypes = require('prop-types');
const Touchable = require('Touchable');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const ViewPropTypes = require('ViewPropTypes');

import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {Props as TouchableWithoutFeedbackProps} from 'TouchableWithoutFeedback';
import type {ViewStyleProp} from 'StyleSheet';

type Event = Object;

type State = {
  animationID: ?number,
  scale: Animated.Value,
};

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type Props = $ReadOnly<{|
  ...TouchableWithoutFeedbackProps,

  onPressWithCompletion?: ?Function,
  onPressAnimationComplete?: ?Function,
  pressRetentionOffset?: ?EdgeInsetsProp,
  releaseVelocity?: ?number,
  releaseBounciness?: ?number,
  style?: ?ViewStyleProp,
|}>;

/**
 * Example of using the `TouchableMixin` to play well with other responder
 * locking views including `ScrollView`. `TouchableMixin` provides touchable
 * hooks (`this.touchableHandle*`) that we forward events to. In turn,
 * `TouchableMixin` expects us to implement some abstract methods to handle
 * interesting interactions such as `handleTouchablePress`.
 */
const TouchableBounce = ((createReactClass({
  displayName: 'TouchableBounce',
  mixins: [Touchable.Mixin, NativeMethodsMixin],

  propTypes: {
    ...TouchableWithoutFeedback.propTypes,

    // The function passed takes a callback to start the animation which should
    // be run after this onPress handler is done. You can use this (for example)
    // to update UI before starting the animation.
    onPressWithCompletion: PropTypes.func,
    // the function passed is called after the animation is complete
    onPressAnimationComplete: PropTypes.func,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: EdgeInsetsPropType,
    releaseVelocity: PropTypes.number.isRequired,
    releaseBounciness: PropTypes.number.isRequired,
    /**
     * Style to apply to the container/underlay. Most commonly used to make sure
     * rounded corners match the wrapped component.
     */
    style: ViewPropTypes.style,
  },

  getDefaultProps: function() {
    return {releaseBounciness: 10, releaseVelocity: 10};
  },

  getInitialState: function(): State {
    return {
      ...this.touchableGetInitialState(),
      scale: new Animated.Value(1),
    };
  },

  bounceTo: function(
    value: number,
    velocity: number,
    bounciness: number,
    callback?: ?Function,
  ) {
    Animated.spring(this.state.scale, {
      toValue: value,
      velocity,
      bounciness,
      useNativeDriver: true,
    }).start(callback);
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function(e: Event) {
    this.bounceTo(0.93, 0.1, 0);
    this.props.onPressIn && this.props.onPressIn(e);
  },

  touchableHandleActivePressOut: function(e: Event) {
    this.bounceTo(1, 0.4, 0);
    this.props.onPressOut && this.props.onPressOut(e);
  },

  touchableHandlePress: function(e: Event) {
    const onPressWithCompletion = this.props.onPressWithCompletion;
    if (onPressWithCompletion) {
      onPressWithCompletion(() => {
        this.state.scale.setValue(0.93);
        this.bounceTo(
          1,
          this.props.releaseVelocity,
          this.props.releaseBounciness,
          this.props.onPressAnimationComplete,
        );
      });
      return;
    }

    this.bounceTo(
      1,
      this.props.releaseVelocity,
      this.props.releaseBounciness,
      this.props.onPressAnimationComplete,
    );
    this.props.onPress && this.props.onPress(e);
  },

  touchableGetPressRectOffset: function(): typeof PRESS_RETENTION_OFFSET {
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  },

  touchableGetHitSlop: function(): ?Object {
    return this.props.hitSlop;
  },

  touchableGetHighlightDelayMS: function(): number {
    return 0;
  },

  render: function(): React.Element<any> {
    return (
      <Animated.View
        style={[{transform: [{scale: this.state.scale}]}, this.props.style]}
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityComponentType={this.props.accessibilityComponentType}
        accessibilityTraits={this.props.accessibilityTraits}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        hitSlop={this.props.hitSlop}
        onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
        onResponderTerminationRequest={
          this.touchableHandleResponderTerminationRequest
        }
        onResponderGrant={this.touchableHandleResponderGrant}
        onResponderMove={this.touchableHandleResponderMove}
        onResponderRelease={this.touchableHandleResponderRelease}
        onResponderTerminate={this.touchableHandleResponderTerminate}>
        {this.props.children}
        {Touchable.renderDebugView({
          color: 'orange',
          hitSlop: this.props.hitSlop,
        })}
      </Animated.View>
    );
  },
}): any): React.ComponentType<Props>);

module.exports = TouchableBounce;
