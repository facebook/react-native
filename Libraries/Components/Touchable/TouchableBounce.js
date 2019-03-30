/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const Animated = require('Animated');
const Platform = require('Platform');
const React = require('React');
const Touchable = require('Touchable');

import type {PressEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {ViewStyleProp} from 'StyleSheet';
import type {BlurEvent, FocusEvent, TouchableState} from 'Touchable';
import type {Props as TouchableWithoutFeedbackProps} from 'TouchableWithoutFeedback';

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

type Props = $ReadOnly<{|
  ...TouchableWithoutFeedbackProps,

  // The function passed takes a callback to start the animation which should
  // be run after this onPress handler is done. You can use this (for example)
  // to update UI before starting the animation.
  onPressWithCompletion?: ?(fn: () => void) => void,
  // the function passed is called after the animation is complete
  onPressAnimationComplete?: ?() => void,
  /**
   * When the scroll view is disabled, this defines how far your touch may
   * move off of the button, before deactivating the button. Once deactivated,
   * try moving it back and you'll see that the button is once again
   * reactivated! Move it back and forth several times while the scroll view
   * is disabled. Ensure you pass in a constant to reduce memory allocations.
   */
  pressRetentionOffset?: ?EdgeInsetsProp,
  releaseVelocity: number,
  releaseBounciness: number,
  /**
   * Style to apply to the container/underlay. Most commonly used to make sure
   * rounded corners match the wrapped component.
   */
  style?: ?ViewStyleProp,
|}>;

type State = {|
  scale: Animated.Value,

  ...TouchableState,
|};

function createTouchMixin(
  node: React.ElementRef<typeof TouchableBounce>,
): typeof Touchable.MixinWithoutDefaultFocusAndBlur {
  const touchMixin = {...Touchable.MixinWithoutDefaultFocusAndBlur};

  for (const key in touchMixin) {
    if (typeof touchMixin[key] === 'function') {
      touchMixin[key] = touchMixin[key].bind(node);
    }
  }

  return touchMixin;
}

/**
 * Example of using the `TouchableMixin` to play well with other responder
 * locking views including `ScrollView`. `TouchableMixin` provides touchable
 * hooks (`this.touchableHandle*`) that we forward events to. In turn,
 * `TouchableMixin` expects us to implement some abstract methods to handle
 * interesting interactions such as `handleTouchablePress`.
 */
class TouchableBounce extends React.Component<Props, State> {
  static defaultProps = {
    releaseBounciness: 10,
    releaseVelocity: 10,
  };

  _touchMixin: typeof Touchable.MixinWithoutDefaultFocusAndBlur = createTouchMixin(
    this,
  );

  constructor(props: Props) {
    super(props);

    const touchMixin = Touchable.MixinWithoutDefaultFocusAndBlur;
    for (const key in touchMixin) {
      if (
        typeof touchMixin[key] === 'function' &&
        (key.startsWith('_') || key.startsWith('touchable'))
      ) {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key].bind(this);
      }
    }

    Object.keys(touchMixin)
      .filter(key => typeof touchMixin[key] !== 'function')
      .forEach(key => {
        // $FlowFixMe - dynamically adding properties to a class
        (this: any)[key] = touchMixin[key];
      });

    this.state = {
      scale: new Animated.Value(1),
      ...this._touchMixin.touchableGetInitialState(),
    };
  }

  componentDidMount() {
    this._touchMixin.componentDidMount();
  }

  componentWillUnmount() {
    this._touchMixin.componentWillUnmount();
  }

  bounceTo(
    value: number,
    velocity: number,
    bounciness: number,
    callback?: ?() => void,
  ) {
    Animated.spring(this.state.scale, {
      toValue: value,
      velocity,
      bounciness,
      useNativeDriver: true,
    }).start(callback);
  }

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn(e: PressEvent) {
    this.bounceTo(0.93, 0.1, 0);
    this.props.onPressIn && this.props.onPressIn(e);
  }

  touchableHandleActivePressOut(e: PressEvent) {
    this.bounceTo(1, 0.4, 0);
    this.props.onPressOut && this.props.onPressOut(e);
  }

  touchableHandleFocus(e: FocusEvent) {
    if (Platform.isTV) {
      this.bounceTo(0.93, 0.1, 0);
    }
    this.props.onFocus && this.props.onFocus(e);
  }

  touchableHandleBlur(e: BlurEvent) {
    if (Platform.isTV) {
      this.bounceTo(1, 0.4, 0);
    }
    this.props.onBlur && this.props.onBlur(e);
  }

  touchableHandlePress(e: PressEvent) {
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
  }

  touchableGetPressRectOffset(): EdgeInsetsProp {
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  }

  touchableGetHitSlop(): ?EdgeInsetsProp {
    return this.props.hitSlop;
  }

  touchableGetHighlightDelayMS(): number {
    return 0;
  }

  render(): React.Element<any> {
    return (
      <Animated.View
        style={[{transform: [{scale: this.state.scale}]}, this.props.style]}
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        hitSlop={this.props.hitSlop}
        onStartShouldSetResponder={
          this._touchMixin.touchableHandleStartShouldSetResponder
        }
        onResponderTerminationRequest={
          this._touchMixin.touchableHandleResponderTerminationRequest
        }
        onResponderGrant={this._touchMixin.touchableHandleResponderGrant}
        onResponderMove={this._touchMixin.touchableHandleResponderMove}
        onResponderRelease={this._touchMixin.touchableHandleResponderRelease}
        onResponderTerminate={
          this._touchMixin.touchableHandleResponderTerminate
        }>
        {this.props.children}
        {Touchable.renderDebugView({
          color: 'orange',
          hitSlop: this.props.hitSlop,
        })}
      </Animated.View>
    );
  }
}

module.exports = TouchableBounce;
