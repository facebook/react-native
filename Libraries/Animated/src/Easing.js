/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

let ease;

/**
 * The `Easing` module implements common easing functions. This module is used
 * by [Animate.timing()](docs/animate.html#timing) to convey physically
 * believable motion in animations.
 *
 * You can find a visualization of some common easing functions at
 * http://easings.net/
 *
 * ### Predefined animations
 *
 * The `Easing` module provides several predefined animations through the
 * following methods:
 *
 * - [`back`](docs/easing.html#back) provides a simple animation where the
 *   object goes slightly back before moving forward
 * - [`bounce`](docs/easing.html#bounce) provides a bouncing animation
 * - [`ease`](docs/easing.html#ease) provides a simple inertial animation
 * - [`elastic`](docs/easing.html#elastic) provides a simple spring interaction
 *
 * ### Standard functions
 *
 * Three standard easing functions are provided:
 *
 * - [`linear`](docs/easing.html#linear)
 * - [`quad`](docs/easing.html#quad)
 * - [`cubic`](docs/easing.html#cubic)
 *
 * The [`poly`](docs/easing.html#poly) function can be used to implement
 * quartic, quintic, and other higher power functions.
 *
 * ### Additional functions
 *
 * Additional mathematical functions are provided by the following methods:
 *
 * - [`bezier`](docs/easing.html#bezier) provides a cubic bezier curve
 * - [`circle`](docs/easing.html#circle) provides a circular function
 * - [`sin`](docs/easing.html#sin) provides a sinusoidal function
 * - [`exp`](docs/easing.html#exp) provides an exponential function
 *
 * The following helpers are used to modify other easing functions.
 *
 * - [`in`](docs/easing.html#in) runs an easing function forwards
 * - [`inOut`](docs/easing.html#inout) makes any easing function symmetrical
 * - [`out`](docs/easing.html#out) runs an easing function backwards
 */
class Easing {
  /**
   * A stepping function, returns 1 for any positive value of `n`.
   */
  static step0(n: number) {
    return n > 0 ? 1 : 0;
  }

  /**
   * A stepping function, returns 1 if `n` is greater than or equal to 1.
   */
  static step1(n: number) {
    return n >= 1 ? 1 : 0;
  }

  /**
   * A linear function, `f(t) = t`. Position correlates to elapsed time one to
   * one.
   *
   * http://cubic-bezier.com/#0,0,1,1
   */
  static linear(t: number) {
    return t;
  }

  /**
   * A simple inertial interaction, similar to an object slowly accelerating to
   * speed.
   *
   * http://cubic-bezier.com/#.42,0,1,1
   */
  static ease(t: number): number {
    if (!ease) {
      ease = Easing.bezier(0.42, 0, 1, 1);
    }
    return ease(t);
  }

  /**
   * A quadratic function, `f(t) = t * t`. Position equals the square of elapsed
   * time.
   *
   * http://easings.net/#easeInQuad
   */
  static quad(t: number) {
    return t * t;
  }

  /**
   * A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed
   * time.
   *
   * http://easings.net/#easeInCubic
   */
  static cubic(t: number) {
    return t * t * t;
  }

  /**
   * A power function. Position is equal to the Nth power of elapsed time.
   *
   * n = 4: http://easings.net/#easeInQuart
   * n = 5: http://easings.net/#easeInQuint
   */
  static poly(n: number) {
    return (t: number) => Math.pow(t, n);
  }

  /**
   * A sinusoidal function.
   *
   * http://easings.net/#easeInSine
   */
  static sin(t: number) {
    return 1 - Math.cos((t * Math.PI) / 2);
  }

  /**
   * A circular function.
   *
   * http://easings.net/#easeInCirc
   */
  static circle(t: number) {
    return 1 - Math.sqrt(1 - t * t);
  }

  /**
   * An exponential function.
   *
   * http://easings.net/#easeInExpo
   */
  static exp(t: number) {
    return Math.pow(2, 10 * (t - 1));
  }

  /**
   * A simple elastic interaction, similar to a spring oscillating back and
   * forth.
   *
   * Default bounciness is 1, which overshoots a little bit once. 0 bounciness
   * doesn't overshoot at all, and bounciness of N > 1 will overshoot about N
   * times.
   *
   * http://easings.net/#easeInElastic
   */
  static elastic(bounciness: number = 1): (t: number) => number {
    const p = bounciness * Math.PI;
    return t => 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  }

  /**
   * Use with `Animated.parallel()` to create a simple effect where the object
   * animates back slightly as the animation starts.
   *
   * Wolfram Plot:
   *
   * - http://tiny.cc/back_default (s = 1.70158, default)
   */
  static back(s: number): (t: number) => number {
    if (s === undefined) {
      s = 1.70158;
    }
    return t => t * t * ((s + 1) * t - s);
  }

  /**
   * Provides a simple bouncing effect.
   *
   * http://easings.net/#easeInBounce
   */
  static bounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    }

    if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    }

    if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    }

    t -= 2.625 / 2.75;
    return 7.5625 * t * t + 0.984375;
  }

  /**
   * Provides a cubic bezier curve, equivalent to CSS Transitions'
   * `transition-timing-function`.
   *
   * A useful tool to visualize cubic bezier curves can be found at
   * http://cubic-bezier.com/
   */
  static bezier(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): (t: number) => number {
    const _bezier = require('bezier');
    return _bezier(x1, y1, x2, y2);
  }

  /**
   * Runs an easing function forwards.
   */
  static in(easing: (t: number) => number): (t: number) => number {
    return easing;
  }

  /**
   * Runs an easing function backwards.
   */
  static out(easing: (t: number) => number): (t: number) => number {
    return t => 1 - easing(1 - t);
  }

  /**
   * Makes any easing function symmetrical. The easing function will run
   * forwards for half of the duration, then backwards for the rest of the
   * duration.
   */
  static inOut(easing: (t: number) => number): (t: number) => number {
    return t => {
      if (t < 0.5) {
        return easing(t * 2) / 2;
      }
      return 1 - easing((1 - t) * 2) / 2;
    };
  }
}

module.exports = Easing;
