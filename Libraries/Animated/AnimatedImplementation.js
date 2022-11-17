/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {EventConfig, Mapping} from './AnimatedEvent';
import type {
  AnimationConfig,
  EndCallback,
  EndResult,
} from './animations/Animation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';

import {AnimatedEvent, attachNativeEvent} from './AnimatedEvent';
import DecayAnimation from './animations/DecayAnimation';
import SpringAnimation from './animations/SpringAnimation';
import TimingAnimation from './animations/TimingAnimation';
import createAnimatedComponent from './createAnimatedComponent';
import AnimatedAddition from './nodes/AnimatedAddition';
import AnimatedColor from './nodes/AnimatedColor';
import AnimatedDiffClamp from './nodes/AnimatedDiffClamp';
import AnimatedDivision from './nodes/AnimatedDivision';
import AnimatedInterpolation from './nodes/AnimatedInterpolation';
import AnimatedModulo from './nodes/AnimatedModulo';
import AnimatedMultiplication from './nodes/AnimatedMultiplication';
import AnimatedNode from './nodes/AnimatedNode';
import AnimatedSubtraction from './nodes/AnimatedSubtraction';
import AnimatedTracking from './nodes/AnimatedTracking';
import AnimatedValue from './nodes/AnimatedValue';
import AnimatedValueXY from './nodes/AnimatedValueXY';

export type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
  ...
};

const add = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedAddition {
  return new AnimatedAddition(a, b);
};

const subtract = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedSubtraction {
  return new AnimatedSubtraction(a, b);
};

const divide = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedDivision {
  return new AnimatedDivision(a, b);
};

const multiply = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedMultiplication {
  return new AnimatedMultiplication(a, b);
};

const modulo = function (a: AnimatedNode, modulus: number): AnimatedModulo {
  return new AnimatedModulo(a, modulus);
};

const diffClamp = function (
  a: AnimatedNode,
  min: number,
  max: number,
): AnimatedDiffClamp {
  return new AnimatedDiffClamp(a, min, max);
};

const _combineCallbacks = function (
  callback: ?EndCallback,
  config: $ReadOnly<{...AnimationConfig, ...}>,
) {
  if (callback && config.onComplete) {
    return (...args: Array<EndResult>) => {
      config.onComplete && config.onComplete(...args);
      callback && callback(...args);
    };
  } else {
    return callback || config.onComplete;
  }
};

const maybeVectorAnim = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
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
  } else if (value instanceof AnimatedColor) {
    const configR = {...config};
    const configG = {...config};
    const configB = {...config};
    const configA = {...config};
    for (const key in config) {
      const {r, g, b, a} = config[key];
      if (
        r !== undefined &&
        g !== undefined &&
        b !== undefined &&
        a !== undefined
      ) {
        configR[key] = r;
        configG[key] = g;
        configB[key] = b;
        configA[key] = a;
      }
    }
    const aR = anim((value: AnimatedColor).r, configR);
    const aG = anim((value: AnimatedColor).g, configG);
    const aB = anim((value: AnimatedColor).b, configB);
    const aA = anim((value: AnimatedColor).a, configA);
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallel([aR, aG, aB, aA], {stopTogether: false});
  }
  return null;
};

