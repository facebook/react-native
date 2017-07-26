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
 * @preventMunge
 */
'use strict';

var InteractionManager = require('InteractionManager');
var Interpolation = require('Interpolation');
var NativeAnimatedHelper = require('NativeAnimatedHelper');
var React = require('React');
var ReactNative = require('ReactNative');
var Set = require('Set');
var SpringConfig = require('SpringConfig');
var ViewStylePropTypes = require('ViewStylePropTypes');

var flattenStyle = require('flattenStyle');
var invariant = require('fbjs/lib/invariant');
var requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

import type { InterpolationConfigType } from 'Interpolation';

type EndResult = {finished: bool};
type EndCallback = (result: EndResult) => void;

var NativeAnimatedAPI = NativeAnimatedHelper.API;

var warnedMissingNativeAnimated = false;

function shouldUseNativeDriver(config: AnimationConfig | EventConfig): boolean {
  if (config.useNativeDriver &&
      !NativeAnimatedHelper.isNativeAnimatedAvailable()) {
    if (!warnedMissingNativeAnimated) {
      console.warn(
        'Animated: `useNativeDriver` is not supported because the native ' +
        'animated module is missing. Falling back to JS-based animation. To ' +
        'resolve this, add `RCTAnimation` module to this app, or remove ' +
        '`useNativeDriver`. ' +
        'More info: https://github.com/facebook/react-native/issues/11094#issuecomment-263240420'
      );
      warnedMissingNativeAnimated = true;
    }
    return false;
  }

  return config.useNativeDriver || false;
}

// Note(vjeux): this would be better as an interface but flow doesn't
// support them yet
class Animated {
  __attach(): void {}
  __detach(): void {
    if (this.__isNative && this.__nativeTag != null) {
      NativeAnimatedAPI.dropAnimatedNode(this.__nativeTag);
      this.__nativeTag = undefined;
    }
  }
  __getValue(): any {}
  __getAnimatedValue(): any { return this.__getValue(); }
  __addChild(child: Animated) {}
  __removeChild(child: Animated) {}
  __getChildren(): Array<Animated> { return []; }

  /* Methods and props used by native Animated impl */
  __isNative: bool;
  __nativeTag: ?number;
  __makeNative() {
    if (!this.__isNative) {
      throw new Error('This node cannot be made a "native" animated node');
    }
  }
  __getNativeTag(): ?number {
    NativeAnimatedHelper.assertNativeAnimatedModule();
    invariant(this.__isNative, 'Attempt to get native tag from node not marked as "native"');
    if (this.__nativeTag == null) {
      var nativeTag: ?number = NativeAnimatedHelper.generateNewNodeTag();
      NativeAnimatedAPI.createAnimatedNode(nativeTag, this.__getNativeConfig());
      this.__nativeTag = nativeTag;
    }
    return this.__nativeTag;
  }
  __getNativeConfig(): Object {
    throw new Error('This JS animated node type cannot be used as native animated node');
  }
  toJSON(): any { return this.__getValue(); }
}

type AnimationConfig = {
  isInteraction?: bool,
  useNativeDriver?: bool,
  onComplete?: ?EndCallback,
  iterations?: number,
};

// Important note: start() and stop() will only be called at most once.
// Once an animation has been stopped or finished its course, it will
// not be reused.
class Animation {
  __active: bool;
  __isInteraction: bool;
  __nativeId: number;
  __onEnd: ?EndCallback;
  __iterations: number;
  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue
  ): void {}
  stop(): void {
    if (this.__nativeId) {
      NativeAnimatedAPI.stopAnimation(this.__nativeId);
    }
  }
  __getNativeAnimationConfig(): any {
    // Subclasses that have corresponding animation implementation done in native
    // should override this method
    throw new Error('This animation type cannot be offloaded to native');
  }
  // Helper function for subclasses to make sure onEnd is only called once.
  __debouncedOnEnd(result: EndResult): void {
    var onEnd = this.__onEnd;
    this.__onEnd = null;
    onEnd && onEnd(result);
  }
  __startNativeAnimation(animatedValue: AnimatedValue): void {
    animatedValue.__makeNative();
    this.__nativeId = NativeAnimatedHelper.generateNewAnimationId();
    NativeAnimatedAPI.startAnimatingNode(
      this.__nativeId,
      animatedValue.__getNativeTag(),
      this.__getNativeAnimationConfig(),
      this.__debouncedOnEnd.bind(this)
    );
  }
}

class AnimatedWithChildren extends Animated {
  _children: Array<Animated>;

  constructor() {
    super();
    this._children = [];
  }

  __makeNative() {
    if (!this.__isNative) {
      this.__isNative = true;
      for (var child of this._children) {
        child.__makeNative();
        NativeAnimatedAPI.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
      }
    }
  }

  __addChild(child: Animated): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
    if (this.__isNative) {
      // Only accept "native" animated nodes as children
      child.__makeNative();
      NativeAnimatedAPI.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
  }

  __removeChild(child: Animated): void {
    var index = this._children.indexOf(child);
    if (index === -1) {
      console.warn('Trying to remove a child that doesn\'t exist');
      return;
    }
    if (this.__isNative && child.__isNative) {
      NativeAnimatedAPI.disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
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
  /* $FlowFixMe */
  animatedStyles.forEach(animatedStyle => animatedStyle.update());
}

type TimingAnimationConfig = AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
};

type TimingAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
};

