/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AnimatedImplementation
 * @flow
 */
'use strict';

var Easing = require('Easing');
var InteractionManager = require('InteractionManager');
var Interpolation = require('Interpolation');
var React = require('React');
var Set = require('Set');
var SpringConfig = require('SpringConfig');
var ViewStylePropTypes = require('ViewStylePropTypes');

var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var requestAnimationFrame = require('requestAnimationFrame');

import type { InterpolationConfigType } from 'Interpolation';

type EndResult = {finished: bool};
type EndCallback = (result: EndResult) => void;

// Note(vjeux): this would be better as an interface but flow doesn't
// support them yet
class Animated {
  __attach(): void {}
  __detach(): void {}
  __getValue(): any {}
  __getAnimatedValue(): any { return this.__getValue(); }
  __addChild(child: Animated) {}
  __removeChild(child: Animated) {}
  __getChildren(): Array<Animated> { return []; }
}

type AnimationConfig = {
  isInteraction?: bool;
};

// Important note: start() and stop() will only be called at most once.
// Once an animation has been stopped or finished its course, it will
// not be reused.
class Animation {
  __active: bool;
  __isInteraction: bool;
  __onEnd: ?EndCallback;
  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
  ): void {}
  stop(): void {}
  // Helper function for subclasses to make sure onEnd is only called once.
  __debouncedOnEnd(result: EndResult) {
    var onEnd = this.__onEnd;
    this.__onEnd = null;
    onEnd && onEnd(result);
  }
}

class AnimatedWithChildren extends Animated {
  _children: Array<Animated>;

  constructor() {
    super();
    this._children = [];
  }

  __addChild(child: Animated): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
  }

  __removeChild(child: Animated): void {
    var index = this._children.indexOf(child);
    if (index === -1) {
      console.warn('Trying to remove a child that doesn\'t exist');
      return;
    }
    this._children.splice(index, 1);
    if (this._children.length === 0) {
      this.__detach();
    }
  }

  __getChildren(): Array<Animated> {
    return this._children;
  }
}

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 *               new Animated.Value(0)
 *     .interpolate()        .interpolate()    new Animated.Value(1)
 *         opacity               translateY      scale
 *          style                         transform
 *         View#234                         style
 *                                         View#123
 *
 * A) Top Down phase
 * When an Animated.Value is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two-phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */
function _flush(rootNode: AnimatedValue): void {
  var animatedStyles = new Set();
  function findAnimatedStyles(node) {
    if (typeof node.update === 'function') {
      animatedStyles.add(node);
    } else {
      node.__getChildren().forEach(findAnimatedStyles);
    }
  }
  findAnimatedStyles(rootNode);
  animatedStyles.forEach(animatedStyle => animatedStyle.update());
}

type TimingAnimationConfig =  AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY;
  easing?: (value: number) => number;
  duration?: number;
  delay?: number;
};

type TimingAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue;
  easing?: (value: number) => number;
  duration?: number;
  delay?: number;
};

var easeInOut = Easing.inOut(Easing.ease);

class TimingAnimation extends Animation {
  _startTime: number;
  _fromValue: number;
  _toValue: any;
  _duration: number;
  _delay: number;
  _easing: (value: number) => number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _timeout: any;

