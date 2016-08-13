/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Easing
 * @flow
 */
'use strict';

let ease;

/**
 * This class implements common easing functions. The math is pretty obscure,
 * but this cool website has nice visual illustrations of what they represent:
 * http://xaedes.de/dev/transitions/
 */
class Easing {
  static step0(n) {
    return n > 0 ? 1 : 0;
  }

  static step1(n) {
    return n >= 1 ? 1 : 0;
  }

  static linear(t) {
    return t;
  }

  static ease(t: number): number {
    if (!ease) {
      ease = Easing.bezier(0.42, 0, 1, 1);
    }
    return ease(t);
  }

  static quad(t) {
    return t * t;
  }

  static cubic(t) {
    return t * t * t;
  }

  static poly(n) {
    return (t) => Math.pow(t, n);
  }

  static sin(t) {
    return 1 - Math.cos(t * Math.PI / 2);
  }

  static circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }

  static exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }

  /**
   * A simple elastic interaction, similar to a spring.  Default bounciness
   * is 1, which overshoots a little bit once.  0 bounciness doesn't overshoot
   * at all, and bounciness of N > 1 will overshoot about N times.
   *
   * Wolfram Plots:
   *
   *   http://tiny.cc/elastic_b_1 (default bounciness = 1)
   *   http://tiny.cc/elastic_b_3 (bounciness = 3)
   */
  static elastic(bounciness: number = 1): (t: number) => number {
    const p = bounciness * Math.PI;
    return (t) => 1 - Math.pow(Math.cos(t * Math.PI / 2), 3) * Math.cos(t * p);
  }

  static back(s: number): (t: number) => number {
    if (s === undefined) {
      s = 1.70158;
    }
    return (t) => t * t * ((s + 1) * t - s);
  }

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

  static bezier(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): (t: number) => number {
    const _bezier = require('bezier');
    return _bezier(x1, y1, x2, y2);
  }

  static in(
    easing: (t: number) => number,
  ): (t: number) => number {
    return easing;
  }

  /**
   * Runs an easing function backwards.
   */
  static out(
    easing: (t: number) => number,
  ): (t: number) => number {
    return (t) => 1 - easing(1 - t);
  }

  /**
   * Makes any easing function symmetrical.
   */
  static inOut(
    easing: (t: number) => number,
  ): (t: number) => number {
    return (t) => {
      if (t < 0.5) {
        return easing(t * 2) / 2;
      }
      return 1 - easing((1 - t) * 2) / 2;
    };
  }
}

module.exports = Easing;
