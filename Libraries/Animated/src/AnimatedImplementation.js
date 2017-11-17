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
 * @format
 * @preventMunge
 */
'use strict';

const {AnimatedEvent, attachNativeEvent} = require('./AnimatedEvent');
const AnimatedAddition = require('./nodes/AnimatedAddition');
const AnimatedDiffClamp = require('./nodes/AnimatedDiffClamp');
const AnimatedDivision = require('./nodes/AnimatedDivision');
const AnimatedInterpolation = require('./nodes/AnimatedInterpolation');
const AnimatedModulo = require('./nodes/AnimatedModulo');
const AnimatedMultiplication = require('./nodes/AnimatedMultiplication');
const AnimatedNode = require('./nodes/AnimatedNode');
const AnimatedProps = require('./nodes/AnimatedProps');
const AnimatedTracking = require('./nodes/AnimatedTracking');
const AnimatedValue = require('./nodes/AnimatedValue');
const AnimatedValueXY = require('./nodes/AnimatedValueXY');
const DecayAnimation = require('./animations/DecayAnimation');
const SpringAnimation = require('./animations/SpringAnimation');
const TimingAnimation = require('./animations/TimingAnimation');

const createAnimatedComponent = require('./createAnimatedComponent');

import type {
  AnimationConfig,
  EndCallback,
  EndResult,
} from './animations/Animation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';
import type {Mapping, EventConfig} from './AnimatedEvent';

type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
};