  constructor(
    config: TimingAnimationConfigSingle,
  ) {
    super();
    this._toValue = config.toValue;
    this._easing = config.easing || easeInOut;
    this._duration = config.duration !== undefined ? config.duration : 500;
    this._delay = config.delay || 0;
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
  ): void {
    this.__active = true;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;

    var start = () => {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
        this.__debouncedOnEnd({finished: true});
      } else {
        this._startTime = Date.now();
        this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
      }
    };
    if (this._delay) {
      this._timeout = setTimeout(start, this._delay);
    } else {
      start();
    }
  }

  onUpdate(): void {
    var now = Date.now();
    if (now >= this._startTime + this._duration) {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
      } else {
        this._onUpdate(
          this._fromValue + this._easing(1) * (this._toValue - this._fromValue)
        );
      }
      this.__debouncedOnEnd({finished: true});
      return;
    }

    this._onUpdate(
      this._fromValue +
        this._easing((now - this._startTime) / this._duration) *
        (this._toValue - this._fromValue)
    );
    if (this.__active) {
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    this.__active = false;
    clearTimeout(this._timeout);
    window.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

type DecayAnimationConfig = AnimationConfig & {
  velocity: number | {x: number, y: number};
  deceleration?: number;
};

type DecayAnimationConfigSingle = AnimationConfig & {
  velocity: number;
  deceleration?: number;
};

class DecayAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _deceleration: number;
  _velocity: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;

  constructor(
    config: DecayAnimationConfigSingle,
  ) {
    super();
    this._deceleration = config.deceleration || 0.998;
    this._velocity = config.velocity;
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
  ): void {
    this.__active = true;
    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._startTime = Date.now();
    this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
  }

  onUpdate(): void {
    var now = Date.now();

    var value = this._fromValue +
      (this._velocity / (1 - this._deceleration)) *
      (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));

    this._onUpdate(value);

    if (Math.abs(this._lastValue - value) < 0.1) {
      this.__debouncedOnEnd({finished: true});
      return;
    }

    this._lastValue = value;
    if (this.__active) {
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    this.__active = false;
    window.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

type SpringAnimationConfig = AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY;
  overshootClamping?: bool;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  velocity?: number | {x: number, y: number};
  bounciness?: number;
  speed?: number;
  tension?: number;
  friction?: number;
};

type SpringAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue;
  overshootClamping?: bool;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  velocity?: number;
  bounciness?: number;
  speed?: number;
  tension?: number;
  friction?: number;
};

function withDefault<T>(value: ?T, defaultValue: T): T {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
}

class SpringAnimation extends Animation {
  _overshootClamping: bool;
  _restDisplacementThreshold: number;
  _restSpeedThreshold: number;
  _initialVelocity: ?number;
  _lastVelocity: number;
  _startPosition: number;
  _lastPosition: number;
  _fromValue: number;
  _toValue: any;
  _tension: number;
  _friction: number;
  _lastTime: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;

  constructor(
    config: SpringAnimationConfigSingle,
  ) {
    super();

    this._overshootClamping = withDefault(config.overshootClamping, false);
    this._restDisplacementThreshold = withDefault(config.restDisplacementThreshold, 0.001);
    this._restSpeedThreshold = withDefault(config.restSpeedThreshold, 0.001);
    this._initialVelocity = config.velocity;
    this._lastVelocity = withDefault(config.velocity, 0);
    this._toValue = config.toValue;
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;

    var springConfig;
    if (config.bounciness !== undefined || config.speed !== undefined) {
      invariant(
        config.tension === undefined && config.friction === undefined,
        'You can only define bounciness/speed or tension/friction but not both',
      );
      springConfig = SpringConfig.fromBouncinessAndSpeed(
        withDefault(config.bounciness, 8),
        withDefault(config.speed, 12),
      );
    } else {
      springConfig = SpringConfig.fromOrigamiTensionAndFriction(
        withDefault(config.tension, 40),
        withDefault(config.friction, 7),
      );
    }
    this._tension = springConfig.tension;
    this._friction = springConfig.friction;
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
  ): void {
    this.__active = true;
    this._startPosition = fromValue;
    this._lastPosition = this._startPosition;

    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._lastTime = Date.now();

    if (previousAnimation instanceof SpringAnimation) {
      var internalState = previousAnimation.getInternalState();
      this._lastPosition = internalState.lastPosition;
      this._lastVelocity = internalState.lastVelocity;
      this._lastTime = internalState.lastTime;
    }
    if (this._initialVelocity !== undefined &&
        this._initialVelocity !== null) {
      this._lastVelocity = this._initialVelocity;
    }
    this.onUpdate();
  }

  getInternalState(): Object {
    return {
      lastPosition: this._lastPosition,
      lastVelocity: this._lastVelocity,
      lastTime: this._lastTime,
    };
  }