const spring = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: SpringAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
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
      start: function (callback?: ?EndCallback): void {
        start(value, config, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const timing = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: TimingAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
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
      start: function (callback?: ?EndCallback): void {
        start(value, config, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const decay = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: DecayAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
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
      start: function (callback?: ?EndCallback): void {
        start(value, config, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return config.useNativeDriver || false;
      },
    }
  );
};

const sequence = function (
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  let current = 0;
  return {
    start: function (callback?: ?EndCallback) {
      const onComplete = function (result: EndResult) {
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

    stop: function () {
      if (current < animations.length) {
        animations[current].stop();
      }
    },

    reset: function () {
      animations.forEach((animation, idx) => {
        if (idx <= current) {
          animation.reset();
        }
      });
      current = 0;
    },

    _startNativeLoop: function () {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.sequence animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
      return false;
    },
  };
};

type ParallelConfig = {
  // If one is stopped, stop all.  default: true
  stopTogether?: boolean,
  ...
};
const parallel = function (
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  let doneCount = 0;
  // Make sure we only call stop() at most once for each animation
  const hasEnded: {[number]: boolean} = {};
  const stopTogether = !(config && config.stopTogether === false);

  const result = {
    start: function (callback?: ?EndCallback) {
      if (doneCount === animations.length) {
        callback && callback({finished: true});
        return;
      }

      animations.forEach((animation, idx) => {
        const cb = function (endResult: EndResult | {finished: boolean}) {
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

    stop: function (): void {
      animations.forEach((animation, idx) => {
        !hasEnded[idx] && animation.stop();
        hasEnded[idx] = true;
      });
    },

    reset: function (): void {
      animations.forEach((animation, idx) => {
        animation.reset();
        hasEnded[idx] = false;
        doneCount = 0;
      });
    },

    _startNativeLoop: function (): empty {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.parallel animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
      return false;
    },
  };

  return result;
};

const delay = function (time: number): CompositeAnimation {
  // Would be nice to make a specialized implementation
  return timing(new AnimatedValue(0), {
    toValue: 0,
    delay: time,
    duration: 0,
    useNativeDriver: false,
  });
};

const stagger = function (
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return parallel(
    animations.map((animation, i) => {
      return sequence([delay(time * i), animation]);
    }),
  );
};

type LoopAnimationConfig = {
  iterations: number,
  resetBeforeIteration?: boolean,
  ...
};

const loop = function (
  animation: CompositeAnimation,
  // $FlowFixMe[prop-missing]
  {iterations = -1, resetBeforeIteration = true}: LoopAnimationConfig = {},
): CompositeAnimation {
  let isFinished = false;
  let iterationsSoFar = 0;
  return {
    start: function (callback?: ?EndCallback) {
      const restart = function (result: EndResult = {finished: true}): void {
        if (
          isFinished ||
          iterationsSoFar === iterations ||
          result.finished === false
        ) {
          callback && callback(result);
        } else {
          iterationsSoFar++;
          resetBeforeIteration && animation.reset();
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

    stop: function (): void {
      isFinished = true;
      animation.stop();
    },

    reset: function (): void {
      iterationsSoFar = 0;
      isFinished = false;
      animation.reset();
    },

    _startNativeLoop: function () {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.loop animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
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

const event = function (
  argMapping: $ReadOnlyArray<?Mapping>,
  config: EventConfig,
): any {
  const animatedEvent = new AnimatedEvent(argMapping, config);
  if (animatedEvent.__isNative) {
    return animatedEvent;
  } else {
    return animatedEvent.__getHandler();
  }
};

// All types of animated nodes that represent scalar numbers and can be interpolated (etc)
type AnimatedNumeric =
  | AnimatedAddition
  | AnimatedDiffClamp
  | AnimatedDivision
  | AnimatedInterpolation<number>
  | AnimatedModulo
  | AnimatedMultiplication
  | AnimatedSubtraction
  | AnimatedValue;

export type {AnimatedNumeric as Numeric};

/**
 * The `Animated` library is designed to make animations fluid, powerful, and
 * easy to build and maintain. `Animated` focuses on declarative relationships
 * between inputs and outputs, with configurable transforms in between, and
 * simple `start`/`stop` methods to control time-based animation execution.
 * If additional transforms are added, be sure to include them in
 * AnimatedMock.js as well.
 *
 * See https://reactnative.dev/docs/animated
 */
export default {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   *
   * See https://reactnative.dev/docs/animated#value
   */
  Value: AnimatedValue,
  /**
   * 2D value class for driving 2D animations, such as pan gestures.
   *
   * See https://reactnative.dev/docs/animatedvaluexy
   */
  ValueXY: AnimatedValueXY,
  /**
   * Value class for driving color animations.
   */
  Color: AnimatedColor,
  /**
   * Exported to use the Interpolation type in flow.
   *
   * See https://reactnative.dev/docs/animated#interpolation
   */
  Interpolation: AnimatedInterpolation,
  /**
   * Exported for ease of type checking. All animated values derive from this
   * class.
   *
   * See https://reactnative.dev/docs/animated#node
   */
  Node: AnimatedNode,

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   *
   * See https://reactnative.dev/docs/animated#decay
   */
  decay,
  /**
   * Animates a value along a timed easing curve. The Easing module has tons of
   * predefined curves, or you can use your own function.
   *
   * See https://reactnative.dev/docs/animated#timing
   */
  timing,
  /**
   * Animates a value according to an analytical spring model based on
   * damped harmonic oscillation.
   *
   * See https://reactnative.dev/docs/animated#spring
   */
  spring,

  /**
   * Creates a new Animated value composed from two Animated values added
   * together.
   *
   * See https://reactnative.dev/docs/animated#add
   */
  add,

  /**
   * Creates a new Animated value composed by subtracting the second Animated
   * value from the first Animated value.
   *
   * See https://reactnative.dev/docs/animated#subtract
   */
  subtract,

  /**
   * Creates a new Animated value composed by dividing the first Animated value
   * by the second Animated value.
   *
   * See https://reactnative.dev/docs/animated#divide
   */
  divide,

  /**
   * Creates a new Animated value composed from two Animated values multiplied
   * together.
   *
   * See https://reactnative.dev/docs/animated#multiply
   */
  multiply,

  /**
   * Creates a new Animated value that is the (non-negative) modulo of the
   * provided Animated value.
   *
   * See https://reactnative.dev/docs/animated#modulo
   */
  modulo,

  /**
   * Create a new Animated value that is limited between 2 values. It uses the
   * difference between the last value so even if the value is far from the
   * bounds it will start changing when the value starts getting closer again.
   *
   * See https://reactnative.dev/docs/animated#diffclamp
   */
  diffClamp,

  /**
   * Starts an animation after the given delay.
   *
   * See https://reactnative.dev/docs/animated#delay
   */
  delay,
  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next. If the current running animation is stopped, no
   * following animations will be started.
   *
   * See https://reactnative.dev/docs/animated#sequence
   */
  sequence,
  /**
   * Starts an array of animations all at the same time. By default, if one
   * of the animations is stopped, they will all be stopped. You can override
   * this with the `stopTogether` flag.
   *
   * See https://reactnative.dev/docs/animated#parallel
   */
  parallel,
  /**
   * Array of animations may run in parallel (overlap), but are started in
   * sequence with successive delays.  Nice for doing trailing effects.
   *
   * See https://reactnative.dev/docs/animated#stagger
   */
  stagger,
  /**
   * Loops a given animation continuously, so that each time it reaches the
   * end, it resets and begins again from the start.
   *
   * See https://reactnative.dev/docs/animated#loop
   */
  loop,

  /**
   * Takes an array of mappings and extracts values from each arg accordingly,
   * then calls `setValue` on the mapped outputs.
   *
   * See https://reactnative.dev/docs/animated#event
   */
  event,

  /**
   * Make any React component Animatable.  Used to create `Animated.View`, etc.
   *
   * See https://reactnative.dev/docs/animated#createanimatedcomponent
   */
  createAnimatedComponent,

  /**
   * Imperative API to attach an animated value to an event on a view. Prefer
   * using `Animated.event` with `useNativeDrive: true` if possible.
   *
   * See https://reactnative.dev/docs/animated#attachnativeevent
   */
  attachNativeEvent,

  /**
   * Advanced imperative API for snooping on animated events that are passed in
   * through props. Use values directly where possible.
   *
   * See https://reactnative.dev/docs/animated#forkevent
   */
  forkEvent,
  unforkEvent,

  /**
   * Expose Event class, so it can be used as a type for type checkers.
   */
  Event: AnimatedEvent,
};