const add = function(
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedAddition {
  return new AnimatedAddition(a, b);
};

const divide = function(
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedDivision {
  return new AnimatedDivision(a, b);
};

const multiply = function(
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedMultiplication {
  return new AnimatedMultiplication(a, b);
};

const modulo = function(a: AnimatedNode, modulus: number): AnimatedModulo {
  return new AnimatedModulo(a, modulus);
};

const diffClamp = function(
  a: AnimatedNode,
  min: number,
  max: number,
): AnimatedDiffClamp {
  return new AnimatedDiffClamp(a, min, max);
};

const _combineCallbacks = function(
  callback: ?EndCallback,
  config: AnimationConfig,
) {
  if (callback && config.onComplete) {
    return (...args) => {
      config.onComplete && config.onComplete(...args);
      callback && callback(...args);
    };
  } else {
    return callback || config.onComplete;
  }
};

const maybeVectorAnim = function(
  value: AnimatedValue | AnimatedValueXY,
  config: Object,
  anim: (value: AnimatedValue, config: Object) => CompositeAnimation,
): ?CompositeAnimation {
  if (value instanceof AnimatedValueXY) {
    const configX = {...config};
    const configY = {...config};
    for (const key in config) {
      const {x, y} = config[key];
      if (x !== undefined && y !== undefined) {
        configX[key] = x;
        configY[key] = y;
      }
    }
    const aX = anim((value: AnimatedValueXY).x, configX);
    const aY = anim((value: AnimatedValueXY).y, configY);
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallel([aX, aY], {stopTogether: false});
  }
  return null;
};

const spring = function(
  value: AnimatedValue | AnimatedValueXY,
  config: SpringAnimationConfig,
): CompositeAnimation {
  const start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: SpringAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof AnimatedNode) {
      singleValue.track(
        new AnimatedTracking(
          singleValue,
          configuration.toValue,
          SpringAnimation,
          singleConfig,
          callback,
        ),
      );
    } else {
      singleValue.animate(new SpringAnimation(singleConfig), callback);
    }
  };
  return (
    maybeVectorAnim(value, config, spring) || {
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
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function(): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  const start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: TimingAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof AnimatedNode) {
      singleValue.track(
        new AnimatedTracking(
          singleValue,
          configuration.toValue,
          TimingAnimation,
          singleConfig,
          callback,
        ),
      );
    } else {
      singleValue.animate(new TimingAnimation(singleConfig), callback);
    }
  };

  return (
    maybeVectorAnim(value, config, timing) || {
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
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function(): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const decay = function(
  value: AnimatedValue | AnimatedValueXY,
  config: DecayAnimationConfig,
): CompositeAnimation {
  const start = function(
    animatedValue: AnimatedValue | AnimatedValueXY,
    configuration: DecayAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    singleValue.animate(new DecayAnimation(singleConfig), callback);
  };

  return (
    maybeVectorAnim(value, config, decay) || {
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
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function(): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const sequence = function(
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  let current = 0;
  return {
    start: function(callback?: ?EndCallback) {
      const onComplete = function(result) {
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
      throw new Error(
        'Loops run using the native driver cannot contain Animated.sequence animations',
      );
    },

    _isUsingNativeDriver: function(): boolean {
      return false;
    },
  };
};

type ParallelConfig = {
  stopTogether?: boolean, // If one is stopped, stop all.  default: true
};
const parallel = function(
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  let doneCount = 0;
  // Make sure we only call stop() at most once for each animation
  const hasEnded = {};
  const stopTogether = !(config && config.stopTogether === false);

  const result = {
    start: function(callback?: ?EndCallback) {
      if (doneCount === animations.length) {
        callback && callback({finished: true});
        return;
      }

      animations.forEach((animation, idx) => {
        const cb = function(endResult) {
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
      throw new Error(
        'Loops run using the native driver cannot contain Animated.parallel animations',
      );
    },

    _isUsingNativeDriver: function(): boolean {
      return false;
    },
  };

  return result;
};

const delay = function(time: number): CompositeAnimation {
  // Would be nice to make a specialized implementation
  return timing(new AnimatedValue(0), {toValue: 0, delay: time, duration: 0});
};

const stagger = function(
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return parallel(
    animations.map((animation, i) => {
      return sequence([delay(time * i), animation]);
    }),
  );
};

type LoopAnimationConfig = {iterations: number};

const loop = function(
  animation: CompositeAnimation,
  {iterations = -1}: LoopAnimationConfig = {},
): CompositeAnimation {
  let isFinished = false;
  let iterationsSoFar = 0;
  return {
    start: function(callback?: ?EndCallback) {
      const restart = function(result: EndResult = {finished: true}): void {
        if (
          isFinished ||
          iterationsSoFar === iterations ||
          result.finished === false
        ) {
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
      throw new Error(
        'Loops run using the native driver cannot contain Animated.loop animations',
      );
    },

    _isUsingNativeDriver: function(): boolean {
      return animation._isUsingNativeDriver();
    },
  };
};

function forkEvent(
  event: ?AnimatedEvent | ?Function,
  listener: Function,
): AnimatedEvent | Function {
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

function unforkEvent(
  event: ?AnimatedEvent | ?Function,
  listener: Function,
): void {
  if (event && event instanceof AnimatedEvent) {
    event.__removeListener(listener);
  }
}

const event = function(argMapping: Array<?Mapping>, config?: EventConfig): any {
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
 * See http://facebook.github.io/react-native/docs/animated.html
 */
module.exports = {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   *
   * See also `AnimatedValue`.
   * 
   * See http://facebook.github.io/react-native/docs/animated.html#value
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
   * Exported for ease of type checking. All animated values derive from this class.
   */
  Node: AnimatedNode,

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   *
   * Config is an object that may have the following options:
   *
   *   - `velocity`: Initial velocity.  Required.
   *   - `deceleration`: Rate of decay.  Default 0.997.
   *   - `isInteraction`: Whether or not this animation creates an "interaction handle" on the
   *     `InteractionManager`. Default true.
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
   *   - `isInteraction`: Whether or not this animation creates an "interaction handle" on the
   *     `InteractionManager`. Default true.
   *   - `useNativeDriver`: Uses the native driver when true. Default false.
   */
  timing,
  /**
   * Animates a value according to an analytical spring model based on
   * [damped harmonic oscillation](https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
   * Tracks velocity state to create fluid motions as the `toValue` updates, and
   * can be chained together.
   *
   * Config is an object that may have the following options.
   *
   * Note that you can only define one of bounciness/speed, tension/friction, or
   * stiffness/damping/mass, but not more than one:
   *
   * The friction/tension or bounciness/speed options match the spring model in
   * [Facebook Pop](https://github.com/facebook/pop), [Rebound](http://facebook.github.io/rebound/),
   * and [Origami](http://origami.design/).
   *
   *   - `friction`: Controls "bounciness"/overshoot.  Default 7.
   *   - `tension`: Controls speed.  Default 40.
   *   - `speed`: Controls speed of the animation. Default 12.
   *   - `bounciness`: Controls bounciness. Default 8.
   *
   * Specifying stiffness/damping/mass as parameters makes `Animated.spring` use an
   * analytical spring model based on the motion equations of a [damped harmonic
   * oscillator](https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
   * This behavior is slightly more precise and faithful to the physics behind
   * spring dynamics, and closely mimics the implementation in iOS's
   * CASpringAnimation primitive.
   *
   *   - `stiffness`: The spring stiffness coefficient. Default 100.
   *   - `damping`: Defines how the spring’s motion should be damped due to the forces of friction.
   *     Default 10.
   *   - `mass`: The mass of the object attached to the end of the spring. Default 1.
   *
   * Other configuration options are as follows:
   *
   *   - `velocity`: The initial velocity of the object attached to the spring. Default 0 (object
   *     is at rest).
   *   - `overshootClamping`: Boolean indiciating whether the spring should be clamped and not
   *     bounce. Default false.
   *   - `restDisplacementThreshold`: The threshold of displacement from rest below which the
   *     spring should be considered at rest. Default 0.001.
   *   - `restSpeedThreshold`: The speed at which the spring should be considered at rest in pixels
   *     per second. Default 0.001.
   *   - `delay`: Start the animation after delay (milliseconds).  Default 0.
   *   - `isInteraction`: Whether or not this animation creates an "interaction handle" on the
   *     `InteractionManager`. Default true.
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
  * times to loop using the key `iterations` in the config. Will loop without
  * blocking the UI thread if the child animation is set to `useNativeDriver: true`.
  * In addition, loops can prevent `VirtualizedList`-based components from rendering
  * more rows while the animation is running. You can pass `isInteraction: false` in the
  * child animation config to fix this.
  */
  loop,

  /**
   * Takes an array of mappings and extracts values from each arg accordingly,
   * then calls `setValue` on the mapped outputs.  e.g.
   *
   *```javascript
   *  onScroll={Animated.event(
   *    [{nativeEvent: {contentOffset: {x: this._scrollX}}}],
   *    {listener: (event) => console.log(event)}, // Optional async listener
   *  )}
   *  ...
   *  onPanResponderMove: Animated.event([
   *    null,                // raw event arg ignored
   *    {dx: this._panX},    // gestureState arg
        {listener: (event, gestureState) => console.log(event, gestureState)}, // Optional async listener
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