  onUpdate(): void {
    var position = this._lastPosition;
    var velocity = this._lastVelocity;

    var tempPosition = this._lastPosition;
    var tempVelocity = this._lastVelocity;

    // If for some reason we lost a lot of frames (e.g. process large payload or
    // stopped in the debugger), we only advance by 4 frames worth of
    // computation and will continue on the next frame. It's better to have it
    // running at faster speed than jumping to the end.
    var MAX_STEPS = 64;
    var now = Date.now();
    if (now > this._lastTime + MAX_STEPS) {
      now = this._lastTime + MAX_STEPS;
    }

    // We are using a fixed time step and a maximum number of iterations.
    // The following post provides a lot of thoughts into how to build this
    // loop: http://gafferongames.com/game-physics/fix-your-timestep/
    var TIMESTEP_MSEC = 1;
    var numSteps = Math.floor((now - this._lastTime) / TIMESTEP_MSEC);

    for (var i = 0; i < numSteps; ++i) {
      // Velocity is based on seconds instead of milliseconds
      var step = TIMESTEP_MSEC / 1000;

      // This is using RK4. A good blog post to understand how it works:
      // http://gafferongames.com/game-physics/integration-basics/
      var aVelocity = velocity;
      var aAcceleration = this._tension * (this._toValue - tempPosition) - this._friction * tempVelocity;
      var tempPosition = position + aVelocity * step / 2;
      var tempVelocity = velocity + aAcceleration * step / 2;

      var bVelocity = tempVelocity;
      var bAcceleration = this._tension * (this._toValue - tempPosition) - this._friction * tempVelocity;
      tempPosition = position + bVelocity * step / 2;
      tempVelocity = velocity + bAcceleration * step / 2;

      var cVelocity = tempVelocity;
      var cAcceleration = this._tension * (this._toValue - tempPosition) - this._friction * tempVelocity;
      tempPosition = position + cVelocity * step / 2;
      tempVelocity = velocity + cAcceleration * step / 2;

      var dVelocity = tempVelocity;
      var dAcceleration = this._tension * (this._toValue - tempPosition) - this._friction * tempVelocity;
      tempPosition = position + cVelocity * step / 2;
      tempVelocity = velocity + cAcceleration * step / 2;

      var dxdt = (aVelocity + 2 * (bVelocity + cVelocity) + dVelocity) / 6;
      var dvdt = (aAcceleration + 2 * (bAcceleration + cAcceleration) + dAcceleration) / 6;

      position += dxdt * step;
      velocity += dvdt * step;
    }

    this._lastTime = now;
    this._lastPosition = position;
    this._lastVelocity = velocity;

    this._onUpdate(position);
    if (!this.__active) { // a listener might have stopped us in _onUpdate
      return;
    }

    // Conditions for stopping the spring animation
    var isOvershooting = false;
    if (this._overshootClamping && this._tension !== 0) {
      if (this._startPosition < this._toValue) {
        isOvershooting = position > this._toValue;
      } else {
        isOvershooting = position < this._toValue;
      }
    }
    var isVelocity = Math.abs(velocity) <= this._restSpeedThreshold;
    var isDisplacement = true;
    if (this._tension !== 0) {
      isDisplacement = Math.abs(this._toValue - position) <= this._restDisplacementThreshold;
    }

    if (isOvershooting || (isVelocity && isDisplacement)) {
      if (this._tension !== 0) {
        // Ensure that we end up with a round value
        this._onUpdate(this._toValue);
      }

      this.__debouncedOnEnd({finished: true});
      return;
    }
    this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
  }