let _easeInOut;
function easeInOut() {
  if (!_easeInOut) {
    const Easing = require('Easing');
    _easeInOut = Easing.inOut(Easing.ease);
  }
  return _easeInOut;
}

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
  _useNativeDriver: bool;

  constructor(
    config: TimingAnimationConfigSingle,
  ) {
    super();
    this._toValue = config.toValue;
    this._easing = config.easing !== undefined ? config.easing : easeInOut();
    this._duration = config.duration !== undefined ? config.duration : 500;
    this._delay = config.delay !== undefined ? config.delay : 0;
    this.__iterations = config.iterations !== undefined ? config.iterations : 1;
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;
    this._useNativeDriver = shouldUseNativeDriver(config);
  }

  __getNativeAnimationConfig(): any {
    var frameDuration = 1000.0 / 60.0;
    var frames = [];
    for (var dt = 0.0; dt < this._duration; dt += frameDuration) {
      frames.push(this._easing(dt / this._duration));
    }
    frames.push(this._easing(1));
    return {
      type: 'frames',
      frames,
      toValue: this._toValue,
      iterations: this.__iterations,
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue
  ): void {
    this.__active = true;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;

    var start = () => {
      // Animations that sometimes have 0 duration and sometimes do not
      // still need to use the native driver when duration is 0 so as to
      // not cause intermixed JS and native animations.
      if (this._duration === 0 && !this._useNativeDriver) {
        this._onUpdate(this._toValue);
        this.__debouncedOnEnd({finished: true});
      } else {
        this._startTime = Date.now();
        if (this._useNativeDriver) {
          this.__startNativeAnimation(animatedValue);
        } else {
          this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
        }
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
    super.stop();
    this.__active = false;
    clearTimeout(this._timeout);
    global.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

type DecayAnimationConfig = AnimationConfig & {
  velocity: number | {x: number, y: number},
  deceleration?: number,
};

type DecayAnimationConfigSingle = AnimationConfig & {
  velocity: number,
  deceleration?: number,
};

class DecayAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _deceleration: number;
  _velocity: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _useNativeDriver: bool;

  constructor(
    config: DecayAnimationConfigSingle,
  ) {
    super();
    this._deceleration = config.deceleration !== undefined ? config.deceleration : 0.998;
    this._velocity = config.velocity;
    this._useNativeDriver = shouldUseNativeDriver(config);
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;
    this.__iterations = config.iterations !== undefined ? config.iterations : 1;
  }

  __getNativeAnimationConfig() {
    return {
      type: 'decay',
      deceleration: this._deceleration,
      velocity: this._velocity,
      iterations: this.__iterations,
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {
    this.__active = true;
    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._startTime = Date.now();
    if (this._useNativeDriver) {
      this.__startNativeAnimation(animatedValue);
    } else {
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
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
    super.stop();
    this.__active = false;
    global.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

type SpringAnimationConfig = AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY,
  overshootClamping?: bool,
  restDisplacementThreshold?: number,
  restSpeedThreshold?: number,
  velocity?: number | {x: number, y: number},
  bounciness?: number,
  speed?: number,
  tension?: number,
  friction?: number,
  delay?: number,
};

type SpringAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue,
  overshootClamping?: bool,
  restDisplacementThreshold?: number,
  restSpeedThreshold?: number,
  velocity?: number,
  bounciness?: number,
  speed?: number,
  tension?: number,
  friction?: number,
  delay?: number,
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
  _delay: number;
  _timeout: any;
  _lastTime: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _useNativeDriver: bool;

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
    this._delay = withDefault(config.delay, 0);
    this._useNativeDriver = shouldUseNativeDriver(config);
    this.__isInteraction = config.isInteraction !== undefined ? config.isInteraction : true;
    this.__iterations = config.iterations !== undefined ? config.iterations : 1;

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

  __getNativeAnimationConfig() {
    return {
      type: 'spring',
      overshootClamping: this._overshootClamping,
      restDisplacementThreshold: this._restDisplacementThreshold,
      restSpeedThreshold: this._restSpeedThreshold,
      tension: this._tension,
      friction: this._friction,
      initialVelocity: withDefault(this._initialVelocity, this._lastVelocity),
      toValue: this._toValue,
      iterations: this.__iterations,
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue
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

    var start = () => {
      if (this._useNativeDriver) {
        this.__startNativeAnimation(animatedValue);
      } else {
        this.onUpdate();
      }
    };

    //  If this._delay is more than 0, we start after the timeout.
    if (this._delay) {
      this._timeout = setTimeout(start, this._delay);
    } else {
      start();
    }
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
      var aAcceleration = this._tension *
        (this._toValue - tempPosition) - this._friction * tempVelocity;
      var tempPosition = position + aVelocity * step / 2;
      var tempVelocity = velocity + aAcceleration * step / 2;

      var bVelocity = tempVelocity;
      var bAcceleration = this._tension *
        (this._toValue - tempPosition) - this._friction * tempVelocity;
      tempPosition = position + bVelocity * step / 2;
      tempVelocity = velocity + bAcceleration * step / 2;

      var cVelocity = tempVelocity;
      var cAcceleration = this._tension *
        (this._toValue - tempPosition) - this._friction * tempVelocity;
      tempPosition = position + cVelocity * step / 2;
      tempVelocity = velocity + cAcceleration * step / 2;

      var dVelocity = tempVelocity;
      var dAcceleration = this._tension *
        (this._toValue - tempPosition) - this._friction * tempVelocity;
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
    super.stop();
    this.__active = false;
    clearTimeout(this._timeout);
    global.cancelAnimationFrame(this._animationFrame);
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
  _startingValue: number;
  _offset: number;
  _animation: ?Animation;
  _tracking: ?Animated;
  _listeners: {[key: string]: ValueListenerCallback};
  __nativeAnimatedValueListener: ?any;

  constructor(value: number) {
    super();
    this._startingValue = this._value = value;
    this._offset = 0;
    this._animation = null;
    this._listeners = {};
  }

  __detach() {
    this.stopAnimation();
    super.__detach();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  __makeNative() {
    super.__makeNative();

    if (Object.keys(this._listeners).length) {
      this._startListeningToNativeValueUpdates();
    }
  }

  /**
   * Directly set the value.  This will stop any animations running on the value
   * and update all the bound properties.
   */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(
      value,
      !this.__isNative /* don't perform a flush for natively driven values */);
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value);
    }
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether via
   * `setValue`, an animation, or `Animated.event`.  Useful for compensating
   * things like the start of a pan gesture.
   */
  setOffset(offset: number): void {
    this._offset = offset;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
    }
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   */
  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  /**
   * Sets the offset value to the base value, and resets the base value to zero.
   * The final output of the value is unchanged.
   */
  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to
   * synchronously read the value because it might be driven natively.
   */
  addListener(callback: ValueListenerCallback): string {
    var id = String(_uniqueId++);
    this._listeners[id] = callback;
    if (this.__isNative) {
      this._startListeningToNativeValueUpdates();
    }
    return id;
  }

  removeListener(id: string): void {
    delete this._listeners[id];
    if (this.__isNative && Object.keys(this._listeners).length === 0) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  removeAllListeners(): void {
    this._listeners = {};
    if (this.__isNative) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  _startListeningToNativeValueUpdates() {
    if (this.__nativeAnimatedValueListener) {
      return;
    }

    NativeAnimatedAPI.startListeningToAnimatedNodeValue(this.__getNativeTag());
    this.__nativeAnimatedValueListener = NativeAnimatedHelper.nativeEventEmitter.addListener(
      'onAnimatedValueUpdate',
      (data) => {
        if (data.tag !== this.__getNativeTag()) {
          return;
        }
        this._updateValue(data.value, false /* flush */);
      }
    );
  }

  _stopListeningForNativeValueUpdates() {
    if (!this.__nativeAnimatedValueListener) {
      return;
    }

    this.__nativeAnimatedValueListener.remove();
    this.__nativeAnimatedValueListener = null;
    NativeAnimatedAPI.stopListeningToAnimatedNodeValue(this.__getNativeTag());
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
  * Stops any animation and resets the value to its original
  */
  resetAnimation(callback?: ?(value: number) => void): void {
    this.stopAnimation(callback);
    this._value = this._startingValue;
  }

  /**
   * Interpolates the value before updating the property, e.g. mapping 0-1 to
   * 0-10.
   */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
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
        // Natively driven animations will never call into that callback, therefore we can always
        // pass flush = true to allow the updated value to propagate to native with setNativeProps
        this._updateValue(value, true /* flush */);
      },
      (result) => {
        this._animation = null;
        if (handle !== null) {
          InteractionManager.clearInteractionHandle(handle);
        }
        callback && callback(result);
      },
      previousAnimation,
      this
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

  _updateValue(value: number, flush: bool): void {
    this._value = value;
    if (flush) {
      _flush(this);
    }
    for (var key in this._listeners) {
      this._listeners[key]({value: this.__getValue()});
    }
  }

  __getNativeConfig(): Object {
    return {
      type: 'value',
      value: this._value,
      offset: this._offset,
    };
  }
}

type ValueXYListenerCallback = (value: {x: number, y: number}) => void;

/**
 * 2D Value for driving 2D animations, such as pan gestures.  Almost identical
 * API to normal `Animated.Value`, but multiplexed.  Contains two regular
 * `Animated.Value`s under the hood.
 *
 * #### Example
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
  _listeners: {[key: string]: {x: string, y: string}};

  constructor(valueIn?: ?{x: number | AnimatedValue, y: number | AnimatedValue}) {
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

  setValue(value: {x: number, y: number}) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  setOffset(offset: {x: number, y: number}) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  __getValue(): {x: number, y: number} {
    return {
      x: this.x.__getValue(),
      y: this.y.__getValue(),
    };
  }

  resetAnimation(callback?: (value: {x: number, y: number}) => void): void {
    this.x.resetAnimation();
    this.y.resetAnimation();
    callback && callback(this.__getValue());
  }

  stopAnimation(callback?: (value: {x: number, y: number}) => void): void {
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

  removeAllListeners(): void {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
    this._listeners = {};
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
  _config: InterpolationConfigType;
  _interpolation: (input: number) => number | string;

  constructor(parent: Animated, config: InterpolationConfigType) {
    super();
    this._parent = parent;
    this._config = config;
    this._interpolation = Interpolation.create(config);
  }

  __makeNative() {
    this._parent.__makeNative();
    super.__makeNative();
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
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }

  __transformDataType(range: Array<any>) {
    // Change the string array type to number array
    // So we can reuse the same logic in iOS and Android platform
    return range.map(function (value) {
      if (typeof value !== 'string') {
        return value;
      }
      if (/deg$/.test(value)) {
        const degrees = parseFloat(value) || 0;
        const radians = degrees * Math.PI / 180.0;
        return radians;
      } else {
        // Assume radians
        return parseFloat(value) || 0;
      }
    });
  }

  __getNativeConfig(): any {
    if (__DEV__) {
      NativeAnimatedHelper.validateInterpolation(this._config);
    }

    return {
      inputRange: this._config.inputRange,
      // Only the `outputRange` can contain strings so we don't need to tranform `inputRange` here
      outputRange: this.__transformDataType(this._config.outputRange),
      extrapolateLeft: this._config.extrapolateLeft || this._config.extrapolate || 'extend',
      extrapolateRight: this._config.extrapolateRight || this._config.extrapolate || 'extend',
      type: 'interpolation',
    };
  }
}

class AnimatedAddition extends AnimatedWithChildren {
  _a: Animated;
  _b: Animated;

  constructor(a: Animated | number, b: Animated | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative() {
    this._a.__makeNative();
    this._b.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    return this._a.__getValue() + this._b.__getValue();
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    this._b.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    this._b.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'addition',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
    };
  }
}

class AnimatedDivision extends AnimatedWithChildren {
  _a: Animated;
  _b: Animated;

  constructor(a: Animated | number, b: Animated | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative() {
    this._a.__makeNative();
    this._b.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    const a = this._a.__getValue();
    const b = this._b.__getValue();
    if (b === 0) {
      console.error('Detected division by zero in AnimatedDivision');
    }
    return a / b;
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    this._b.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    this._b.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'division',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
    };
  }
}

class AnimatedMultiplication extends AnimatedWithChildren {
  _a: Animated;
  _b: Animated;

  constructor(a: Animated | number, b: Animated | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative() {
    this._a.__makeNative();
    this._b.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    return this._a.__getValue() * this._b.__getValue();
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    this._b.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    this._b.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'multiplication',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
    };
  }
}

class AnimatedModulo extends AnimatedWithChildren {
  _a: Animated;
  _modulus: number;

  constructor(a: Animated, modulus: number) {
    super();
    this._a = a;
    this._modulus = modulus;
  }

  __makeNative() {
    this._a.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    return (this._a.__getValue() % this._modulus + this._modulus) % this._modulus;
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'modulus',
      input: this._a.__getNativeTag(),
      modulus: this._modulus,
    };
  }
}

class AnimatedDiffClamp extends AnimatedWithChildren {
  _a: Animated;
  _min: number;
  _max: number;
  _value: number;
  _lastValue: number;

  constructor(a: Animated, min: number, max: number) {
    super();

    this._a = a;
    this._min = min;
    this._max = max;
    this._value = this._lastValue = this._a.__getValue();
  }

  __makeNative() {
    this._a.__makeNative();
    super.__makeNative();
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __getValue(): number {
    const value = this._a.__getValue();
    const diff = value - this._lastValue;
    this._lastValue = value;
    this._value = Math.min(Math.max(this._value + diff, this._min), this._max);
    return this._value;
  }

  __attach(): void {
    this._a.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'diffclamp',
      input: this._a.__getNativeTag(),
      min: this._min,
      max: this._max,
    };
  }
}

class AnimatedTransform extends AnimatedWithChildren {
  _transforms: Array<Object>;

  constructor(transforms: Array<Object>) {
    super();
    this._transforms = transforms;
  }

  __makeNative() {
    super.__makeNative();
    this._transforms.forEach(transform => {
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          value.__makeNative();
        }
      }
    });
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
    super.__detach();
  }

  __getNativeConfig(): any {
    var transConfigs = [];

    this._transforms.forEach(transform => {
      for (var key in transform) {
        var value = transform[key];
        if (value instanceof Animated) {
          transConfigs.push({
            type: 'animated',
            property: key,
            nodeTag: value.__getNativeTag(),
          });
        } else {
          transConfigs.push({
            type: 'static',
            property: key,
            value,
          });
        }
      }
    });

    NativeAnimatedHelper.validateTransform(transConfigs);
    return {
      type: 'transform',
      transforms: transConfigs,
    };
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

  // Recursively get values for nested styles (like iOS's shadowOffset)
  __walkStyleAndGetValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof Animated) {
        if (!value.__isNative) {
          // We cannot use value of natively driven nodes this way as the value we have access from
          // JS may not be up to date.
          updatedStyle[key] = value.__getValue();
        }
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this.__walkStyleAndGetValues(value);
      } else {
        updatedStyle[key] = value;
      }
    }
    return updatedStyle;
  }

  __getValue(): Object {
    return this.__walkStyleAndGetValues(this._style);
  }

  // Recursively get animated values for nested styles (like iOS's shadowOffset)
  __walkStyleAndGetAnimatedValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof Animated) {
        updatedStyle[key] = value.__getAnimatedValue();
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this.__walkStyleAndGetAnimatedValues(value);
      }
    }
    return updatedStyle;
  }

  __getAnimatedValue(): Object {
    return this.__walkStyleAndGetAnimatedValues(this._style);
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
    super.__detach();
  }

  __makeNative() {
    super.__makeNative();
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        value.__makeNative();
      }
    }
  }

  __getNativeConfig(): Object {
    var styleConfig = {};
    for (const styleKey in this._style) {
      if (this._style[styleKey] instanceof Animated) {
        styleConfig[styleKey] = this._style[styleKey].__getNativeTag();
      }
      // Non-animated styles are set using `setNativeProps`, no need
      // to pass those as a part of the node config
    }
    NativeAnimatedHelper.validateStyles(styleConfig);
    return {
      type: 'style',
      style: styleConfig,
    };
  }
}

class AnimatedProps extends Animated {
  _props: Object;
  _animatedView: any;
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
        if (!value.__isNative || value instanceof AnimatedStyle) {
          // We cannot use value of natively driven nodes this way as the value we have access from
          // JS may not be up to date.
          props[key] = value.__getValue();
        }
      } else if (value instanceof AnimatedEvent) {
        props[key] = value.__getHandler();
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
    if (this.__isNative && this._animatedView) {
      this.__disconnectAnimatedView();
    }
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        value.__removeChild(this);
      }
    }
    super.__detach();
  }

  update(): void {
    this._callback();
  }

  __makeNative(): void {
    if (!this.__isNative) {
      this.__isNative = true;
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof Animated) {
          value.__makeNative();
        }
      }
      if (this._animatedView) {
        this.__connectAnimatedView();
      }
    }
  }

  setNativeView(animatedView: any): void {
    if (this._animatedView === animatedView) {
      return;
    }
    this._animatedView = animatedView;
    if (this.__isNative) {
      this.__connectAnimatedView();
    }
  }

  __connectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    var nativeViewTag: ?number = ReactNative.findNodeHandle(this._animatedView);
    invariant(nativeViewTag != null, 'Unable to locate attached view in the native tree');
    NativeAnimatedAPI.connectAnimatedNodeToView(this.__getNativeTag(), nativeViewTag);
  }

  __disconnectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    var nativeViewTag: ?number = ReactNative.findNodeHandle(this._animatedView);
    invariant(nativeViewTag != null, 'Unable to locate attached view in the native tree');
    NativeAnimatedAPI.disconnectAnimatedNodeFromView(this.__getNativeTag(), nativeViewTag);
  }

  __getNativeConfig(): Object {
    var propsConfig = {};
    for (const propKey in this._props) {
      var value = this._props[propKey];
      if (value instanceof Animated) {
        propsConfig[propKey] = value.__getNativeTag();
      }
    }
    return {
      type: 'props',
      props: propsConfig,
    };
  }
}

function createAnimatedComponent(Component: any): any {
  class AnimatedComponent extends React.Component {
    _component: any;
    _prevComponent: any;
    _propsAnimated: AnimatedProps;
    _eventDetachers: Array<Function> = [];
    _setComponentRef: Function;

    constructor(props: Object) {
      super(props);
      this._setComponentRef = this._setComponentRef.bind(this);
    }

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
      this._detachNativeEvents();
    }

    setNativeProps(props) {
      this._component.setNativeProps(props);
    }

    componentWillMount() {
      this._attachProps(this.props);
    }

    componentDidMount() {
      this._propsAnimated.setNativeView(this._component);
      this._attachNativeEvents();
    }

    _attachNativeEvents() {
      // Make sure to get the scrollable node for components that implement
      // `ScrollResponder.Mixin`.
      const scrollableNode = this._component.getScrollableNode ?
        this._component.getScrollableNode() :
        this._component;

      for (const key in this.props) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
           prop.__attach(scrollableNode, key);
           this._eventDetachers.push(() => prop.__detach(scrollableNode, key));
        }
      }
    }

    _detachNativeEvents() {
      this._eventDetachers.forEach(remove => remove());
      this._eventDetachers = [];
    }

    _attachProps(nextProps) {
      var oldPropsAnimated = this._propsAnimated;

      // The system is best designed when setNativeProps is implemented. It is
      // able to avoid re-rendering and directly set the attributes that
      // changed. However, setNativeProps can only be implemented on leaf
      // native components. If you want to animate a composite component, you
      // need to re-render it. In this case, we have a fallback that uses
      // forceUpdate.
      var callback = () => {
        if (this._component.setNativeProps) {
          if (!this._propsAnimated.__isNative) {
            this._component.setNativeProps(
              this._propsAnimated.__getAnimatedValue()
            );
          } else {
            throw new Error('Attempting to run JS driven animation on animated '
              + 'node that has been moved to "native" earlier by starting an '
              + 'animation with `useNativeDriver: true`');
          }
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

    componentWillReceiveProps(newProps) {
      this._attachProps(newProps);
    }

    componentDidUpdate(prevProps) {
      if (this._component !== this._prevComponent) {
        this._propsAnimated.setNativeView(this._component);
      }
      if (this._component !== this._prevComponent || prevProps !== this.props) {
        this._detachNativeEvents();
        this._attachNativeEvents();
      }
    }

    render() {
      const props = this._propsAnimated.__getValue();
      return (
        <Component
          {...props}
          ref={this._setComponentRef}
          // The native driver updates views directly through the UI thread so we
          // have to make sure the view doesn't get optimized away because it cannot
          // go through the NativeViewHierachyManager since it operates on the shadow
          // thread.
          collapsable={this._propsAnimated.__isNative ? false : props.collapsable}
        />
      );
    }

    _setComponentRef(c) {
      this._prevComponent = this._component;
      this._component = c;
    }

    // A third party library can use getNode()
    // to get the node reference of the decorated component
    getNode () {
      return this._component;
    }
  }

  // ReactNative `View.propTypes` have been deprecated in favor of
  // `ViewPropTypes`. In their place a temporary getter has been added with a
  // deprecated warning message. Avoid triggering that warning here by using
  // temporary workaround, __propTypesSecretDontUseThesePlease.
  // TODO (bvaughn) Revert this particular change any time after April 1
  var propTypes =
    Component.__propTypesSecretDontUseThesePlease ||
    Component.propTypes;

  AnimatedComponent.propTypes = {
    style: function(props, propName, componentName) {
      if (!propTypes) {
        return;
      }

      for (var key in ViewStylePropTypes) {
        if (!propTypes[key] && props[key] !== undefined) {
          console.warn(
            'You are setting the style `{ ' + key + ': ... }` as a prop. You ' +
            'should nest it in a style object. ' +
            'E.g. `{ style: { ' + key + ': ... } }`'
          );
        }
      }
    },
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
    super.__detach();
  }

  update(): void {
    this._value.animate(new this._animationClass({
      ...this._animationConfig,
      toValue: (this._animationConfig.toValue: any).__getValue(),
    }), this._callback);
  }
}

type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
};

var add = function(
  a: Animated | number,
  b: Animated | number,
): AnimatedAddition {
  return new AnimatedAddition(a, b);
};

var divide = function(
  a: Animated | number,
  b: Animated | number,
): AnimatedDivision {
  return new AnimatedDivision(a, b);
};

var multiply = function(
  a: Animated | number,
  b: Animated | number,
): AnimatedMultiplication {
  return new AnimatedMultiplication(a, b);
};

var modulo = function(
  a: Animated,
  modulus: number
): AnimatedModulo {
  return new AnimatedModulo(a, modulus);
};

var diffClamp = function(
  a: Animated,
  min: number,
  max: number,
): AnimatedDiffClamp {
  return new AnimatedDiffClamp(a, min, max);
};

const _combineCallbacks = function(callback: ?EndCallback, config : AnimationConfig) {
  if (callback && config.onComplete) {
    return (...args) => {
      config.onComplete && config.onComplete(...args);
      callback && callback(...args);
    };
  } else {
    return callback || config.onComplete;
  }
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
  var start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: SpringAnimationConfig,
    callback?: ?EndCallback): void {
      callback = _combineCallbacks(callback, configuration);
      var singleValue: any = animatedValue;
      var singleConfig: any = configuration;
      singleValue.stopTracking();
      if (configuration.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          configuration.toValue,
          SpringAnimation,
          singleConfig,
          callback
        ));
      } else {
        singleValue.animate(new SpringAnimation(singleConfig), callback);
      }
  };
  return maybeVectorAnim(value, config, spring) || {
    start: function(callback?: ?EndCallback): void {
      start(value, config, callback);
    },

    stop: function(): void {
      value.stopAnimation();
    },

    reset: function(): void {
      value.resetAnimation();
    },

    _startNativeLoop: function(iterations?: number): void {
      var singleConfig = { ...config, iterations };
      start(value, singleConfig);
    },

    _isUsingNativeDriver: function(): boolean {
      return config.useNativeDriver || false;
    }
  };
};

var timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  var start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: TimingAnimationConfig,
    callback?: ?EndCallback): void {
      callback = _combineCallbacks(callback, configuration);
      var singleValue: any = animatedValue;
      var singleConfig: any = configuration;
      singleValue.stopTracking();
      if (configuration.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          configuration.toValue,
          TimingAnimation,
          singleConfig,
          callback
        ));
      } else {
        singleValue.animate(new TimingAnimation(singleConfig), callback);
      }
  };

  return maybeVectorAnim(value, config, timing) || {
    start: function(callback?: ?EndCallback): void {
      start(value, config, callback);
    },

    stop: function(): void {
      value.stopAnimation();
    },

    reset: function(): void {
      value.resetAnimation();
    },

    _startNativeLoop: function(iterations?: number): void {
      var singleConfig = { ...config, iterations };
      start(value, singleConfig);
    },

    _isUsingNativeDriver: function(): boolean {
      return config.useNativeDriver || false;
    }
  };
};

var decay = function(
  value: AnimatedValue | AnimatedValueXY,
  config: DecayAnimationConfig,
): CompositeAnimation {
  var start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: DecayAnimationConfig,
    callback?: ?EndCallback): void {
      callback = _combineCallbacks(callback, configuration);
      var singleValue: any = animatedValue;
      var singleConfig: any = configuration;
      singleValue.stopTracking();
      singleValue.animate(new DecayAnimation(singleConfig), callback);
  };

  return maybeVectorAnim(value, config, decay) || {
    start: function(callback?: ?EndCallback): void {
      start(value, config, callback);
    },

    stop: function(): void {
      value.stopAnimation();
    },

    reset: function(): void {
      value.resetAnimation();
    },

    _startNativeLoop: function(iterations?: number): void {
      var singleConfig = { ...config, iterations };
      start(value, singleConfig);
    },

    _isUsingNativeDriver: function(): boolean {
      return config.useNativeDriver || false;
    }
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
    },

    reset: function() {
      animations.forEach((animation, idx) => {
        if (idx <= current) {
          animation.reset();
        }
      });
      current = 0;
    },

    _startNativeLoop: function() {
      throw new Error('Loops run using the native driver cannot contain Animated.sequence animations');
    },

    _isUsingNativeDriver: function(): boolean {
      return false;
    }
  };
};

type ParallelConfig = {
  stopTogether?: bool, // If one is stopped, stop all.  default: true
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
    },

    reset: function(): void {
      animations.forEach((animation, idx) => {
        animation.reset();
        hasEnded[idx] = false;
        doneCount = 0;
      });
    },

    _startNativeLoop: function() {
      throw new Error('Loops run using the native driver cannot contain Animated.parallel animations');
    },

    _isUsingNativeDriver: function(): boolean {
      return false;
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

type LoopAnimationConfig = { iterations: number };

var loop = function(
  animation: CompositeAnimation,
  { iterations = -1 }: LoopAnimationConfig = {},
): CompositeAnimation {
  var isFinished = false;
  var iterationsSoFar = 0;
  return {
    start: function(callback?: ?EndCallback) {
      var restart = function(result: EndResult = {finished: true}): void {
        if (isFinished ||
            (iterationsSoFar === iterations) ||
            (result.finished === false)) {
          callback && callback(result);
        } else {
          iterationsSoFar++;
          animation.reset();
          animation.start(restart);
        }
      };
      if (!animation || iterations === 0) {
        callback && callback({finished: true});
      } else {
        if (animation._isUsingNativeDriver()) {
          animation._startNativeLoop(iterations);
        } else {
          restart(); // Start looping recursively on the js thread
        }
      }
    },

    stop: function(): void {
      isFinished = true;
      animation.stop();
    },

    reset: function(): void {
      iterationsSoFar = 0;
      isFinished = false;
      animation.reset();
    },

    _startNativeLoop: function() {
      throw new Error('Loops run using the native driver cannot contain Animated.loop animations');
    },

    _isUsingNativeDriver: function(): boolean {
      return animation._isUsingNativeDriver();
    }
  };
};

type Mapping = {[key: string]: Mapping} | AnimatedValue;
type EventConfig = {
  listener?: ?Function,
  useNativeDriver?: bool,
};

function attachNativeEvent(viewRef: any, eventName: string, argMapping: Array<?Mapping>) {
  // Find animated values in `argMapping` and create an array representing their
  // key path inside the `nativeEvent` object. Ex.: ['contentOffset', 'x'].
  const eventMappings = [];

  const traverse = (value, path) => {
    if (value instanceof AnimatedValue) {
      value.__makeNative();

      eventMappings.push({
        nativeEventPath: path,
        animatedValueTag: value.__getNativeTag(),
      });
    } else if (typeof value === 'object') {
      for (const key in value) {
        traverse(value[key], path.concat(key));
      }
    }
  };

  invariant(
    argMapping[0] && argMapping[0].nativeEvent,
    'Native driven events only support animated values contained inside `nativeEvent`.'
  );

  // Assume that the event containing `nativeEvent` is always the first argument.
  traverse(argMapping[0].nativeEvent, []);

  const viewTag = ReactNative.findNodeHandle(viewRef);

  eventMappings.forEach((mapping) => {
    NativeAnimatedAPI.addAnimatedEventToView(viewTag, eventName, mapping);
  });

  return {
    detach() {
      eventMappings.forEach((mapping) => {
        NativeAnimatedAPI.removeAnimatedEventFromView(
          viewTag,
          eventName,
          mapping.animatedValueTag,
        );
      });
    },
  };
}

function forkEvent(event: ?AnimatedEvent | ?Function, listener: Function): AnimatedEvent | Function {
  if (!event) {
    return listener;
  } else if (event instanceof AnimatedEvent) {
    event.__addListener(listener);
    return event;
  } else {
    return (...args) => {
      typeof event === 'function' && event(...args);
      listener(...args);
    };
  }
}

function unforkEvent(event: ?AnimatedEvent | ?Function, listener: Function): void {
  if (event && event instanceof AnimatedEvent) {
    event.__removeListener(listener);
  }
}

class AnimatedEvent {
  _argMapping: Array<?Mapping>;
  _listeners: Array<Function> = [];
  _callListeners: Function;
  _attachedEvent: ?{
    detach: () => void,
  };
  __isNative: bool;

  constructor(
    argMapping: Array<?Mapping>,
    config?: EventConfig = {}
  ) {
    this._argMapping = argMapping;
    if (config.listener) {
      this.__addListener(config.listener);
    }
    this._callListeners = this._callListeners.bind(this);
    this._attachedEvent = null;
    this.__isNative = shouldUseNativeDriver(config);

    if (__DEV__) {
      this._validateMapping();
    }
  }

  __addListener(callback: Function): void {
    this._listeners.push(callback);
  }

  __removeListener(callback: Function): void {
    this._listeners = this._listeners.filter((listener) => listener !== callback);
  }

  __attach(viewRef, eventName) {
    invariant(this.__isNative, 'Only native driven events need to be attached.');

    this._attachedEvent = attachNativeEvent(viewRef, eventName, this._argMapping);
  }

  __detach(viewTag, eventName) {
    invariant(this.__isNative, 'Only native driven events need to be detached.');

    this._attachedEvent && this._attachedEvent.detach();
  }

  __getHandler() {
    if (this.__isNative) {
      return this._callListeners;
    }

    return (...args) => {
      const traverse = (recMapping, recEvt, key) => {
        if (typeof recEvt === 'number' && recMapping instanceof AnimatedValue) {
          recMapping.setValue(recEvt);
        } else if (typeof recMapping === 'object') {
          for (const mappingKey in recMapping) {
            traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
          }
        }
      };

      if (!this.__isNative) {
        this._argMapping.forEach((mapping, idx) => {
          traverse(mapping, args[idx], 'arg' + idx);
        });
      }
      this._callListeners(...args);
    };
  }

  _callListeners(...args) {
    this._listeners.forEach(listener => listener(...args));
  }

  _validateMapping() {
    const traverse = (recMapping, recEvt, key) => {
      if (typeof recEvt === 'number') {
        invariant(
          recMapping instanceof AnimatedValue,
          'Bad mapping of type ' + typeof recMapping + ' for key ' + key +
            ', event value must map to AnimatedValue'
        );
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
      for (const mappingKey in recMapping) {
        traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
      }
    };
  }
}

var event = function(
  argMapping: Array<?Mapping>,
  config?: EventConfig,
): any {
  const animatedEvent = new AnimatedEvent(argMapping, config);
  if (animatedEvent.__isNative) {
    return animatedEvent;
  } else {
    return animatedEvent.__getHandler();
  }
};

/**
 * The `Animated` library is designed to make animations fluid, powerful, and
 * easy to build and maintain. `Animated` focuses on declarative relationships
 * between inputs and outputs, with configurable transforms in between, and
 * simple `start`/`stop` methods to control time-based animation execution.
 *
 * The simplest workflow for creating an animation is to to create an
 * `Animated.Value`, hook it up to one or more style attributes of an animated
 * component, and then drive updates via animations using `Animated.timing()`:
 *
 * ```javascript
 * Animated.timing(                            // Animate value over time
 *   this.state.fadeAnim,                      // The value to drive
 *   {
 *     toValue: 1,                             // Animate to final value of 1
 *   }
 * ).start();                                  // Start the animation
 * ```
 *
 * Refer to the [Animations](docs/animations.html#animated-api) guide to see
 * additional examples of `Animated` in action.
 *
 * ## Overview
 *
 * There are two value types you can use with `Animated`:
 *
 * - [`Animated.Value()`](docs/animated.html#value) for single values
 * - [`Animated.ValueXY()`](docs/animated.html#valuexy) for vectors
 *
 * `Animated.Value` can bind to style properties or other props, and can be
 * interpolated as well. A single `Animated.Value` can drive any number of
 * properties.
 *
 * ### Configuring animations
 *
 * `Animated` provides three types of animation types. Each animation type
 * provides a particular animation curve that controls how your values animate
 * from their initial value to the final value:
 *
 * - [`Animated.decay()`](docs/animated.html#decay) starts with an initial
 *   velocity and gradually slows to a stop.
 * - [`Animated.spring()`](docs/animated.html#spring) provides a simple
 *   spring physics model.
 * - [`Animated.timing()`](docs/animated.html#timing) animates a value over time
 *   using [easing functions](docs/easing.html).
 *
 * In most cases, you will be using `timing()`. By default, it uses a symmetric
 * easeInOut curve that conveys the gradual acceleration of an object to full
 * speed and concludes by gradually decelerating to a stop.
 *
 * ### Working with animations
 *
 * Animations are started by calling `start()` on your animation. `start()`
 * takes a completion callback that will be called when the animation is done.
 * If the animation finished running normally, the completion callback will be
 * invoked with `{finished: true}`. If the animation is done because `stop()`
 * was called on it before it could finish (e.g. because it was interrupted by a
 * gesture or another animation), then it will receive `{finished: false}`.
 *
 * ### Using the native driver
 *
 * By using the native driver, we send everything about the animation to native
 * before starting the animation, allowing native code to perform the animation
 * on the UI thread without having to go through the bridge on every frame.
 * Once the animation has started, the JS thread can be blocked without
 * affecting the animation.
 *
 * You can use the native driver by specifying `useNativeDriver: true` in your
 * animation configuration. See the
 * [Animations](docs/animations.html#using-the-native-driver) guide to learn
 * more.
 *
 * ### Animatable components
 *
 * Only animatable components can be animated. These special components do the
 * magic of binding the animated values to the properties, and do targeted
 * native updates to avoid the cost of the react render and reconciliation
 * process on every frame. They also handle cleanup on unmount so they are safe
 * by default.
 *
 * - [`createAnimatedComponent()`](docs/animated.html#createanimatedcomponent)
 *   can be used to make a component animatable.
 *
 * `Animated` exports the following animatable components using the above
 * wrapper:
 *
 * - `Animated.Image`
 * - `Animated.ScrollView`
 * - `Animated.Text`
 * - `Animated.View`
 *
 * ### Composing animations
 *
 * Animations can also be combined in complex ways using composition functions:
 *
 * - [`Animated.delay()`](docs/animated.html#delay) starts an animation after
 *   a given delay.
 * - [`Animated.parallel()`](docs/animated.html#parallel) starts a number of
 *   animations at the same time.
 * - [`Animated.sequence()`](docs/animated.html#sequence) starts the animations
 *   in order, waiting for each to complete before starting the next.
 * - [`Animated.stagger()`](docs/animated.html#stagger) starts animations in
 *   order and in parallel, but with successive delays.
 *
 * Animations can also be chained together simply by setting the `toValue` of
 * one animation to be another `Animated.Value`. See
 * [Tracking dynamic values](docs/animations.html#tracking-dynamic-values) in
 * the Animations guide.
 *
 * By default, if one animation is stopped or interrupted, then all other
 * animations in the group are also stopped.
 *
 * ### Combining animated values
 *
 * You can combine two animated values via addition, multiplication, division,
 * or modulo to make a new animated value:
 *
 * - [`Animated.add()`](docs/animated.html#add)
 * - [`Animated.divide()`](docs/animated.html#divide)
 * - [`Animated.modulo()`](docs/animated.html#modulo)
 * - [`Animated.multiply()`](docs/animated.html#multiply)
 *
 * ### Interpolation
 *
 * The `interpolate()` function allows input ranges to map to different output
 * ranges. By default, it will extrapolate the curve beyond the ranges given,
 * but you can also have it clamp the output value. It uses lineal interpolation
 * by default but also supports easing functions.
 *
 * - [`interpolate()`](docs/animated.html#interpolate)
 *
 * Read more about interpolation in the
 * [Animation](docs/animations.html#interpolation) guide.
 *
 * ### Handling gestures and other events
 *
 * Gestures, like panning or scrolling, and other events can map directly to
 * animated values using `Animated.event()`. This is done with a structured map
 * syntax so that values can be extracted from complex event objects. The first
 * level is an array to allow mapping across multiple args, and that array
 * contains nested objects.
 *
 * - [`Animated.event()`](docs/animated.html#event)
 *
 * For example, when working with horizontal scrolling gestures, you would do
 * the following in order to map `event.nativeEvent.contentOffset.x` to
 * `scrollX` (an `Animated.Value`):
 *
 * ```javascript
 *  onScroll={Animated.event(
 *    // scrollX = e.nativeEvent.contentOffset.x
 *    [{ nativeEvent: {
 *         contentOffset: {
 *           x: scrollX
 *         }
 *       }
 *     }]
 *  )}
 * ```
 *
 */
module.exports = {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   *
   * See also [`AnimatedValue`](docs/animated.html#animatedvalue).
   */
  Value: AnimatedValue,
  /**
   * 2D value class for driving 2D animations, such as pan gestures.
   *
   * See also [`AnimatedValueXY`](docs/animated.html#animatedvaluexy).
   */
  ValueXY: AnimatedValueXY,
  /**
   * exported to use the Interpolation type in flow
   *
   * See also [`AnimatedInterpolation`](docs/animated.html#animatedinterpolation).
   */
  Interpolation: AnimatedInterpolation,

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   *
   * Config is an object that may have the following options:
   *
   *   - `velocity`: Initial velocity.  Required.
   *   - `deceleration`: Rate of decay.  Default 0.997.
   *   - `useNativeDriver`: Uses the native driver when true. Default false.
   */
  decay,
  /**
   * Animates a value along a timed easing curve. The
   * [`Easing`](docs/easing.html) module has tons of predefined curves, or you
   * can use your own function.
   *
   * Config is an object that may have the following options:
   *
   *   - `duration`: Length of animation (milliseconds).  Default 500.
   *   - `easing`: Easing function to define curve.
   *     Default is `Easing.inOut(Easing.ease)`.
   *   - `delay`: Start the animation after delay (milliseconds).  Default 0.
   *   - `useNativeDriver`: Uses the native driver when true. Default false.
   */
  timing,
  /**
   * Spring animation based on Rebound and
   * [Origami](https://facebook.github.io/origami/).  Tracks velocity state to
   * create fluid motions as the `toValue` updates, and can be chained together.
   *
   * Config is an object that may have the following options. Note that you can
   * only define bounciness/speed or tension/friction but not both:
   *
   *   - `friction`: Controls "bounciness"/overshoot.  Default 7.
   *   - `tension`: Controls speed.  Default 40.
   *   - `speed`: Controls speed of the animation. Default 12.
   *   - `bounciness`: Controls bounciness. Default 8.
   *   - `useNativeDriver`: Uses the native driver when true. Default false.
   */
  spring,

  /**
   * Creates a new Animated value composed from two Animated values added
   * together.
   */
  add,

  /**
   * Creates a new Animated value composed by dividing the first Animated value
   * by the second Animated value.
   */
  divide,

  /**
   * Creates a new Animated value composed from two Animated values multiplied
   * together.
   */
  multiply,

  /**
   * Creates a new Animated value that is the (non-negative) modulo of the
   * provided Animated value
   */
  modulo,

  /**
   * Create a new Animated value that is limited between 2 values. It uses the
   * difference between the last value so even if the value is far from the bounds
   * it will start changing when the value starts getting closer again.
   * (`value = clamp(value + diff, min, max)`).
   *
   * This is useful with scroll events, for example, to show the navbar when
   * scrolling up and to hide it when scrolling down.
   */
  diffClamp,

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
  * Loops a given animation continuously, so that each time it reaches the
  * end, it resets and begins again from the start. Can specify number of
  * times to loop using the key 'iterations' in the config. Will loop without
  * blocking the UI thread if the child animation is set to 'useNativeDriver'.
  */
  loop,

  /**
   * Takes an array of mappings and extracts values from each arg accordingly,
   * then calls `setValue` on the mapped outputs.  e.g.
   *
   *```javascript
   *  onScroll={Animated.event(
   *    [{nativeEvent: {contentOffset: {x: this._scrollX}}}],
   *    {listener},          // Optional async listener
   *  )}
   *  ...
   *  onPanResponderMove: Animated.event([
   *    null,                // raw event arg ignored
   *    {dx: this._panX},    // gestureState arg
   *  ]),
   *```
   *
   * Config is an object that may have the following options:
   *
   *   - `listener`: Optional async listener.
   *   - `useNativeDriver`: Uses the native driver when true. Default false.
   */
  event,

  /**
   * Make any React component Animatable.  Used to create `Animated.View`, etc.
   */
  createAnimatedComponent,

  /**
   * Imperative API to attach an animated value to an event on a view. Prefer using
   * `Animated.event` with `useNativeDrive: true` if possible.
   */
  attachNativeEvent,

  /**
   * Advanced imperative API for snooping on animated events that are passed in through props. Use
   * values directly where possible.
   */
  forkEvent,
  unforkEvent,

  __PropsOnlyForTests: AnimatedProps,
};