  stop(): void {
    this.__active = false;
    window.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

type ValueListenerCallback = (state: {value: number}) => void;

var _uniqueId = 1;

/**
 * Standard value for driving animations.  One `Animated.Value` can drive
 * multiple properties in a synchronized fashion, but can only be driven by one
 * mechanism at a time.  Using a new mechanism (e.g. starting a new animation,
 * or calling `setValue`) will stop any previous ones.
 */
class AnimatedValue extends AnimatedWithChildren {
  _value: number;
  _offset: number;
  _animation: ?Animation;
  _tracking: ?Animated;
  _listeners: {[key: string]: ValueListenerCallback};

  constructor(value: number) {
    super();
    this._value = value;
    this._offset = 0;
    this._animation = null;
    this._listeners = {};
  }

  __detach() {
    this.stopAnimation();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  /**
   * Directly set the value.  This will stop any animations running on the value
   * and udpate all the bound properties.
   */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(value);
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether via
   * `setValue`, an animation, or `Animated.event`.  Useful for compensating
   * things like the start of a pan gesture.
   */
  setOffset(offset: number): void {
    this._offset = offset;
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   */
  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations or whathaveyou.  This is useful because there is no way to
   * syncronously read the value because it might be driven natively.
   */
  addListener(callback: ValueListenerCallback): string {
    var id = String(_uniqueId++);
    this._listeners[id] = callback;
    return id;
  }

  removeListener(id: string): void {
    delete this._listeners[id];
  }

  removeAllListeners(): void {
    this._listeners = {};
  }

  /**
   * Stops any running animation or tracking.  `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   */
  stopAnimation(callback?: ?(value: number) => void): void {
    this.stopTracking();
    this._animation && this._animation.stop();
    this._animation = null;
    callback && callback(this.__getValue());
  }

  /**
   * Interpolates the value before updating the property, e.g. mapping 0-1 to
   * 0-10.
   */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, Interpolation.create(config));
  }

  /**
   * Typically only used internally, but could be used by a custom Animation
   * class.
   */
  animate(animation: Animation, callback: ?EndCallback): void {
    var handle = null;
    if (animation.__isInteraction) {
      handle = InteractionManager.createInteractionHandle();
    }
    var previousAnimation = this._animation;
    this._animation && this._animation.stop();
    this._animation = animation;
    animation.start(
      this._value,
      (value) => {
        this._updateValue(value);
      },
      (result) => {
        this._animation = null;
        if (handle !== null) {
          InteractionManager.clearInteractionHandle(handle);
        }
        callback && callback(result);
      },
      previousAnimation,
    );
  }

  /**
   * Typically only used internally.
   */
  stopTracking(): void {
    this._tracking && this._tracking.__detach();
    this._tracking = null;
  }

  /**
   * Typically only used internally.
   */
  track(tracking: Animated): void {
    this.stopTracking();
    this._tracking = tracking;
  }

  _updateValue(value: number): void {
    this._value = value;
    _flush(this);
    for (var key in this._listeners) {
      this._listeners[key]({value: this.__getValue()});
    }
  }
}

type ValueXYListenerCallback = (value: {x: number; y: number}) => void;

/**
 * 2D Value for driving 2D animations, such as pan gestures.  Almost identical
 * API to normal `Animated.Value`, but multiplexed.  Contains two regular
 * `Animated.Value`s under the hood.  Example:
 *
 *```javascript
 *  class DraggableView extends React.Component {
 *    constructor(props) {
 *      super(props);
 *      this.state = {
 *        pan: new Animated.ValueXY(), // inits to zero
 *      };
 *      this.state.panResponder = PanResponder.create({
 *        onStartShouldSetPanResponder: () => true,
 *        onPanResponderMove: Animated.event([null, {
 *          dx: this.state.pan.x, // x,y are Animated.Value
 *          dy: this.state.pan.y,
 *        }]),
 *        onPanResponderRelease: () => {
 *          Animated.spring(
 *            this.state.pan,         // Auto-multiplexed
 *            {toValue: {x: 0, y: 0}} // Back to zero
 *          ).start();
 *        },
 *      });
 *    }
 *    render() {
 *      return (
 *        <Animated.View
 *          {...this.state.panResponder.panHandlers}
 *          style={this.state.pan.getLayout()}>
 *          {this.props.children}
 *        </Animated.View>
 *      );
 *    }
 *  }
 *```
 */
class AnimatedValueXY extends AnimatedWithChildren {
  x: AnimatedValue;
  y: AnimatedValue;
  _listeners: {[key: string]: {x: string; y: string}};

  constructor(valueIn?: ?{x: number | AnimatedValue; y: number | AnimatedValue}) {
    super();
    var value: any = valueIn || {x: 0, y: 0};  // @flowfixme: shouldn't need `: any`
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      this.x = new AnimatedValue(value.x);
      this.y = new AnimatedValue(value.y);
    } else {
      invariant(
        value.x instanceof AnimatedValue &&
        value.y instanceof AnimatedValue,
        'AnimatedValueXY must be initalized with an object of numbers or ' +
        'AnimatedValues.'
      );
      this.x = value.x;
      this.y = value.y;
    }
    this._listeners = {};
  }

  setValue(value: {x: number; y: number}) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  setOffset(offset: {x: number; y: number}) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  __getValue(): {x: number; y: number} {
    return {
      x: this.x.__getValue(),
      y: this.y.__getValue(),
    };
  }

  stopAnimation(callback?: ?() => number): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback && callback(this.__getValue());
  }

  addListener(callback: ValueXYListenerCallback): string {
    var id = String(_uniqueId++);
    var jointCallback = ({value: number}) => {
      callback(this.__getValue());
    };
    this._listeners[id] = {
      x: this.x.addListener(jointCallback),
      y: this.y.addListener(jointCallback),
    };
    return id;
  }

  removeListener(id: string): void {
    this.x.removeListener(this._listeners[id].x);
    this.y.removeListener(this._listeners[id].y);
    delete this._listeners[id];
  }

  /**
   * Converts `{x, y}` into `{left, top}` for use in style, e.g.
   *
   *```javascript
   *  style={this.state.anim.getLayout()}
   *```
   */
  getLayout(): {[key: string]: AnimatedValue} {
    return {
      left: this.x,
      top: this.y,
    };
  }

  /**
   * Converts `{x, y}` into a useable translation transform, e.g.
   *
   *```javascript
   *  style={{
   *    transform: this.state.anim.getTranslateTransform()
   *  }}
   *```
   */
  getTranslateTransform(): Array<{[key: string]: AnimatedValue}> {
    return [
      {translateX: this.x},
      {translateY: this.y}
    ];
  }
}

class AnimatedInterpolation extends AnimatedWithChildren {
  _parent: Animated;
  _interpolation: (input: number) => number | string;

  constructor(parent: Animated, interpolation: (input: number) => number | string) {
    super();
    this._parent = parent;
    this._interpolation = interpolation;
  }

  __getValue(): number | string {
    var parentValue: number = this._parent.__getValue();
    invariant(
      typeof parentValue === 'number',
      'Cannot interpolate an input which is not a number.'
    );
    return this._interpolation(parentValue);
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, Interpolation.create(config));
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
  }
}

class AnimatedTransform extends AnimatedWithChildren {
  _transforms: Array<Object>;

  constructor(transforms: Array<Object>) {
    super();
    this._transforms = transforms;
  }

  __getValue(): Array<Object> {
    return this._transforms.map(transform => {
      var result = {};
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          result[key] = value.__getValue();
        } else {
          result[key] = value;
        }
      }
      return result;
    });
  }

  __getAnimatedValue(): Array<Object> {
    return this._transforms.map(transform => {
      var result = {};
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          result[key] = value.__getAnimatedValue();
        } else {
          // All transform components needed to recompose matrix
          result[key] = value;
        }
      }
      return result;
    });
  }

  __attach(): void {
    this._transforms.forEach(transform => {
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          value.__addChild(this);
        }
      }
    });
  }

  __detach(): void {
    this._transforms.forEach(transform => {
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          value.__removeChild(this);
        }
      }
    });
  }
}

class AnimatedStyle extends AnimatedWithChildren {
  _style: Object;

  constructor(style: any) {
    super();
    style = flattenStyle(style) || {};
    if (style.transform) {
      style = {
        ...style,
        transform: new AnimatedTransform(style.transform),
      };
    }
    this._style = style;
  }

  __getValue(): Object {
    var style = {};
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        style[key] = value.__getValue();
      } else {
        style[key] = value;
      }
    }
    return style;
  }

  __getAnimatedValue(): Object {
    var style = {};
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        style[key] = value.__getAnimatedValue();
      }
    }
    return style;
  }

  __attach(): void {
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        value.__removeChild(this);
      }
    }
  }
}

class AnimatedProps extends Animated {
  _props: Object;
  _callback: () => void;

  constructor(
    props: Object,
    callback: () => void,
  ) {
    super();
    if (props.style) {
      props = {
        ...props,
        style: new AnimatedStyle(props.style),
      };
    }
    this._props = props;
    this._callback = callback;
    this.__attach();
  }

  __getValue(): Object {
    var props = {};
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        props[key] = value.__getValue();
      } else {
        props[key] = value;
      }
    }
    return props;
  }

  __getAnimatedValue(): Object {
    var props = {};
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        props[key] = value.__getAnimatedValue();
      }
    }
    return props;
  }

  __attach(): void {
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        value.__removeChild(this);
      }
    }
  }

  update(): void {
    this._callback();
  }
}

function createAnimatedComponent(Component: any): any {
  var refName = 'node';

  class AnimatedComponent extends React.Component {
    _propsAnimated: AnimatedProps;

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
    }

    setNativeProps(props) {
      this.refs[refName].setNativeProps(props);
    }

    componentWillMount() {
      this.attachProps(this.props);
    }

    attachProps(nextProps) {
      var oldPropsAnimated = this._propsAnimated;

      // The system is best designed when setNativeProps is implemented. It is
      // able to avoid re-rendering and directly set the attributes that
      // changed. However, setNativeProps can only be implemented on leaf
      // native components. If you want to animate a composite component, you
      // need to re-render it. In this case, we have a fallback that uses
      // forceUpdate.
      var callback = () => {
        if (this.refs[refName].setNativeProps) {
          var value = this._propsAnimated.__getAnimatedValue();
          this.refs[refName].setNativeProps(value);
        } else {
          this.forceUpdate();
        }
      };

      this._propsAnimated = new AnimatedProps(
        nextProps,
        callback,
      );

      // When you call detach, it removes the element from the parent list
      // of children. If it goes to 0, then the parent also detaches itself
      // and so on.
      // An optimization is to attach the new elements and THEN detach the old
      // ones instead of detaching and THEN attaching.
      // This way the intermediate state isn't to go to 0 and trigger
      // this expensive recursive detaching to then re-attach everything on
      // the very next operation.
      oldPropsAnimated && oldPropsAnimated.__detach();
    }

    componentWillReceiveProps(nextProps) {
      this.attachProps(nextProps);
    }

    render() {
      return (
        <Component
          {...this._propsAnimated.__getValue()}
          ref={refName}
        />
      );
    }
  }
  AnimatedComponent.propTypes = {
    style: function(props, propName, componentName) {
      for (var key in ViewStylePropTypes) {
        if (!Component.propTypes[key] && props[key] !== undefined) {
          console.error(
            'You are setting the style `{ ' + key + ': ... }` as a prop. You ' +
            'should nest it in a style object. ' +
            'E.g. `{ style: { ' + key + ': ... } }`'
          );
        }
      }
    }
  };

  return AnimatedComponent;
}

class AnimatedTracking extends Animated {
  _value: AnimatedValue;
  _parent: Animated;
  _callback: ?EndCallback;
  _animationConfig: Object;
  _animationClass: any;

  constructor(
    value: AnimatedValue,
    parent: Animated,
    animationClass: any,
    animationConfig: Object,
    callback?: ?EndCallback,
  ) {
    super();
    this._value = value;
    this._parent = parent;
    this._animationClass = animationClass;
    this._animationConfig = animationConfig;
    this._callback = callback;
    this.__attach();
  }

  __getValue(): Object {
    return this._parent.__getValue();
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
  }

  update(): void {
    this._value.animate(new this._animationClass({
      ...this._animationConfig,
      toValue: (this._animationConfig.toValue: any).__getValue(),
    }), this._callback);
  }
}

type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void;
  stop: () => void;
};

var maybeVectorAnim = function(
  value: AnimatedValue | AnimatedValueXY,
  config: Object,
  anim: (value: AnimatedValue, config: Object) => CompositeAnimation
): ?CompositeAnimation {
  if (value instanceof AnimatedValueXY) {
    var configX = {...config};
    var configY = {...config};
    for (var key in config) {
      var {x, y} = config[key];
      if (x !== undefined && y !== undefined) {
        configX[key] = x;
        configY[key] = y;
      }
    }
    var aX = anim((value: AnimatedValueXY).x, configX);
    var aY = anim((value: AnimatedValueXY).y, configY);
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallel([aX, aY], {stopTogether: false});
  }
  return null;
};

var spring = function(
  value: AnimatedValue | AnimatedValueXY,
  config: SpringAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, spring) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value;
      var singleConfig: any = config;
      singleValue.stopTracking();
      if (config.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          config.toValue,
          SpringAnimation,
          singleConfig,
          callback
        ));
      } else {
        singleValue.animate(new SpringAnimation(singleConfig), callback);
      }
    },

    stop: function(): void {
      value.stopAnimation();
    },
  };
};

var timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, timing) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value;
      var singleConfig: any = config;
      singleValue.stopTracking();
      if (config.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          config.toValue,
          TimingAnimation,
          singleConfig,
          callback
        ));
      } else {
        singleValue.animate(new TimingAnimation(singleConfig), callback);
      }
    },

    stop: function(): void {
      value.stopAnimation();
    },
  };
};

var decay = function(
  value: AnimatedValue | AnimatedValueXY,
  config: DecayAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, decay) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value;
      var singleConfig: any = config;
      singleValue.stopTracking();
      singleValue.animate(new DecayAnimation(singleConfig), callback);
    },

    stop: function(): void {
      value.stopAnimation();
    },
  };
};

var sequence = function(
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  var current = 0;
  return {
    start: function(callback?: ?EndCallback) {
      var onComplete = function(result) {
        if (!result.finished) {
          callback && callback(result);
          return;
        }

        current++;

        if (current === animations.length) {
          callback && callback(result);
          return;
        }

        animations[current].start(onComplete);
      };

      if (animations.length === 0) {
        callback && callback({finished: true});
      } else {
        animations[current].start(onComplete);
      }
    },

    stop: function() {
      if (current < animations.length) {
        animations[current].stop();
      }
    }
  };
};

type ParallelConfig = {
  stopTogether?: bool; // If one is stopped, stop all.  default: true
}
var parallel = function(
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  var doneCount = 0;
  // Make sure we only call stop() at most once for each animation
  var hasEnded = {};
  var stopTogether = !(config && config.stopTogether === false);

  var result = {
    start: function(callback?: ?EndCallback) {
      if (doneCount === animations.length) {
        callback && callback({finished: true});
        return;
      }

      animations.forEach((animation, idx) => {
        var cb = function(endResult) {
          hasEnded[idx] = true;
          doneCount++;
          if (doneCount === animations.length) {
            doneCount = 0;
            callback && callback(endResult);
            return;
          }

          if (!endResult.finished && stopTogether) {
            result.stop();
          }
        };

        if (!animation) {
          cb({finished: true});
        } else {
          animation.start(cb);
        }
      });
    },

    stop: function(): void {
      animations.forEach((animation, idx) => {
        !hasEnded[idx] && animation.stop();
        hasEnded[idx] = true;
      });
    }
  };

  return result;
};

var delay = function(time: number): CompositeAnimation {
  // Would be nice to make a specialized implementation
  return timing(new AnimatedValue(0), {toValue: 0, delay: time, duration: 0});
};

var stagger = function(
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return parallel(animations.map((animation, i) => {
    return sequence([
      delay(time * i),
      animation,
    ]);
  }));
};

type Mapping = {[key: string]: Mapping} | AnimatedValue;

type EventConfig = {listener?: ?Function};
var event = function(
  argMapping: Array<?Mapping>,
  config?: ?EventConfig,
): () => void {
  return function(...args): void {
    var traverse = function(recMapping, recEvt, key) {
      if (typeof recEvt === 'number') {
        invariant(
          recMapping instanceof AnimatedValue,
          'Bad mapping of type ' + typeof recMapping + ' for key ' + key +
            ', event value must map to AnimatedValue'
        );
        recMapping.setValue(recEvt);
        return;
      }
      invariant(
        typeof recMapping === 'object',
        'Bad mapping of type ' + typeof recMapping + ' for key ' + key
      );
      invariant(
        typeof recEvt === 'object',
        'Bad event of type ' + typeof recEvt + ' for key ' + key
      );
      for (var key in recMapping) {
        traverse(recMapping[key], recEvt[key], key);
      }
    };
    argMapping.forEach((mapping, idx) => {
      traverse(mapping, args[idx], 'arg' + idx);
    });
    if (config && config.listener) {
      config.listener.apply(null, args);
    }
  };
};

/**
 * Animations are an important part of modern UX, and the `Animated`
 * library is designed to make them fluid, powerful, and easy to build and
 * maintain.
 *
 * The simplest workflow is to create an `Animated.Value`, hook it up to one or
 * more style attributes of an animated component, and then drive updates either
 * via animations, such as `Animated.timing`, or by hooking into gestures like
 * panning or scolling via `Animated.event`.  `Animated.Value` can also bind to
 * props other than style, and can be interpolated as well.  Here is a basic
 * example of a container view that will fade in when it's mounted:
 *
 *```javascript
 *  class FadeInView extends React.Component {
 *    constructor(props) {
 *      super(props);
 *      this.state = {
 *        fadeAnim: new Animated.Value(0), // init opacity 0
 *      };
 *    }
 *    componentDidMount() {
 *      Animated.timing(          // Uses easing functions
 *        this.state.fadeAnim,    // The value to drive
 *        {toValue: 1},           // Configuration
 *      ).start();                // Don't forget start!
 *    }
 *    render() {
 *      return (
 *        <Animated.View          // Special animatable View
 *          style={{opacity: this.state.fadeAnim}}> // Binds
 *          {this.props.children}
 *        </Animated.View>
 *      );
 *    }
 *  }
 *```
 *
 * Note that only animatable components can be animated.  `View`, `Text`, and
 * `Image` are already provided, and you can create custom ones with
 * `createAnimatedComponent`.  These special components do the magic of binding
 * the animated values to the properties, and do targetted native updates to
 * avoid the cost of the react render and reconciliation process on every frame.
 * They also handle cleanup on unmount so they are safe by default.
 *
 * Animations are heavily configurable.  Custom and pre-defined easing
 * functions, delays, durations, decay factors, spring constants, and more can
 * all be tweaked depending on the type of animation.
 *
 * A single `Animated.Value` can drive any number of properties, and each
 * property can be run through an interpolation first.  An interpolation maps
 * input ranges to output ranges, typically using a linear interpolation but
 * also supports easing functions.  By default, it will extrapolate the curve
 * beyond the ranges given, but you can also have it clamp the output value.
 *
 * For example, you may want to think about your `Animated.Value` as going from
 * 0 to 1, but animate the position from 150px to 0px and the opacity from 0 to
 * 1. This can easily be done by modifying `style` in the example above like so:
 *
 *```javascript
 *  style={{
 *    opacity: this.state.fadeAnim, // Binds directly
 *    transform: [{
 *      translateY: this.state.fadeAnim.interpolate({
 *        inputRange: [0, 1],
 *        outputRange: [150, 0]  // 0 : 150, 0.5 : 75, 1 : 0
 *      }),
 *    }],
 *  }}>
 *```
 *
 * Animations can also be combined in complex ways using composition functions
 * such as `sequence` and `parallel`, and can also be chained together simply
 * by setting the `toValue` of one animation to be another `Animated.Value`.
 *
 * `Animated.ValueXY` is handy for 2D animations, like panning, and there are
 * other helpful additions like `setOffset` and `getLayout` to aid with typical
 * interaction patterns, like drag-and-drop.
 *
 * You can see more example usage in `AnimationExample.js`, the Gratuitous
 * Animation App, and [Animations documentation guide](http://facebook.github.io/react-native/docs/animations.html).
 *
 * Note that `Animated` is designed to be fully serializable so that animations
 * can be run in a high performace way, independent of the normal JavaScript
 * event loop. This does influence the API, so keep that in mind when it seems a
 * little trickier to do something compared to a fully synchronous system.
 * Checkout `Animated.Value.addListener` as a way to work around some of these
 * limitations, but use it sparingly since it might have performance
 * implications in the future.
 */
module.exports = {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   */
  Value: AnimatedValue,
  /**
   * 2D value class for driving 2D animations, such as pan gestures.
   */
  ValueXY: AnimatedValueXY,

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   */
  decay,
  /**
   * Animates a value along a timed easing curve.  The `Easing` module has tons
   * of pre-defined curves, or you can use your own function.
   */
  timing,
  /**
   * Spring animation based on Rebound and Origami.  Tracks velocity state to
   * create fluid motions as the `toValue` updates, and can be chained together.
   */
  spring,

  /**
   * Starts an animation after the given delay.
   */
  delay,
  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next.  If the current running animation is stopped, no
   * following animations will be started.
   */
  sequence,
  /**
   * Starts an array of animations all at the same time.  By default, if one
   * of the animations is stopped, they will all be stopped.  You can override
   * this with the `stopTogether` flag.
   */
  parallel,
  /**
   * Array of animations may run in parallel (overlap), but are started in
   * sequence with successive delays.  Nice for doing trailing effects.
   */
  stagger,

  /**
   *  Takes an array of mappings and extracts values from each arg accordingly,
   *  then calls `setValue` on the mapped outputs.  e.g.
   *
   *```javascript
   *  onScroll={this.AnimatedEvent(
   *    [{nativeEvent: {contentOffset: {x: this._scrollX}}}]
   *    {listener},          // Optional async listener
   *  )
   *  ...
   *  onPanResponderMove: this.AnimatedEvent([
   *    null,                // raw event arg ignored
   *    {dx: this._panX},    // gestureState arg
   *  ]),
   *```
   */
  event,

  /**
   * Make any React component Animatable.  Used to create `Animated.View`, etc.
   */
  createAnimatedComponent,

  __PropsOnlyForTests: AnimatedProps,
};
